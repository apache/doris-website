# Workflow security

These workflows protect repository credentials from contributors who have no write access. Such contributors may open fork PRs, modify workflow/action files in those PRs, change PR content, and post comments. None of those changes may execute with the upstream repository's secrets.

Repository writers remain trusted. They can configure workflows that use repository secrets; restricting that access would require an additional control such as a protected environment. This change does not require new environments, secret migration, or a GitHub App installation. Existing repository secret names and the existing `Production` deployment environment remain usable.

## Execution boundaries

| Workflow | Untrusted input | Credential boundary |
| --- | --- | --- |
| Fork PR checks | PR code, dependencies, workflow files, and local actions | Public fork PR runs receive no upstream repository secrets and have a read-only `GITHUB_TOKEN`. The checks have explicit read permissions and do not retain checkout credentials. |
| OpenCode Review | PR Git blobs and diffs, including any changed instructions or plugins | Authorization checks the comment author's current repository write permission. Trusted default-branch orchestration reads the PR as text. A checksum-verified OpenCode binary runs in a clean directory with external plugins and tools disabled, without inherited GitHub/OSS credentials. |
| Docs AI Review | PR content and parser output | Default-branch tooling and locked dependencies analyze the PR in a read-only job. PR dependencies and lifecycle scripts are not installed. A separate publisher treats its bounded JSON artifact as data. |
| Website and PDF publishing | Build output | A resolver accepts only protected repository branches and pins the source SHA. Build jobs have no environment secrets and only read access. Fresh `Production` jobs download artifacts and run deployment code from the master workflow commit. |
| Japanese/Korean/Russian translation | Source documents, open-PR metadata, and model output | The shared workflow runs from master, installs locked dependencies without lifecycle scripts, and retains the text-only model adapter. It uses the existing OSS and PAT/App secrets. Configuration checks receive credential-presence flags rather than raw credentials. |

`/review` and `/review-docs` must occupy a complete line. Organization membership alone does not authorize a privileged review. Even after a repository writer requests a review of a fork PR, the privileged jobs execute trusted orchestration; they do not execute the PR's workflow, local action, package scripts, instructions, or plugins.

Review publishers run on fresh runners with trusted code and only the token permission required to comment. They validate result types, sizes, and the current PR base/head commits. The OpenCode publisher also verifies inline locations against the reviewed diff and always submits a `COMMENT` review. Artifacts cannot select another PR, request approval, or execute commands.

OpenCode receives the trusted `AGENTS.md`, diffs, and changed text files. It cannot run validation commands or explore files outside the packet. Its summary must state those limits. PRs exceeding 150 changed files or 600,000 bytes of input require a smaller PR or manual review. Raw provider/model logs and authentication files are not uploaded as review artifacts.

Manual publishing must be dispatched from master. Its branch input can select another protected repository branch for a preview. PR refs, tags, unprotected branches, and path traversal are rejected. Both website and PDF uploads use `onlyUpload: true` and `skipSetting: true`.

## Verification

Run from the repository root after installing its locked Node dependencies:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v
node --test scripts/docs-governance/__tests__/*.test.js scripts/i18n/__tests__/translation-workflows.test.cjs scripts/i18n/__tests__/workflow.test.cjs scripts/i18n/__tests__/codex-adapter.test.cjs
actionlint -ignore 'unexpected key "queue" for "concurrency" section' .github/workflows/*.yml
```

The narrow actionlint exception covers GitHub's supported `concurrency.queue` property, which actionlint 1.7.12 does not yet recognize. All other workflow syntax and ShellCheck diagnostics remain enabled.

Tests cover command separation, repository permission checks, hostile file names and PR plugins, secret-free model environments, malformed artifacts, stale commits, inline diff validation, protected deployment refs, and compatibility with existing repository secrets. They use dummy credentials and mocked APIs; they do not call a model, post comments, or deploy the site.

After rollout, verify the privileged workflow on a fork PR that changes workflow/action files. Confirm that ordinary PR checks receive no upstream secrets and privileged jobs use the merged orchestration. Privileged comment workflows run from the default branch, so the new path requires a live verification after merge.

When updating action or runtime pins, verify upstream provenance and checksums. Keep authentication snapshots registered for log masking, and keep untrusted execution separate from credentialed jobs.
