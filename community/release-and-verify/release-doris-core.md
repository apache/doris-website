---
title: Release Apache Doris Core
language: en
description: "Complete release process for Apache Doris Core: branch preparation, tag, signing, SVN upload, and Dev and IPMC voting."
keywords:
    - Apache Doris Core release
    - Doris release process
    - Apache voting
    - SVN dist
    - GPG signing
    - Release Candidate rc01
    - Release Manager
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

# Release Apache Doris Core

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Version release / Apache voting process -->

Doris Core refers to the code in [https://github.com/apache/doris](https://github.com/apache/doris). This document describes the complete release process that a Release Manager follows, from branch preparation and verification through packaging, signing, and community voting.

## Prepare for Release

First, see the [Release Preparation](./release-prepare) document to complete the setup for signing, SVN, Maven, and other environments.

### 1. Prepare the Branch

Before releasing, create a new release branch, for example:

```bash
git checkout -b branch-0.9
```

After the branch is created, run thorough tests so that features are usable, bugs converge, and important bugs are fixed. During this process, keep an eye on the community to see whether any necessary patches need to be cherry-picked into the release branch.

### 2. Clean Up Issues

Go through all issues that belong to this release:

- Close those that are completed.
- Defer those that cannot be completed in this release to a later version.

### 3. Merge Necessary Patches

While waiting to release, important patches may be merged. If the community reports an important bug that needs to be merged in, the Release Manager evaluates it and merges the corresponding patch into the release branch.

## Verify the Branch

### 1. Stability Testing

Hand the tagged branch over to the QA team for stability testing. If issues that need to be fixed appear during testing, merge the fix PRs into the release branch after they are completed.

Only after the entire branch is stable can you prepare for the formal release.

### 2. Compilation Verification

See the compilation document and compile to make sure the source code compiles correctly.

### 3. Prepare Release Notes

Compile the main features, bug fixes, and compatibility changes of this release, and prepare release notes (usually published as a GitHub issue).

## Community Voting Process

### 1. Tag the Release

Once the branch is reasonably stable, you can create a tag on that branch.

Before tagging, modify the `build_version` variable in `gensrc/script/gen_build_version.sh`, for example `build_version="0.10.0-release"`.

```bash
$ git checkout branch-0.9
$ git tag -a 0.9.0-rc01 -m "0.9.0 release candidate 01"
$ git push origin 0.9.0-rc01
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris.git
 * [new tag]         0.9.0-rc01 -> 0.9.0-rc01

$ git tag
```

### 2. Package, Sign, and Upload

:::caution Note
The following steps require logging in to the user account directly through a terminal such as SecureCRT. Do not jump in via `su - user` or `ssh`, otherwise the password input box will not appear and an error will be reported.
:::

Package the source code, and generate the GPG signature and SHA512 checksum file:

```bash
$ git checkout 0.9.0-rc01

$ git archive --format=tar 0.9.0-rc01 --prefix=apache-doris-0.9.0-incubating-src/ | gzip > apache-doris-0.9.0-incubating-src.tar.gz

$ gpg -u xxx@apache.org --armor --output apache-doris-0.9.0-incubating-src.tar.gz.asc --detach-sign apache-doris-0.9.0-incubating-src.tar.gz

$ gpg --verify apache-doris-0.9.0-incubating-src.tar.gz.asc apache-doris-0.9.0-incubating-src.tar.gz

$ sha512sum apache-doris-0.9.0-incubating-src.tar.gz > apache-doris-0.9.0-incubating-src.tar.gz.sha512

$ sha512sum --check apache-doris-0.9.0-incubating-src.tar.gz.sha512
```

| File | Purpose |
| --- | --- |
| `*-src.tar.gz` | Source package |
| `*-src.tar.gz.asc` | GPG signature file |
| `*-src.tar.gz.sha512` | SHA512 checksum file |

Download the Dev SVN repository:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

Organize the three files into the following SVN directory structure:

```text
./doris/
|-- 0.9.0-rc01
|   |-- apache-doris-0.9.0-incubating-src.tar.gz
|   |-- apache-doris-0.9.0-incubating-src.tar.gz.asc
|   `-- apache-doris-0.9.0-incubating-src.tar.gz.sha512
`-- KEYS
```

Commit to SVN:

```bash
svn add 0.9.0-rc01
svn commit -m "Add 0.9.0-rc1"
```

### 3. Start the Dev Mailing List Vote

Start a vote on `dev@doris.apache.org` with the subject:

> [VOTE] Release Apache Doris 0.9.0-incubating-rc01

Body template:

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

The release candidate has been tagged in GitHub as 0.9.0-rc01, available
here:
https://github.com/apache/incubator-doris/releases/tag/0.9.0-rc01

Release Notes are here:
https://github.com/apache/incubator-doris/issues/1891

Thanks to everyone who has contributed to this release.

The artifacts (source, signature and checksum) corresponding to this release
candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc1/

This has been signed with PGP key 33DBF2E0, corresponding to
lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/incubator/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

To verify and build, you can refer to following link:
http://doris.incubator.apache.org/community/release-and-verify/release-verify.html

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

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

### 4. Send the Dev Vote Result Email

After the vote passes, send the result email with the subject:

> [Result][VOTE] Release Apache Doris 0.9.0-incubating-rc01

Body template:

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Zhao Chun
+1 xxx
+1 Li Chaoyong
+1 Mingyu Chen

Best Regards,
xxx
```

### 5. Start the IPMC Vote

:::tip Tip
If the project is not an incubator project, skip this section and the next one.
:::

Start the IPMC vote on `general@incubator.apache.org` with the subject:

> [VOTE] Release Apache Doris 0.9.0-incubating-rc01

Body template:

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 0.9.0-rc01, available here:
https://github.com/apache/doris/releases/tag/0.9.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc01/

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

Step1: Pull the docker image with Doris building environment
$ docker pull apache/doris:build-env-1.3.1
You can check it by listing images, its size is about 3.28GB.

Step2: Run the Docker image
You can run image directly:
$ docker run -it apache/doris:build-env-1.3.1

Step3: Download Doris source
Now you should in docker environment, and you can download Doris source package.
(If you have downloaded source and it is not in image, you can map its path to image in Step2.)
$ wget https://dist.apache.org/repos/dist/dev/doris/0.9/0.9.0-rc01/apache-doris-0.9.0.rc01-incubating-src.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-0.9.0.rc01-incubating-src.tar.gz
$ cd apache-doris-0.9.0.rc01-incubating-src
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

You can look up the email thread link here:

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 6. Send the IPMC Vote Result Email

:::tip Tip
If the project is not an incubator project, skip this section.
:::

Send the result email to `general@incubator.apache.org` with the subject:

> [RESULT][VOTE] Release Apache Doris 0.9.0-incubating-rc01

Body template:

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris 0.9.0-incubating-rc01 is now closed.

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

## Complete the Release

See the [Complete the Release](./release-complete) document to finish all release steps.

## FAQ / Troubleshooting

**Q: `gpg --verify` reports `gpg: Can't check signature: No public key`?**

The corresponding public key is missing locally. Run `gpg --keyserver https://keyserver.ubuntu.com/ --recv-keys <KEY_ID>` to fetch the public key, then retry.

**Q: `svn commit` reports `Authentication failed`?**

Check whether the environment variables `$ASF_USERNAME` and `$ASF_PASSWORD` are set correctly. The password is the Apache LDAP password.

**Q: Can a vote be closed early if it has been open for less than 72 hours?**

No. Apache policy requires release votes to stay open for at least 72 hours, so you must wait until the time is up.
