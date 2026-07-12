---
title: Release Apache Doris Core with an AI Agent
language: en
description: "End-to-end Apache Doris Core release runbook for an AI Agent and Release Manager: preparation, packaging, signing, voting, completion, and website updates."
keywords:
    - Apache Doris Core release
    - AI Agent
    - Release Manager
    - Apache voting
    - SVN dist
    - GPG signing
    - release notes
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Release Apache Doris Core with an AI Agent

<!-- Knowledge type: Agent runbook -->
<!-- Applicable scenario: Apache Doris Core release / Release Manager assistant -->

This page is a Doris Core release runbook for AI Agents. Its goal is not to let an Agent make release decisions for the Release Manager. Its goal is to let an Agent guide the Release Manager step by step through an end-to-end release: prepare the branch and tag, create the RC source package, sign it, upload it to Apache dev SVN, start the vote, complete the formal release, and update the Doris website.

If you are the Agent, follow this document in order. For each step, explain the goal, the inputs that need Release Manager confirmation, the command you will run or ask the Release Manager to run, and the verifiable result that marks the step as complete.

## Scope and Boundaries

This document applies to Apache Doris Core, meaning the source release from the `apache/doris` repository. The release helper scripts live in the Doris repository:

```text
tools/release-tools/
```

The website update helper instructions live in the Doris Website repository:

```text
doc-tools/skills/add-release/SKILL.md
```

The Agent must respect these boundaries:

| Item | Requirement |
| --- | --- |
| Release decisions | The Release Manager and community make release decisions. The Agent only reminds, checks, and organizes information |
| ASF account and password | Do not write credentials to files, print them in logs, or commit them to Git |
| GPG private key and passphrase | The Release Manager manages them locally. The Agent must not ask for or store the passphrase |
| Public SVN writes | Before every write, ask the Release Manager to confirm the target URL and file list |
| Email sending | Scripts only generate email drafts. The Release Manager must review and send emails manually from an `@apache.org` address |
| Vote result | The Agent may help count votes, but the Release Manager must confirm that the result satisfies ASF voting rules |
| Convenience binaries | Scripts can sign local convenience binaries and generate checksums, but they do not upload binary packages |

## Inputs the Agent Must Collect First

Before starting the release flow, ask the Release Manager to confirm the following inputs. Do not proceed to packaging or upload if any key item is missing.

| Input | Example | Purpose |
| --- | --- | --- |
| Release version | `4.0.7` | Generates package names, website links, and release emails |
| RC number | `rc01` or `rc02` | Generates the Git tag and dev SVN directory |
| Git tag | `4.0.7-rc01` | Immutable source point for the release candidate |
| Release branch | `branch-4.0` | Confirms the tag comes from the expected branch |
| Apache ID | `morningman` | Used for SVN, KEYS, emails, and signing information |
| Apache email | `morningman@apache.org` | Used as the signer email in vote emails |
| Signing key | GPG fingerprint, or empty for auto-detection | Generates the `.asc` signature |
| Release Notes URL | GitHub issue or website release note URL | Used in vote emails and website updates |
| Convenience binaries | Local paths for `x64`, `x64-noavx2`, and `arm64` tarballs | Optional signing and vote email display |
| PMC release SVN permission | Yes, or requires PMC assistance | Required for the formal release SVN step |
| Website update timing | Now or later | Determines whether to run the Doris Website update flow |

After collecting the inputs, restate the release plan. For example:

```text
This release plan is for Apache Doris 4.0.7, RC rc01, tag 4.0.7-rc01.
The RC source artifacts will be uploaded to https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01/.
After the vote passes, the final source artifacts will be published to https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7/.
```

## Stage 1: Confirm Release Preparation

Do not jump straight into the helper scripts. First confirm that release preparation is complete. The Doris release helper scripts assume the following work has already been done:

