# Security policy

Transformer is a public educational/model-engineering project with a browser-based visualizer. The deployed experience does not require user accounts, a production database, API keys, or a separate application backend.

No software is perfectly secure. This document explains how to report a problem and the boundaries that matter for this repository.

## Reporting a vulnerability

Please do **not** open a public issue containing credentials, exploit details, or a working proof of concept against the live deployment.

Preferred reporting path:

1. Use GitHub private vulnerability reporting from the repository's **Security** tab if it is available.
2. Otherwise, contact the repository owner privately through GitHub. If no private channel is available, open a minimal issue asking for a private contact method without including exploit details.

A useful report includes the affected component, impact, reproduction conditions, and the smallest proof needed to establish the issue.

## Scope

Security-sensitive surfaces include:

- the public Next.js visualizer
- browser-side ONNX execution and static model/activation assets
- dependency and build configuration
- GitHub Actions workflows
- repository content that could accidentally expose credentials or local deployment state

Third-party systems such as GitHub, Vercel, npm, PyPI, or the public Tiny Shakespeare source are not part of this project's security-testing scope.

## Repository hygiene

The repository intentionally excludes common secret-bearing and generated files from version control, including environment files, private keys, local Vercel state, virtual environments, Node dependencies, checkpoints, and training outputs.

The public visualizer is designed not to depend on application secrets. If a future feature introduces credentials, authentication, persistent user data, or server-side privileged actions, that feature should be reviewed as a new security boundary rather than inheriting the current assumptions.

## Automated checks

GitHub Actions verifies the visualizer from a clean dependency install and exercises a fresh model-training/sample path. The frontend dependency tree is also checked for high-severity published vulnerabilities.

Workflow permissions are read-only and third-party GitHub Actions are pinned to immutable commits to reduce supply-chain risk.

## Good-faith testing

Please avoid:

- denial-of-service or high-volume automated traffic against the live visualizer
- attempts to compromise Vercel, GitHub, npm, PyPI, or other third-party infrastructure
- publishing a vulnerability before there has been a reasonable opportunity to investigate it
- uploading or distributing malicious versions of project assets while presenting them as the official deployment

## License

Security research does not change the software license. Use and redistribution of the source remain governed by the repository's MIT License.
