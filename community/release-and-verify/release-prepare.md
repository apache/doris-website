---
title: Apache Doris Release Preparation
language: en
description: "Apache Doris release preparation: GPG signing, Maven configuration, the DISCUSS thread, and the overall release process."
keywords:
    - Apache Doris release preparation
    - Release Manager
    - GPG signing PGP key
    - Apache voting process
    - Maven settings.xml
    - Apache SVN dist
    - DISCUSS
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

# Apache Doris Release Preparation

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Version release / Apache voting process / Release Manager preparation -->

Releases of an Apache project must strictly follow the Apache Software Foundation's release process. This page covers the overall Apache Doris release process, signing environment setup, and Maven release configuration. It is intended for PMC members or Committers acting as Release Manager for the first time.

Related Apache official policies and guides:

- [Release Creation Process](https://infra.apache.org/release-publishing)
- [Release Policy](https://www.apache.org/legal/release-policy.html)
- [Publishing Maven Releases to Maven Central Repository](https://infra.apache.org/publishing-maven-artifacts.html)

For the detailed release steps of each component, see:

- [Release Doris Core](./release-doris-core)
- [Release Doris Connectors](./release-doris-connectors)
- [Release Doris Shade](./release-doris-shade)
- [Release Doris SDK](./release-doris-sdk)

## Release Forms

Releases of an Apache project come in three main forms:

| Form | Description | Required |
| --- | --- | --- |
| Source Release | Source code release | Required |
| Binary Release | Binary release (compiled executables) | Optional |
| Convenience Binaries | Convenience binary packages published to third-party platforms such as Maven and Docker | Optional |

## Overall Release Process

<!-- Knowledge type: Procedure -->

Each project release requires a PMC member or Committer to serve as the **Release Manager**. The overall process is as follows:

1. **Environment setup**: install GPG and SVN, and generate the signing public key (see below).
2. **Release preparation**:
    1. Start a DISCUSS thread in the community and discuss the specific release plan.
    2. Create the branch used for the release.
    3. Clean up issues for the corresponding version.
    4. Merge necessary patches into the release branch.
3. **Verify the branch**:
    1. QA stability testing.
    2. Verify the build process of the branch code.
    3. Prepare the Release Notes.
4. **Prepare release artifacts**:
    1. Tag the release.
    2. Upload the artifacts to be released to the [Apache Dev SVN repository](https://dist.apache.org/repos/dist/dev/doris).
    3. Prepare other Convenience Binaries (for example, upload to the [Maven Staging repository](https://repository.apache.org/#stagingRepositories)).
5. **Community voting process**:
    1. Start a vote on the Doris community Dev mailing list (`dev@doris.apache.org`).
    2. After the vote passes, send the Result email.
6. **Wrap-up**:
    1. Upload the signed packages to the [Apache Release repository](https://dist.apache.org/repos/dist/release/doris/) and generate download links.
    2. Publish the download links on the Doris website and GitHub, and clean up old version packages on SVN.
    3. Send the Announce email to `dev@doris.apache.org`.

## Prepare the Signing Environment

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: First time acting as Release Manager -->

If this is your first release, prepare the following tools in your local environment:

| Tool | Purpose | Reference |
| --- | --- | --- |
| Release Signing | Understand Apache signing requirements | [Release Signing](https://www.apache.org/dev/release-signing.html) |
| gpg | Generate the signing key and sign release packages | [openpgp](https://www.apache.org/dev/openpgp.html) |
| svn | Upload release artifacts to Apache SVN | [openpgp](https://www.apache.org/dev/openpgp.html) |

### Prepare the GPG Key

Before the release, the Release Manager needs to generate a signing public key, upload it to a public key server, and then use that key to sign the release packages.

> If your key is already included in the [Apache Doris KEYS file](https://downloads.apache.org/doris/KEYS), you can skip this section.

#### Install GnuPG

GnuPG (GPG for short) is the free software implementation of PGP, used to generate keys and sign files.

Installation command on CentOS:

```bash
yum install gnupg
```

After installation, the default configuration file is located at:

```text
~/.gnupg/gpg.conf
```

If the file does not exist, you can create an empty one.

Apache signing recommends SHA512. Edit `gpg.conf` and append the following three lines:

```text
personal-digest-preferences SHA512
cert-digest-algo SHA512
default-preference-list SHA512 SHA384 SHA256 SHA224 AES256 AES192 AES CAST5 ZLIB BZIP2 ZIP Uncompressed
```

#### Check the GPG Version

Confirm that GPG supports SHA512:

```bash
$ gpg --version
gpg (GnuPG) 2.0.22
libgcrypt 1.5.3
Copyright (C) 2013 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Home: ~/.gnupg
Supported algorithms:
Pubkey: RSA, ?, ?, ELG, DSA
Cipher: IDEA, 3DES, CAST5, BLOWFISH, AES, AES192, AES256, TWOFISH,
        CAMELLIA128, CAMELLIA192, CAMELLIA256
Hash: MD5, SHA1, RIPEMD160, SHA256, SHA384, SHA512, SHA224
Compression: Uncompressed, ZIP, ZLIB, BZIP2
```

:::caution Note
You must log in to the user account directly through a terminal such as SecureCRT. Do not jump through `su - user` or `ssh`, or the passphrase prompt will not display and the operation will fail.
:::

#### Generate the Signing Key

Run `gpg --gen-key` and follow the prompts using the recommended configuration below:

| Option | Recommended value | Notes |
| --- | --- | --- |
| Key type | `1` (RSA and RSA) | Default |
| Key length | `4096` | Apache recommends at least 4096 bits |
| Validity period | `0` | Never expires |
| Real name | Same as the ID shown on [id.apache.org](https://id.apache.org) | Required |
| Email address | Apache email (`xxx@apache.org`) | Required |

Full interactive example:

```text
$ gpg --gen-key
gpg (GnuPG) 2.0.22; Copyright (C) 2013 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
Your selection? 1
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (2048) 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0)
Key does not expire at all
Is this correct? (y/N) y

GnuPG needs to construct a user ID to identify your key.

Real name: xxx
Name must be at least 5 characters long
Real name: xxx-yyy
Email address: xxx@apache.org
Comment: xxx's key
You selected this USER-ID:
    "xxx-yyy (xxx's key) <xxx@apache.org>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? o
```

You then need to enter a passphrase (twice, at least 8 characters).

:::danger Important
Be sure to remember the passphrase set here. It is used for later signing and for releasing other components.
:::

If `gpg --gen-key` hangs for a long time, use either of the following methods to supplement entropy:

- Open another terminal and run `find / | xargs file` to generate random characters.
- Install `rng-tools` (`yum install rng-tools`) and run `rngd -r /dev/urandom`. Key generation then completes almost instantly.

#### View and Export the Public Key

```bash
$ gpg --list-keys
/home/lide/.gnupg/pubring.gpg
-----------------------------
pub   4096R/33DBF2E0 2018-12-06
uid                  xxx-yyy  (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

Here, `xxx-yyy` is the user ID and `33DBF2E0` is the short fingerprint.

Export the public key to a file:

```bash
gpg --armor --output public-key.txt --export [user ID]
```

Example:

```bash
$ gpg --armor --output public-key.txt --export xxx-yyy
File 'public-key.txt' already exists. Overwrite? (y/N) y
$ cat public-key.txt
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v2.0.22 (GNU/Linux)

mQINBFwJEQ0BEACwqLluHfjBqD/RWZ4uoYxNYHlIzZvbvxAlwS2mn53BirLIU/G3
9opMWNplvmK+3+gNlRlFpiZ7EvHsF/YJOAP59HmI2Z...
```

#### Upload the Public Key to a Key Server

Use `--send-keys` to upload the public key to the Ubuntu key server:

```bash
gpg --send-keys xxxx --keyserver https://keyserver.ubuntu.com/
```

Here, `xxxx` is the string after `pub` in the `--list-keys` output from the previous step (for example, `33DBF2E0`).

You can also paste the contents of `public-key.txt` and upload it through the [https://keyserver.ubuntu.com/](https://keyserver.ubuntu.com/) web page.

After a successful upload, you can query the key on that page by entering `0x33DBF2E0` (note the `0x` prefix). The site has query latency, so you may need to wait about one hour.

#### Generate the Fingerprint and Bind It to Your Apache Account

A key server does not verify authenticity, so anyone can upload a public key under your name. You therefore need to bind the fingerprint on [id.apache.org](https://id.apache.org) so that others can cross-check it.

Generate the fingerprint:

```bash
gpg --fingerprint [user ID]
```

Example:

```text
$ gpg --fingerprint xxx-yyy
pub   4096R/33DBF2E0 2018-12-06
      Key fingerprint = 07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0
uid                  xxx-yyy (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

Paste the full fingerprint (`07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0`) into the `OpenPGP Public Key Primary Fingerprint` field on [https://id.apache.org](https://id.apache.org).

> Note: Each Apache account can bind multiple public keys.

#### Append the Public Key to the KEYS File

:::danger Important
**Never delete existing content in the KEYS file.** Only append new entries.
:::

Append your KEY to both the Dev and Release SVN repositories in turn:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
# edit doris/KEYS file
gpg --list-sigs [user ID] >> doris/KEYS
gpg --armor --export [user ID] >> doris/KEYS
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

```bash
svn co https://dist.apache.org/repos/dist/release/doris
# edit doris/KEYS file
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

The changes are then synced automatically to:

```text
https://downloads.apache.org/doris/KEYS
```

In subsequent release vote emails, use the address `https://downloads.apache.org/doris/KEYS`.

## Maven Release Preparation

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Release Doris Connector / Shade / SDK -->

For components such as Doris Connector, Shade, and SDK, you need to use Maven for the release, which requires configuring `~/.m2/settings.xml` and `~/.m2/settings-security.xml`.

### 1. Generate the Master Password

The master password is used to encrypt other passwords later:

```bash
mvn --encrypt-master-password <password>
```

The output looks like `{VSb+6+76djkH/43...}`. Write it into `~/.m2/settings-security.xml`:

```xml
<settingsSecurity>
  <master>{VSb+6+76djkH/43...}</master>
</settingsSecurity>
```

### 2. Encrypt the Apache Account Password

```bash
mvn --encrypt-password <password>
```

`<password>` is your Apache account password. The output looks like `{GRKbCylpwysHfV...}`.

Add the following `<servers>` configuration to `~/.m2/settings.xml`:

```xml
<servers>
  <!-- To publish a snapshot of your project -->
  <server>
    <id>apache.snapshots.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
  <!-- To stage a release of your project -->
  <server>
    <id>apache.releases.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
</servers>
```

The purposes of the two `server id` entries:

| Server ID | Purpose |
| --- | --- |
| `apache.snapshots.https` | Publish SNAPSHOT versions |
| `apache.releases.https` | Publish Release versions to the Staging repository |

## Start a DISCUSS Thread in the Community

<!-- Knowledge type: Procedure -->

A DISCUSS thread is not a mandatory step before a release, but for important releases it is **strongly recommended** to start one on the `dev@doris.apache.org` mailing list. Topics include, but are not limited to:

- Descriptions and design points of important features.
- Bug fix descriptions.
- Compatibility changes and upgrade notes.
- The expected release schedule.

## FAQ / Troubleshooting

**Q: `gpg --gen-key` hangs. What should I do?**

This is caused by insufficient entropy. Run `find / | xargs file`, or install `rng-tools` and run `rngd -r /dev/urandom` to supplement the random source.

**Q: Signing fails with `gpg: signing failed: Inappropriate ioctl for device`?**

The terminal cannot receive the passphrase input. Run `export GPG_TTY=$(tty)` and try again.

**Q: `mvn deploy` returns 401 Unauthorized?**

Check the username and encrypted password for `apache.releases.https` in `~/.m2/settings.xml`, and confirm that the master password in `~/.m2/settings-security.xml` matches.

**Q: The key cannot be found after uploading it to the key server?**

`keyserver.ubuntu.com` has sync latency, which typically takes about one hour.
