# Component sources

The profile uses existing third-party components. The community update script adapts public GitHub data to Metrics' maintained classic EJS templates; the templates render the components.

| File / card | Maintainer | Updates |
| --- | --- | --- |
| `stats.svg` | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats), MIT | The maintainer-recommended [Stats Action](https://github.com/stats-organization/github-readme-stats-action) refreshes it daily. |
| `languages.svg` | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats), MIT | The same Stats Action refreshes the language card daily. It aggregates public non-fork repository language bytes, excluding this generated profile repository and the generated blog repository. |
| `metrics-community.svg` | [lowlighter/metrics](https://github.com/lowlighter/metrics), MIT | The workflow fetches the official stable templates and refreshes Notable Contributions and Follow-up from public GitHub REST data. |
| Technology badges | [Shields](https://shields.io/), CC0 | Embedded from the public badge API. |

The initial preview snapshots were generated on 2026-11-01 using the maintainers' Stats renderer and Metrics EJS templates. The scheduled community renderer uses the same upstream templates, populated with the complete public PR and issue search history for this account. It follows GitHub's `author:` search attribution, which can include Copilot PRs created on the account's behalf. External project badges list repositories with public PRs, including open and unmerged PRs; the follow-up bars distinguish PR states. Issue closures marked `not_planned` appear as skipped. Search must return complete results or the workflow fails; GitHub limits search results to 1,000 items per query.

The [workflow](https://github.com/3210448723/3210448723/actions/workflows/profile-components.yml) is scheduled for 03:17 UTC (11:17 Asia/Shanghai), can run manually, and runs after changes to the README or workflow are pushed. All three SVG files are regenerated together and committed only after validation. A failed component fails the run instead of silently skipping its update.

Only public information is intended. All authenticated requests use the repository's temporary `GITHUB_TOKEN`, and the community searches explicitly include `is:public`. This workflow does not request a personal token or private repository access. Avatar downloads receive no API token. Public API access is checked by executing the workflow before publishing the profile.

The images embedded by the profile are regenerated component outputs, not hard-coded data. GitHub schedules may be delayed and image caching may delay when a new version becomes visible. The timestamp of the latest successful workflow run is the refresh receipt; each component retains its own public-data query definition.