1. The Release Manager has completed the release plan discussion in the community.
2. The release branch has been created.
3. Issues, PRs, and important bug fixes for the target version have been closed, merged, or deferred.
4. Required patches have been cherry-picked into the release branch.
5. QA or responsible maintainers have completed stability validation.
6. The branch can be built successfully.
7. Release Notes are ready, usually as a GitHub issue or Markdown document.
8. The Git tag has been created and pushed to the remote that points to `apache/doris`.

Ask the Release Manager to run these checks in the Doris repository:

```bash
git fetch --tags <apache-remote>
git rev-parse <version>-<rc>
git ls-remote --tags <apache-remote> refs/tags/<version>-<rc>
```

Completion criteria:

- The local tag exists.
- The Apache Doris GitHub remote has the same tag.
- The local tag and remote tag point to the same commit.
- The Release Manager confirms that the release branch, Release Notes, and validation work are ready.

If the tag does not exist or the tag commit does not match, stop the release flow and ask the Release Manager to fix the tag before continuing.

## Stage 2: Configure `release.env`

Ask the Release Manager to enter the release tools directory in the Doris repository:

```bash
cd tools/release-tools
```

Then edit `release.env`. For `4.0.7-rc01`, the key fields look like this:

```bash
VERSION="4.0.7"
RC="rc01"
TAG="${VERSION}-${RC}"
GIT_REMOTE="upstream-apache"

APACHE_ID="<your-apache-id>"
APACHE_EMAIL="<your-apache-id>@apache.org"
SIGNER_NAME="<your display name>"
SIGNING_KEY="<your signing key fingerprint, or empty if only one secret key exists>"

RELEASE_NOTES_URL="<release notes issue or page URL>"
ANNOUNCE_RELEASE_NOTES_URL="<release notes URL for announce email, or empty to reuse>"
```

Remind the Release Manager to check these derived values:

| Field | Expected value |
| --- | --- |
| `TAG` | Must include the RC suffix, such as `4.0.7-rc01` |
| `PKG_BASE` | Vote-stage source package name with the RC suffix, such as `apache-doris-4.0.7-rc01-src` |
| `RELEASE_PKG_BASE` | Final release source package name without the RC suffix, such as `apache-doris-4.0.7-src` |
| `DEV_SVN_DIR` | dev SVN RC directory, such as `https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01` |
| `RELEASE_SVN_DIR` | release SVN directory, such as `https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7` |
| `VERIFY_GUIDE_URL` | Points to the Doris release verification guide |

If the vote email needs to list convenience binaries, the Release Manager may put absolute local paths to binary tarballs in `BIN_FILES`. Explain the boundaries clearly:

- `02-package-sign-upload.sh` signs the files in `BIN_FILES` and generates `.asc` and `.sha512` files next to them.
- The script does not upload those binary packages to Apache dev SVN.
- The ASF vote artifacts are source-only release artifacts.

## Stage 3: Export ASF SVN Credentials

Ask the Release Manager to export ASF credentials in the current shell:

```bash
export ASF_USERNAME=<your-apache-id>
export ASF_PASSWORD='<your-apache-ldap-password>'
```

Do not ask the Release Manager to send the password to you. Do not write the password to `release.env`.

Completion criteria:

- `ASF_USERNAME` exists in the current shell.
- `ASF_PASSWORD` exists in the current shell.
- Neither variable is committed to Git.

## Stage 4: Check the Signing and Release Environment

Run:

```bash
./01-check-env.sh
```

This script checks:

- Required tools, including `git`, `gpg`, `svn`, `sha512sum`, `curl`, and `gzip`.
- Whether `GPG_TTY` is usable.
- Whether `gpg.conf` has SHA512 digest preferences.
- Whether a usable local GPG secret key exists.
- Whether the signing key appears in Doris KEYS.
- Whether local test signing and verification work.
- Whether ASF SVN credentials are present.

