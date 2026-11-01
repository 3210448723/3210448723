# Component sources

The profile uses existing third-party components. It contains no custom chart generator.

| File / card | Maintainer | Updates |
| --- | --- | --- |
| `stats.svg` | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats), MIT | The maintainer-recommended [Stats Action](https://github.com/stats-organization/github-readme-stats-action) refreshes it daily. |
| `languages.svg` | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats), MIT | The same Stats Action refreshes the language card daily. It aggregates public non-fork repository language bytes, excluding the generated blog repository. |
| `metrics-community.svg` | [lowlighter/metrics](https://github.com/lowlighter/metrics), MIT | The official Action refreshes Notable Contributions and Follow-up when `METRICS_TOKEN` is configured. |
| Technology badges | [Shields](https://shields.io/), CC0 | Embedded from the public badge API. |

The initial preview snapshots were generated on 2026-11-01 from public GitHub REST responses using the unmodified maintainers' Stats renderer and Metrics EJS templates. The preview harness is outside this repository and is not needed by the scheduled workflow. The initial notable-contribution snapshot uses public PR history; the official Action uses GitHub's `repositoriesContributedTo` query, whose result set may differ from all-time search history.

The workflow is scheduled for 03:17 UTC and can also run manually. Only public information is intended: create a **classic PAT with no scopes selected** for `METRICS_TOKEN`, as described by [Metrics setup instructions](https://github.com/lowlighter/metrics/blob/master/.github/readme/partials/documentation/setup/action.md). Do not grant private repository access for this profile. The automatic repository token commits images; it is not the Metrics data token. If the Metrics token is absent, the existing community image remains available.

This draft has not been published and the workflow has not been run on GitHub. The preview checks do not verify a deployed workflow. Public service caches and each component's query window may delay updates.
