# Component sources

The profile uses existing third-party components. It contains no custom chart generator.

| File / card | Maintainer | Updates |
| --- | --- | --- |
| `stats.svg` | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats), MIT | The maintainer-recommended [Stats Action](https://github.com/stats-organization/github-readme-stats-action) refreshes it daily. |
| `languages.svg` | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats), MIT | The same Stats Action refreshes the language card daily. It aggregates public non-fork repository language bytes, excluding the generated blog repository. |
| `metrics-community.svg` | [lowlighter/metrics](https://github.com/lowlighter/metrics), MIT | The official Action refreshes Notable Contributions and Follow-up on every workflow run. |
| Technology badges | [Shields](https://shields.io/), CC0 | Embedded from the public badge API. |

The initial preview snapshots were generated on 2026-11-01 from public GitHub REST responses using the unmodified maintainers' Stats renderer and Metrics EJS templates. The preview harness is outside this repository and is not needed by the scheduled workflow. The initial notable-contribution snapshot uses public PR history; the official Action uses GitHub's `repositoriesContributedTo` query, whose result set may differ from all-time search history.

The [workflow](https://github.com/3210448723/3210448723/actions/workflows/profile-components.yml) is scheduled for 03:17 UTC (11:17 Asia/Shanghai), can run manually, and runs after changes to the README or workflow are pushed. All three SVG files are regenerated together and committed only after validation. A failed component fails the run instead of silently skipping its update.

Only public information is intended. Both components use the repository's temporary `GITHUB_TOKEN`; this workflow does not request a personal token or private repository access. Public API access is checked by executing the workflow before publishing the profile. Metrics fetches one owned repository for its unused base context; the displayed PR contribution and user follow-up plugins use their own account-wide queries.

The images embedded by the profile are regenerated component outputs, not hard-coded data. GitHub schedules may be delayed and image caching may delay when a new version becomes visible. The timestamp of the latest successful workflow run is the refresh receipt; each component retains its own public-data query definition.
