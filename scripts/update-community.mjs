import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import ejs from 'ejs';
import puppeteer from 'puppeteer-core';

const user = '3210448723';
const templateDir = path.resolve(process.env.METRICS_TEMPLATE_DIR || '.metrics-source/source/templates/classic');
const output = path.resolve('assets/metrics-community.svg');

async function request(url, authenticated = true) {
  const headers = { 'User-Agent': 'profile-components' };
  if (authenticated) {
    if (!url.startsWith('https://api.github.com/')) throw new Error('Unexpected API host');
    headers.Accept = 'application/vnd.github+json';
    headers['X-GitHub-Api-Version'] = '2022-11-28';
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const attempts = authenticated ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(authenticated ? 25000 : 8000) });
      if (!response.ok) {
        const message = authenticated ? (await response.json()).message : response.statusText;
        throw new Error(`GitHub request failed (${response.status}): ${message}`);
      }
      return response;
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

async function search(type) {
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const query = new URLSearchParams({ q: `is:${type} author:${user} is:public`, per_page: '100', page: String(page), sort: 'created', order: 'asc' });
    const data = await (await request(`https://api.github.com/search/issues?${query}`)).json();
    if (data.incomplete_results) throw new Error('Incomplete GitHub search result');
    items.push(...data.items);
    if (items.length === data.total_count) return items;
    if (!data.items.length) break;
  }
  throw new Error('GitHub search did not return the complete public history');
}

async function load() {
  if (process.env.PROFILE_DATA_DIR) {
    const dir = process.env.PROFILE_DATA_DIR;
    const prs = JSON.parse(await fs.readFile(path.join(dir, 'all-prs.json'), 'utf8'));
    const issues = JSON.parse(await fs.readFile(path.join(dir, 'all-issues.json'), 'utf8'));
    if (prs.items.length !== prs.total_count || issues.items.length !== issues.total_count) throw new Error('Incomplete local preview data');
    return [prs.items, issues.items];
  }
  return Promise.all([search('pr'), search('issue')]);
}

function aggregate(prs, issues) {
  const followup = {
    sections: ['user'],
    user: {
      issues: { open: 0, closed: 0, drafts: 0, skipped: 0, count: issues.length },
      pr: { open: 0, closed: 0, merged: 0, drafts: 0, count: prs.length },
    },
  };
  const handles = new Set();
  for (const pr of prs) {
    if (!pr.user?.login || !pr.pull_request || !['open', 'closed'].includes(pr.state)) throw new Error('Unexpected pull request data');
    const state = pr.pull_request.merged_at ? 'merged' : pr.state === 'closed' ? 'closed' : pr.draft ? 'drafts' : 'open';
    followup.user.pr[state]++;
    const handle = pr.repository_url?.replace('https://api.github.com/repos/', '');
    if (!handle || !/^[\w-]+\/[\w.-]+$/.test(handle)) throw new Error('Unexpected repository handle');
    if (handle.split('/')[0].toLowerCase() !== user) handles.add(handle);
  }
  for (const issue of issues) {
    if (!issue.user?.login || issue.pull_request || !['open', 'closed'].includes(issue.state)) throw new Error('Unexpected issue data');
    const state = issue.state === 'open' ? 'open' : issue.state_reason === 'not_planned' ? 'skipped' : 'closed';
    followup.user.issues[state]++;
  }
  for (const group of Object.values(followup.user)) {
    const { count, ...states } = group;
    if (count !== Object.values(states).reduce((a, b) => a + b, 0)) throw new Error('Inconsistent contribution totals');
  }
  return { followup, handles: [...handles].sort((a, b) => a.localeCompare(b)) };
}

async function avatar(owner) {
  try {
    const response = await request(`https://github.com/${owner}.png?size=32`, false);
    const type = response.headers.get('content-type');
    if (!type?.startsWith('image/')) throw new Error('Unexpected avatar response');
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
  } catch {
    // An unavailable avatar should not hide the project's public contribution badge.
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
  }
}

const [prs, issues] = await load();
const { followup, handles } = aggregate(prs, issues);
const contributions = await Promise.all(handles.map(async handle => ({
  name: handle, handle, organization: true, avatar: await avatar(handle.split('/')[0]),
})));
const context = {
  large: false, columns: false, animated: false,
  fonts: await fs.readFile(path.join(templateDir, 'fonts.css'), 'utf8'),
  style: await fs.readFile(path.join(templateDir, 'style.css'), 'utf8'),
  extras: { css: '.items-wrapper{line-height:1.5}@media(prefers-color-scheme:dark){svg{color:#c9d1d9}h1,h2,h3{color:#58a6ff}}' },
  warnings: [], partials: ['notable', 'followup'], base: { metadata: false },
  user: { login: user, name: 'YJM' }, account: 'user',
  plugins: { notable: { contributions, types: ['pull_request'] }, followup },
  s: count => count === 1 ? '' : 's', f: value => String(value),
};
let svg = await ejs.renderFile(path.join(templateDir, 'image.svg'), context, { async: true });
const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), 'profile-component-'));
const temporaryFile = path.join(temporaryDir, 'community.svg');
await fs.writeFile(temporaryFile, svg);
const browser = await puppeteer.launch({ channel: 'chrome', headless: true, args: process.env.CI ? ['--no-sandbox'] : [] });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(temporaryFile).href, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  // The default system font differs between CI and profile visitors. Measure
  // fallback fonts too, and include the wrapper's offset and overflowing text.
  const layout = await page.$eval('.items-wrapper', async element => {
    const originalFont = element.style.fontFamily;
    const fonts = ['', 'system-ui', 'Arial, sans-serif', 'sans-serif'];
    const bounds = () => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return Math.max(
        ...[element, ...element.querySelectorAll('*')].map(node => node.getBoundingClientRect().bottom),
        ...[...range.getClientRects()].map(rect => rect.bottom),
      );
    };
    const measurements = [];
    for (const font of fonts) {
      element.style.fontFamily = font;
      await document.fonts.ready;
      measurements.push({ font: font || 'upstream default', bottom: bounds() });
    }
    element.style.fontFamily = originalFont;
    return measurements;
  });
  const height = Math.ceil(Math.max(...layout.map(({ bottom }) => bottom))) + 16;
  if (!(height > 0 && height < 3000)) throw new Error('Unexpected Metrics component height');
  svg = svg.replace('height="99999"', `height="${height}"`);
  if (/\b(?:NaN|undefined)\b/.test(svg)) throw new Error('Invalid template output');
  // Check the final viewport as well: decoding an SVG alone does not detect
  // cropped legends. Fail the scheduled update instead of publishing one.
  await page.evaluate(height => document.documentElement.setAttribute('height', height), height);
  for (const { font } of layout) {
    const bottom = await page.$eval('.items-wrapper', (element, font) => {
      element.style.fontFamily = font === 'upstream default' ? '' : font;
      const range = document.createRange();
      range.selectNodeContents(element);
      return Math.max(...[...range.getClientRects()].map(rect => rect.bottom));
    }, font);
    if (bottom > height - 8) throw new Error(`Clipped Metrics content with ${font}`);
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(`${output}.tmp.svg`, svg);
  await fs.rename(`${output}.tmp.svg`, output);
  console.log(JSON.stringify({ publicPRs: prs.length, publicIssues: issues.length, externalProjects: handles.length, states: followup.user, height, layout }));
} finally {
  await browser.close();
  await fs.unlink(temporaryFile);
  await fs.rmdir(temporaryDir);
}