If the script asks to edit `gpg.conf`, import a key, generate a key, or publish KEYS, first explain what the script will modify. Then let the Release Manager decide whether to confirm.

The success line is:

```text
environment looks READY for <version>-<rc>
```

If this line does not appear, do not continue to packaging and upload.

## Stage 5: Package, Sign, and Upload the RC Source Artifacts

Before running the upload script, restate the target dev SVN URL:

```text
https://dist.apache.org/repos/dist/dev/doris/<version>-<rc>/
```

After the Release Manager confirms, run:

```bash
./02-package-sign-upload.sh
```

The script performs these actions:

1. Checks that the local tag exists.
2. Checks that the Apache Doris GitHub remote has the same tag.
3. Checks that the local tag and remote tag point to the same commit.
4. Creates a source tarball with `git archive`.
5. Generates the `.asc` GPG signature.
6. Generates the `.sha512` checksum.
7. Verifies the signature and checksum.
8. Optionally signs and checksums the convenience binaries listed in `BIN_FILES`.
9. After two confirmations, uploads the source tarball, `.asc`, and `.sha512` to Apache dev SVN.

At both confirmation points, remind the Release Manager to check:

- The target SVN URL is correct.
- The upload list contains only the source tarball, signature, and checksum.
- The file names include the RC suffix.
- The SVN commit message matches this RC.

Completion criteria:

- The dev SVN directory contains these three files:

```text
apache-doris-<version>-<rc>-src.tar.gz
apache-doris-<version>-<rc>-src.tar.gz.asc
apache-doris-<version>-<rc>-src.tar.gz.sha512
```

- The script ends by telling the Release Manager to run `./03-vote-mail.sh`.

If the version, tag, file name, or SVN URL is wrong before upload, stop and do not let the Release Manager confirm the commit.

## Stage 6: Generate and Send the `[VOTE]` Email

Run:

```bash
./03-vote-mail.sh
```

The script writes these files under `WORK_DIR`:

```text
vote-email.txt
vote-email.eml
```

Help the Release Manager review the email draft:

| Check item | Requirement |
| --- | --- |
| Subject | `[VOTE] Release Apache Doris <version>-<rc>` |
| GitHub tag link | Points to `https://github.com/apache/doris/releases/tag/<version>-<rc>` |
| Release Notes | Points to the Release Notes for this version |
| RC artifacts | Points to the dev SVN RC directory |
| PGP key | Fingerprint, Apache email, and KEYS URL are correct |
| Verify guide | Points to the Doris release verification guide |
| Vote duration | States that the vote is open for at least 72 hours |
| Convenience binaries | If present, URLs for the tarball, `.asc`, and `.sha512` are all correct |

The Release Manager must manually send the email from an `@apache.org` address to:

```text
dev@doris.apache.org
```

The Agent must not send the email automatically.

Completion criteria:

- The `[VOTE]` email has been sent to `dev@doris.apache.org`.
- The Release Manager records the vote start time.
- The vote remains open for at least 72 hours.

## Stage 7: Track the Vote and Send the `[RESULT]` Email

During the vote, help the Release Manager maintain a vote table:

| Voter | Apache ID | Vote | Binding | Notes |
| --- | --- | --- | --- | --- |
| `<name>` | `<apache-id>` | `+1` | yes/no | `<verification summary>` |

Remind the Release Manager:

- Only explicit replies count.
- The Release Manager has no implicit `+1`. If the Release Manager wants to vote, they must reply explicitly.
- PMC votes are binding. Other community votes are non-binding.
- The vote must remain open for at least 72 hours.
- The release generally needs at least 3 binding `+1` votes and more `+1` than `-1`.
- If there is a valid `-1` or a serious verification issue, the Release Manager should decide whether to cancel this RC and prepare a new RC.

After the vote passes, the Release Manager sends the `[RESULT]` email manually. The Agent may draft the body, but the Release Manager must check the vote count, binding status, and mailing list thread links.

Completion criteria:

