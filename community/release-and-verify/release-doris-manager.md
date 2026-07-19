---
title: Release Doris Manager
language: en
description: "Apache Doris Manager release process: branch management, tagging, packaging and signing, SVN upload, community vote, and IPMC vote."
keywords:
    - Apache Doris
    - Doris Manager
    - Release Process
    - Community Vote
    - IPMC Vote
    - GPG Signing
    - SVN Upload
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

# Release Doris Manager

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / Doris Manager release -->

The Doris Manager codebase is maintained separately from the main Doris codebase, at [apache/doris-manager](https://github.com/apache/doris-manager). This document describes the complete release process for Doris Manager.

## Release Process Overview

| Stage | Step | Purpose |
|------|------|------|
| Preparation | 1. Release preparation | Complete GPG keys, SVN access, and other prerequisites |
| Preparation | 2. Prepare the branch | Create the release branch and ensure feature stability |
| Preparation | 3. Clean up issues | Close completed items and defer unfinished items |
| Preparation | 4. Merge required patches | Evaluate and merge important patches |
| Verification | 5. Verify the branch | Stability testing and build verification |
| Vote | 6. Tag, package, sign, and upload | Produce the RC package and upload it to SVN |
| Vote | 7. dev@doris vote | Community vote |
| Vote | 8. IPMC vote | Incubator PMC vote |
| Wrap-up | 9. Complete the release | Archive, publish, and announce |

## 1. Prepare for Release

See the [Release preparation](./release-prepare) document to complete the pre-release work.

## 2. Prepare the Branch

Before releasing, create a new branch:

```shell
git checkout -b branch-1.0.0
```

After creating the branch, run thorough tests to confirm that:

- Features work as expected.
- Bugs are converging.
- All important bugs have been fixed.

During testing, wait for community feedback to determine whether any required patches need to be merged. If so, cherry-pick them into the release branch.

## 3. Clean Up Issues

Go through every issue that belongs to this release:

- Close issues that have been completed.
- Defer issues that cannot be completed to a later release.

## 4. Merge Required Patches

While waiting for the release, important patches may need to be merged. If the community reports an important bug that needs to be included, the Release Manager evaluates the fix and merges the patch into the release branch.

## 5. Verify the Branch

### 5.1 Stability Testing

Hand the prepared branch to QA for stability testing. If issues that need fixing surface during testing, merge the fix PRs into the release branch once they are ready.

Only proceed to the release after the entire branch is stable.

### 5.2 Build Verification

Refer to the build documentation and build from source to confirm that the source code compiles correctly.

## 6. Community Release Vote Process

### 6.1 Create the Tag

Once the branch is stable, create a tag on it. For example:

```shell
git checkout branch-1.0.0
git tag -a 1.0.0-rc01 -m "doris manager 1.0.0 release candidate 01"
git push origin 1.0.0-rc01
```

Expected output:

```text
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris-manager.git
 * [new tag]         1.0.0-rc01 -> 1.0.0-rc01
```

Run `git tag` to list local tags.

### 6.2 Package, Sign, and Upload

The following steps require logging in to the user account directly through a terminal such as SecureCRT. **Do not switch in via `su - user` or `ssh`**, or the password prompt may fail to display and the command will error out.

#### 6.2.1 Package and Sign

```shell
git archive --format=tar 1.0.0-rc01 --prefix=apache-doris-incubating-manager-src-1.0.0-rc01/ | gzip > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc --detach-sign apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg --verify apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

sha512sum apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512

sha512sum --check apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

#### 6.2.2 Upload to SVN

Check out the SVN repository:

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

Organize the files produced above into the following SVN path:

```text
./doris/
├── doris-manager
│   └── 1.0.0
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc
│       └── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

Upload these files:

```shell
svn add 1.0.0-rc01
svn commit -m "Add doris manager 1.0.0-rc01"
```

### 6.3 Send a Vote Email to dev@doris.apache.org

Email subject:

```text
[VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

Email body template:

```text
Hi All,

This is a call for vote to release Doris Manager v1.0.0 for Apache Doris(Incubating).

- apache-doris-incubating-manager-src-1.0.0-rc01

The release node:



The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

Keys to verify the Release Candidate:
https://downloads.apache.org/doris/KEYS

Look at here for how to verify this release candidate:
http://doris.apache.org/community/release-and-verify/release-verify.html

Vote thread at dev@doris: [1]

The vote will be open for at least 72 hours or until necessary number of votes are reached.

Please vote accordingly:

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

[1] vote thread in dev@doris


Brs,
xxxx
------------------
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

### 6.4 After the Vote Passes, Send a Result Email

Email subject:

```text
[Result][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

Email body template:

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 jiafeng Zhang
+1 xxx
+1 EmmyMiao87
+1 Mingyu Chen

Best Regards,
xxx
```

## 7. IPMC Vote

After the dev mailing list vote passes, send an email to the `general@incubator.apache.org` mailing list to start the IPMC vote.

Email body template:

```text
Hi all,

Please review and vote on Apache Doris Manager 1.0.0-incubating-rc01 release.

Doris manager is a platform for automatic installation, deployment and management of Doris groups

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 1.0.0-rc01, available here:
https://github.com/apache/doris-manager/releases/tag/1.0.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

This has been signed with PGP key 33DBF2E0, corresponding to lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

To verify and build, you can refer to following instruction:

Firstly, you must be install and start docker service, and then you could build Doris as following steps:

$ wget https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
$ cd apache-doris-incubating-manager-src-1.0.0-rc01
$ sh build.sh

Best Regards,
xxx

----
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

Look up the email thread link at:

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 7.1 Send the Result Email to general@incubator.apache.org

Email subject:

```text
[RESULT][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

Email body template:

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris Manager 1.0.0-incubating-rc01 is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Willem Jiang
+1 Justin Mclean
+1 ShaoFeng Shi
+1 Makoto Yui

The vote thread:
https://lists.apache.org/thread.html/da05fdd8d84e35de527f27200b5690d7811a1e97d419d1ea66562130@%3Cgeneral.incubator.apache.org%3E

Best Regards,
xxx
```

## 8. Complete the Release

See the [Complete the release](./release-complete) document to finish all release steps.

## FAQ

### Q1: Why can the packaging and signing step not be done through `ssh` or `su - user`?

A terminal entered through `ssh` or `su -` cannot correctly display the GPG password prompt, which causes the signing command to fail. Log in to the target user account directly through a terminal such as SecureCRT.

### Q2: `gpg --verify` reports `gpg verify failed` or `BAD signature`

Possible causes:

- The public key has not been imported: run `gpg --import KEYS` first.
- The signature file does not match the source package: confirm that the `.asc` and the `.tar.gz` come from the same build.

### Q3: `sha512sum --check` reports `shasum mismatch`

The source package may have been corrupted or overwritten during transfer. Download the source package again, or regenerate the `.sha512` checksum file and re-verify.
