---
title: Verify an Apache Release
language: en
description: "Apache Doris release verification procedure: download, signature check, source license check, compilation verification, and voting."
keywords:
    - Apache Doris
    - release verification
    - GPG signature
    - sha512 checksum
    - LICENSE check
    - skywalking-eyes
    - release vote
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

# Verify an Apache Release

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / verification and voting -->

This verification procedure applies to:

- Verifying a Release Candidate (RC) during a release vote.
- Checking the integrity of an already-published release.

This document uses Doris Core as the example. For other components, replace the names accordingly.

## Verification Checklist

All 7 items below must pass before you cast a +1 vote:

| No. | Check item | Verification method |
|------|--------|----------|
| 1 | Download link is legitimate | The link comes from `dist.apache.org` or `downloads.apache.org` |
| 2 | Checksum and PGP signature are valid | `gpg --verify` + `sha512sum --check` |
| 3 | Code matches the current release version | Compare the source code with the Git tag |
| 4 | LICENSE and NOTICE files are correct | Manual inspection |
| 5 | All files carry the required license header | `apache/skywalking-eyes` |
| 6 | The source package does not contain compiled content | Manually inspect `target/`, `build/`, and binary files |
| 7 | Compilation runs successfully | Follow the compilation documentation to build |

## 1. Download the Source Package, Signature File, Checksum File, and KEYS

Download all related files. The example uses `a.b.c-incubating`:

```shell
wget https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.sha512

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.asc

wget https://downloads.apache.org/incubator/doris/KEYS
```

> For vote verification, obtain the files from the SVN address provided in the vote email.

## 2. Check the Signature and Checksum

### 2.1 Install GnuPG

GnuPG is recommended. Install it with one of the following commands:

| System | Install command |
|------|----------|
| CentOS / RHEL | `yum install gnupg` |
| Ubuntu / Debian | `apt-get install gnupg` |

### 2.2 Import KEYS and Verify

The following example uses the Doris core release. Other releases are similar:

```shell
gpg --import KEYS
gpg --verify apache-doris-a.b.c-incubating-src.tar.gz.asc apache-doris-a.b.c-incubating-src.tar.gz
sha512sum --check apache-doris-a.b.c-incubating-src.tar.gz.sha512
```

> Note: If `gpg --import` fails with `no valid user IDs`, the GPG version may be incompatible. Upgrade to 2.2.x or later.

## 3. Verify Source License Headers

Use [skywalking-eyes](https://github.com/apache/skywalking-eyes) to verify license headers.

Enter the source root directory and run:

```shell
sudo docker run -it --rm -v $(pwd):/github/workspace apache/skywalking-eyes header check
```

Example output:

```text
INFO GITHUB_TOKEN is not set, license-eye won't comment on the pull request
INFO Loading configuraftion from file: .licenserc.yaml
INFO Totally checked 5611 files, valid: 3926, invalid: 0, ignored: 1685, fixed: 0
```

If `invalid` is 0, the check passes.

## 4. Verify Compilation

Refer to the compilation documentation for each component:

- Doris core compilation: see the [compilation documentation](/community/source-install/compilation-with-docker).
- Flink Doris Connector compilation: see the [Flink Doris Connector documentation](/docs/dev/connection-integration/data-integration/flink-doris-connector).
- Spark Doris Connector compilation: see the [Spark Doris Connector documentation](/docs/dev/connection-integration/data-integration/spark-doris-connector).

## 5. Voting

For details on voting, see the [ASF voting process](https://www.apache.org/foundation/voting.html).

After verification, you can reply to the vote email on the `dev@doris` mailing list with the following template:

```text
+1 (binding) or +1 (non-binding)

My Apache ID(optional): morningman

I checked:

[x] The download link is legal.
[x] The PGP signature are valid.
[x] The source code matches the current release version.
[x] The LICENSE and NOTICE files are correct.
[x] All files carry the necessary protocol header.
[x] The compiled content is not included in the source package.
[x] The compilation can be executed smoothly.

Other comments...
```

### 5.1 Key Voting Rules

| Rule | Description |
|------|------|
| Binding vote | Votes from PMC members are binding. Other votes are advisory |
| Pass condition | Majority approval: at least three +1 votes from PMC members, with more +1 than -1 |
| Vote duration | Open for at least 72 hours |
| No implicit +1 | Neither the Release Manager nor any voter has an implicit +1. Only explicit votes count |

PMC members hold binding votes, but the community encourages all members to vote, even if their votes are only advisory.

The Release Manager must check the validity of each vote. The PMC roster can be used to verify that email addresses match. Recommendations:

- Use an Apache email address when voting to ensure the vote is valid.
- Include your Apache ID in the vote so the Release Manager can tally votes more easily.

In general, if someone discovers a serious issue, the community will cancel the release vote. In most cases, however, the final decision rests with the Release Manager. The exact process can vary by project, but the **"minimum quorum of three +1 votes" rule is universal**.

Note: **Neither the Release Manager nor any other participant in an ASF vote has an implicit +1. Only explicit votes count.** The Release Manager is also encouraged to vote on the release.

## FAQ / Troubleshooting

### Q1: `gpg --verify` reports `gpg verify failed` or `BAD signature`

Possible causes:

- The KEYS file has not been imported. Run `gpg --import KEYS` first.
- The signature file does not match the source package. Confirm that the `.asc` and `.tar.gz` files are in the same directory and have matching version numbers.
- The source package was corrupted during download. Re-download and compare against the `.sha512` file.

### Q2: `gpg --import` reports `no valid user IDs`

The GPG version is too old. Upgrade to 2.2.x or later:

```shell
# Ubuntu
apt-get install gnupg2

# CentOS
yum install gnupg2
```

### Q3: `sha512sum --check` reports `shasum mismatch` or `FAILED`

The source package is corrupted or does not match the checksum file. Re-download the source package, confirm that the download completed (compare file sizes), and run the check again.

### Q4: skywalking-eyes reports `LICENSE check failed` or `invalid > 0`

Some files in the source code are missing license headers. Common causes:

- A newly added code file is missing the Apache License header.
- A third-party file has not been declared under `paths-ignore` in `.licenserc.yaml`.

The Release Manager must fix the issue and cut a new RC.

### Q5: Should I vote -1 if compilation fails?

If the compilation failure is caused by the release package itself (for example, missing files or dependency errors), vote -1 and include detailed reasons. If the failure is caused by a local environment issue (for example, missing dependencies or a wrong JDK version), troubleshoot the environment before making a decision.