- The `[RESULT][VOTE]` email has been sent to `dev@doris.apache.org`.
- The Release Manager confirms that this RC passed.

## Stage 8: Publish the Final Source Artifacts and Generate the `[ANNOUNCE]` Email

Only run the completion script after the vote has passed and the `[RESULT]` email has been sent:

```bash
./04-release-complete.sh
```

The script:

1. Checks that the passed RC source tarball, signature, and checksum exist in dev SVN.
2. Checks that the target release SVN directory does not already exist.
3. Uses `svnmucc` to create the release SVN directory.
4. Moves the RC files from dev SVN to release SVN.
5. Removes the RC suffix from the final release file names.
6. Removes the RC directory from dev SVN.
7. Generates `announce-email.txt` and `announce-email.eml`.

Remind the Release Manager:

- Writing to release SVN usually requires PMC permission.
- The target release SVN directory must not include the RC suffix.
- The final source package file names must not include the RC suffix.
- This step removes the RC directory from dev SVN.
- The script asks for final confirmation before committing the SVN changes.

If the release SVN move has already been done and only the announce email needs to be regenerated, use:

```bash
./04-release-complete.sh --mail-only
```

Completion criteria:

- The release SVN directory contains these files:

```text
apache-doris-<version>-src.tar.gz
apache-doris-<version>-src.tar.gz.asc
apache-doris-<version>-src.tar.gz.sha512
```

- The corresponding `<version>-<rc>` directory has been removed from dev SVN.
- The announce email draft has been generated.

## Stage 9: Send the `[ANNOUNCE]` Email

Help the Release Manager review `announce-email.txt`:

| Check item | Requirement |
| --- | --- |
| Subject | `[ANNOUNCE] Apache Doris <version> release` |
| Download page | Points to `https://doris.apache.org/download/` |
| Source artifacts | Points to the release SVN final directory |
| Release Notes | Points to the final release notes |
| Signature | Uses the correct Release Manager name |

The Release Manager manually sends the announce email from an `@apache.org` address to:

```text
dev@doris.apache.org
```

Completion criteria:

- The `[ANNOUNCE]` email has been sent.
- The Release Manager saves the mailing list thread link for website or GitHub Release references.

## Stage 10: Update the Doris Website Release Information

After the release passes, go to the Doris Website repository and read:

```text
doc-tools/skills/add-release/SKILL.md
```

First collect or confirm these inputs:

| Input | Description |
| --- | --- |
| Version | For example, `4.0.7` |
| Release series | For example, `4.0` |
| Release note source | GitHub issue, Markdown body, or existing release note |
| Release date | Prefer the Apache download directory timestamp or announce date |
| Source package URL | `https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz` |
| Binary package URLs | `x64`, `x64-noavx2`, `arm64`, plus `.asc` and `.sha512` |
| Source filename suffix | Confirm whether the final source package has no RC suffix |
| Website positioning | Whether to update `Latest`, `Prev`, or historical releases only |
| Localization | By default, keep English and Chinese release notes aligned |

Typical files to update:

```text
src/constant/download.data.ts
releasenotes/v<series>/release-<version>.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<version>.md
releasenotes/all-release.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
sidebarsReleases.json
```

Check especially:

- Both `DORIS_VERSIONS` and `ALL_VERSIONS` include the new version.
- If the new version becomes the headline version, `VersionEnum.Latest` or `VersionEnum.Prev` is updated correctly.
- The source `source` and `version` fields generate a real source package URL.
- Every binary package has `.tar.gz`, `.asc`, and `.sha512` links.
- English and Chinese release notes have the same structure.
- `all-release.md` remains sorted in reverse chronological order by release date.
- `sidebarsReleases.json` includes the new release note ID and remains valid JSON.

Recommended validation commands:

