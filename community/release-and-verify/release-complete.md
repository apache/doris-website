---
title: Complete the Release
language: en
description: "Apache Doris release wrap-up: Release SVN, download links, release notes, and old version cleanup."
keywords:
    - Apache Doris
    - Complete the release
    - Release SVN
    - Download links
    - Release Note
    - Maven Release
    - Announce email
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

# Complete the Release

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Apache release process / Release wrap-up -->

This document describes the follow-up wrap-up steps to perform after the release vote in the `dev@doris` mailing list has been completed and passed.

## Release Completion Checklist

| Step | Action | Performed by |
|------|--------|--------------|
| 1. Upload the package to Release | Move the source package, signature, and checksum files from `dev` to `release` | PMC member |
| 2. Publish the Maven Staging repository | Click `Release` in Apache Nexus | Release Manager |
| 3. Prepare the release notes | Update the GitHub Release and the official website download page | Release Manager |
| 4. Clean up old versions in SVN | Keep only the latest version, and replace old version links with archive URLs | Release Manager |
| 5. Send the announce email | Announce the new release on `dev@doris` | Release Manager |

## 1. Upload the Package to Release

After the formal release vote passes, send the `[Result]` email first, then prepare the Release Package. Copy the source package, signature files, and hash files from the corresponding folder previously published under `dev` into a new directory (for example, `1.1.0`). Notes:

- The file name **must not include the `rcxx` suffix** (you may rename the file, but do not recompute the signature).
- Hashes may be recomputed; the result is the same.

> Only PMC members have permission to perform this step.

Source SVN path:

```text
https://dist.apache.org/repos/dist/dev/doris/
```

Target SVN path:

```text
https://dist.apache.org/repos/dist/release/doris/
```

Example command:

```shell
svn mv -m "move doris 1.1.0-rc05 to release" \
    https://dist.apache.org/repos/dist/dev/doris/1.1 \
    https://dist.apache.org/repos/dist/release/doris/1.1
```

For a first-time release, the KEYS file also needs to be copied over and added under the SVN release directory. After it is added successfully, the published files are visible at:

```text
https://dist.apache.org/repos/dist/release/doris/1.xx/
```

After a short wait, they are also visible on the Apache official site:

```text
http://www.apache.org/dist/doris/1.xx/
```

## 2. Publish Links on the Doris Website and GitHub

This section uses Doris Core as an example. For other components, replace the corresponding names accordingly.

### 2.1 Create Download Links

| Link type | URL |
|-----------|-----|
| Download link | `http://www.apache.org/dyn/closer.cgi?filename=doris/1.xx/apache-doris-1.xx-src.tar.gz&action=download` |
| wget download | `https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| Original location | `https://www.apache.org/dist/doris/1.xx/` |
| Closer entry | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| Source package | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| ASC signature | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.asc` |
| sha512 checksum | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.sha512` |
| KEYS | `http://archive.apache.org/dist/doris/KEYS` |

Example wget command:

```shell
wget --trust-server-names "https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz"
```

For detailed rules, see the [Apache download page guidelines](http://www.apache.org/dev/release-download-pages#closer).

### 2.2 Maven

In the [Apache Maven Staging Repositories](https://repository.apache.org/#stagingRepositories), find the corresponding Staging Repo:

1. If it has not been closed yet, click `close` first.
2. Click `Release` to perform the formal release.

> If the `close` step reports `No public key: Key with id: (xxx) was not able to be located on`, run the following command to sync the public key to a public keyserver, then close again:
>
> ```shell
> gpg --keyserver hkp://keyserver.ubuntu.com --send-keys xxx
> ```
>
> The value `xxx` can be obtained from `gpg -k`.

### 2.3 Prepare the Release Notes

Two places need to be updated:

#### 2.3.1 GitHub Release Page

```text
https://github.com/apache/doris/releases/tag/0.9.0-rc01
```

#### 2.3.2 Doris Website Download Page

The download page is a Markdown file at the following paths:

```text
docs/zh-CN/downloads/downloads.md
docs/en/downloads/downloads.md
```

Two changes are needed:

1. Change the download URLs of the previous version to the Apache archive URLs (see the next section).
2. Add download information for the new version.

### 2.4 Clean Up Old Versions in SVN

#### 2.4.1 Delete Old Versions from SVN

SVN only needs to keep the packages of the latest version. After a new release, clean up the old versions so that only the latest version's packages remain at the following two paths:

```text
https://dist.apache.org/repos/dist/release/doris/
https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.4.2 Replace with the Archive URL

Change the download URLs of old versions on the Doris website download page to the archive page URL:

| Type | URL |
|------|-----|
| Download page | `http://doris.apache.org/downloads.html` |
| Archive page | `http://archive.apache.org/dist/doris` |

Apache has a sync mechanism that archives historical released versions. For the procedure, see [How to Archive](https://www.apache.org/legal/release-policy.html#how-to-archive). Even after the old packages are removed from SVN, they remain available on the archive page.

## 3. Announce Email

Email subject:

```text
[ANNOUNCE] Apache Doris 1.xx release
```

Send to the mailing list:

```text
dev@doris.apache.org
```

Email body:

```text
Hi All,

We are pleased to announce the release of Apache Doris 1.xx.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The release is available at:
http://doris.apache.org/master/zh-CN/downloads/downloads.html

Thanks to everyone who has contributed to this release, and the release note can be found here:
https://github.com/apache/doris/releases

Best Regards,

On behalf of the Doris team,
xxx
```

## FAQ

### Q1: `svn mv` reports a permission error?

Only PMC members have write permission on the `release` SVN directory. Regular Committers need to contact a PMC member to perform the operation on their behalf.

### Q2: Maven reports `No public key` after clicking `Release`?

The GPG public key has not been uploaded to a public keyserver. Run the following command to sync the public key to a public keyserver, then retry:

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>` can be obtained from `gpg -k`.

### Q3: The download link on the website returns 404?

Possible causes:

- The files were just committed to the SVN release directory; CDN propagation takes 10 to 30 minutes.
- Old versions have been cleaned up, but the download page has not been updated to use the archive URLs.

### Q4: Users cannot find an old version when downloading?

Old versions are automatically archived by Apache. The download page needs to update the old version links to the path `http://archive.apache.org/dist/doris/<version>/`.