```bash
curl -sI https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64-noavx2.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-arm64.tar.gz

git diff --check
node -e "JSON.parse(require('fs').readFileSync('sidebarsReleases.json','utf8')); console.log('sidebarsReleases.json ok')"
rg -n "<version>|release-<version>|apache-doris-<version>" src/constant/download.data.ts releasenotes i18n/zh-CN/docusaurus-plugin-content-docs-releases/current sidebarsReleases.json
```

If the Release Manager allows build validation, run the normal Docusaurus build or local validation command for the Doris Website repository. If the Release Manager explicitly skips the build, mention that in the final summary.

Completion criteria:

- The website download data includes the new version.
- English and Chinese release notes have been added or updated.
- The release index and sidebar have been updated.
- Source package, binary package, signature, and checksum links are reachable.
- Relevant validation commands pass, or skipped validation is clearly reported.

## Stage 11: Post-release Checks

Finally, help the Release Manager complete these checks:

| Check item | Requirement |
| --- | --- |
| Apache downloads | `https://downloads.apache.org/doris/<series>/<version>/` is reachable |
| Download page | The website `/download/` page shows the new version |
| Release notes | The website `/releases/` page shows the new release note |
| GitHub Release | The GitHub Release for the tag has been updated |
| Old versions | If required by website policy, old version links point to archive URLs |
| Mailing list | `[VOTE]`, `[RESULT]`, and `[ANNOUNCE]` thread links are saved |
| Source verification | The final download URL passes signature and checksum verification |

Use the final download URL for a sample verification:

```bash
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.asc
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.sha512
wget https://downloads.apache.org/doris/KEYS

gpg --import KEYS
gpg --verify apache-doris-<version>-src.tar.gz.asc apache-doris-<version>-src.tar.gz
sha512sum --check apache-doris-<version>-src.tar.gz.sha512
```

## Stop and Re-evaluate Conditions

If any of the following happens, advise the Release Manager to pause the release flow:

- The local tag and remote tag point to different commits.
- `01-check-env.sh` does not print `environment looks READY`.
- GPG signature or checksum verification fails.
- The dev SVN or release SVN target directory is not for this version.
- The vote has been open for less than 72 hours.
- There are fewer than 3 binding `+1` votes.
- There is an unresolved valid `-1`.
- A verifier finds unexpected binaries or build artifacts in the source package.
- LICENSE, NOTICE, or license header checks fail.
- Website links point to missing source packages, binary packages, signatures, or checksums.

If the issue requires a new RC, guide the Release Manager to:

1. Fix the release branch.
2. Create and push a new tag, such as moving from `rc01` to `rc02`.
3. Update `RC` and `TAG` in `release.env`.
4. Restart from Stage 4.

## Suggested Agent Reply Template

When the Release Manager says "start releasing Doris 4.0.7", the Agent can reply:

```text
I will guide you through the Doris Core release flow. First I need to confirm a few inputs:

1. Is this rc01 or a later RC?
2. Has the 4.0.7-rcXX tag already been created and pushed to apache/doris?
3. What is the Git remote name in your Doris checkout that points to apache/doris?
4. What is the Release Notes URL?
5. Should this vote email list convenience binaries?
6. Do you have release SVN write permission, or do you need a PMC member to help with the final release step?

After confirming these, I will check the tag and release.env, then run 01-check-env.sh. I will stop for your confirmation before any public SVN write or email send.
```

## Final Summary Template

After the release is complete, send the Release Manager a short summary:

```text
Apache Doris <version> release flow is complete.

- RC tag: <version>-<rc>
- Vote artifacts: <dev SVN URL>
- Release artifacts: <release SVN URL>
- Vote thread: <mail thread URL>
- Result thread: <mail thread URL>
- Announce thread: <mail thread URL>
- Website PR/commit: <URL or commit>
- Validation:
  - Signature/checksum: passed
  - Website links: passed
  - Docusaurus build: passed/skipped

Remaining manual follow-ups:
- <none or list remaining follow-ups>
```
