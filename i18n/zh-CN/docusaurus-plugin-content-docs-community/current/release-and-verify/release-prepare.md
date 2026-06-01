---
title: Apache Doris 发版准备
language: zh-CN
description: Apache Doris 发版准备：GPG 签名、Maven 配置、DISCUSS 讨论流程与发版整体流程。
keywords:
    - Apache Doris 发版准备
    - Release Manager
    - GPG 签名 PGP key
    - Apache 投票流程
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

# Apache Doris 发版准备

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 版本发布 / Apache 投票流程 / Release Manager 准备 -->

Apache 项目的版本发布必须严格遵循 Apache 基金会的版本发布流程。本文介绍 Apache Doris 发版的整体流程、签名环境准备和 Maven 发版配置，适用于首次担任 Release Manager 的 PMC 成员或 Committer。

相关 Apache 官方政策与指南：

- [Release Creation Process](https://infra.apache.org/release-publishing)
- [Release Policy](https://www.apache.org/legal/release-policy.html)
- [Publishing Maven Releases to Maven Central Repository](https://infra.apache.org/publishing-maven-artifacts.html)

各组件的具体发版步骤分别见：

- [发布 Doris Core](./release-doris-core)
- [发布 Doris Connectors](./release-doris-connectors)
- [发布 Doris Shade](./release-doris-shade)
- [发布 Doris SDK](./release-doris-sdk)

## 发布形式

Apache 项目的版本发布主要有以下三种形式：

| 形式 | 说明 | 是否必选 |
| --- | --- | --- |
| Source Release | 源码发布 | 必选 |
| Binary Release | 二进制发布（编译好的可执行程序） | 可选 |
| Convenience Binaries | 发布到 Maven、Docker 等第三方平台的便利二进制包 | 可选 |

## 发版总流程

<!-- 知识类型: 操作步骤 -->

每个项目的发版都需要一位 PMC 成员或 Committer 作为 **Release Manager**。总体流程如下：

1. **环境准备**：安装 GPG、SVN，并生成签名公钥（见下文）。
2. **发布准备**：
    1. 在社区发起 DISCUSS 并讨论具体发布计划；
    2. 创建用于发布的分支；
    3. 清理对应版本的 Issue；
    4. 将必要的 Patch 合并到发布分支。
3. **验证分支**：
    1. QA 稳定性测试；
    2. 验证分支代码的编译流程；
    3. 准备 Release Notes。
4. **准备发布材料**：
    1. 打 Tag；
    2. 将待发布内容上传至 [Apache Dev SVN 仓库](https://dist.apache.org/repos/dist/dev/doris)；
    3. 准备其他 Convenience Binaries（如上传到 [Maven Staging 仓库](https://repository.apache.org/#stagingRepositories)）。
5. **社区投票流程**：
    1. 在 Doris 社区 Dev 邮件组（`dev@doris.apache.org`）发起投票；
    2. 投票通过后，发送 Result 邮件。
6. **完成工作**：
    1. 将签名后的软件包上传到 [Apache Release 仓库](https://dist.apache.org/repos/dist/release/doris/) 并生成下载链接；
    2. 在 Doris 官网和 GitHub 发布下载链接，清理 SVN 上的旧版本包；
    3. 发送 Announce 邮件到 `dev@doris.apache.org`。

## 准备签名环境

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次担任 Release Manager -->

如果这是你第一次发布，需要在本地环境中准备以下工具：

| 工具 | 用途 | 参考链接 |
| --- | --- | --- |
| Release Signing | 了解 Apache 签名要求 | [Release Signing](https://www.apache.org/dev/release-signing.html) |
| gpg | 生成签名密钥并对发布包签名 | [openpgp](https://www.apache.org/dev/openpgp.html) |
| svn | 上传发布物到 Apache SVN | [openpgp](https://www.apache.org/dev/openpgp.html) |

### 准备 GPG Key

Release Manager 在发布前需先生成自己的签名公钥，并上传到公钥服务器，之后用该公钥对发布包签名。

> 如果 [Apache Doris KEYS 文件](https://downloads.apache.org/doris/KEYS) 中已包含你的 KEY，可跳过本节。

#### 安装 GnuPG

GnuPG（简称 GPG）是 PGP 的自由软件实现，用于生成密钥和对文件签名。

CentOS 安装命令：

```bash
yum install gnupg
```

安装完成后，默认配置文件位于：

```text
~/.gnupg/gpg.conf
```

如果该文件不存在，可直接创建一个空文件。

Apache 签名推荐使用 SHA512，编辑 `gpg.conf`，追加以下三行：

```text
personal-digest-preferences SHA512
cert-digest-algo SHA512
default-preference-list SHA512 SHA384 SHA256 SHA224 AES256 AES192 AES CAST5 ZLIB BZIP2 ZIP Uncompressed
```

#### 检查 GPG 版本

确认 GPG 支持 SHA512：

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

:::caution 注意
必须通过 SecureCRT 等终端直接登录用户账户，不能通过 `su - user` 或 `ssh` 转跳，否则密码输入框会显示不出来导致报错。
:::

#### 生成签名密钥

执行 `gpg --gen-key` 并按提示选择以下推荐配置：

| 选项 | 推荐值 | 说明 |
| --- | --- | --- |
| 密钥类型 | `1`（RSA and RSA） | 默认 |
| 密钥长度 | `4096` | Apache 推荐至少 4096 位 |
| 有效期 | `0` | 永不过期 |
| Real name | 与 [id.apache.org](https://id.apache.org) 中显示的 ID 一致 | 必填 |
| Email address | Apache 邮箱（`xxx@apache.org`） | 必填 |

完整交互示例：

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

随后需要输入 passphrase（两次，至少 8 个字符）。

:::danger 重要
这里设置的 passphrase 一定要记住，后续签名以及发布其他组件时都会用到。
:::

如果 `gpg --gen-key` 命令长时间卡住，可使用以下任一方法补充熵：

- 打开另一终端执行 `find / | xargs file` 产生随机字符；
- 安装 `rng-tools`（`yum install rng-tools`）并执行 `rngd -r /dev/urandom`，密钥生成可瞬间完成。

#### 查看与导出公钥

```bash
$ gpg --list-keys
/home/lide/.gnupg/pubring.gpg
-----------------------------
pub   4096R/33DBF2E0 2018-12-06
uid                  xxx-yyy  (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

其中 `xxx-yyy` 是用户 ID，`33DBF2E0` 是短指纹。

导出公钥到文件：

```bash
gpg --armor --output public-key.txt --export [用户ID]
```

示例：

```bash
$ gpg --armor --output public-key.txt --export xxx-yyy
文件'public-key.txt'已存在。 是否覆盖？(y/N)y
$ cat public-key.txt
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v2.0.22 (GNU/Linux)

mQINBFwJEQ0BEACwqLluHfjBqD/RWZ4uoYxNYHlIzZvbvxAlwS2mn53BirLIU/G3
9opMWNplvmK+3+gNlRlFpiZ7EvHsF/YJOAP59HmI2Z...
```

#### 上传公钥到公钥服务器

使用 `--send-keys` 将公钥上传到 Ubuntu 公钥服务器：

```bash
gpg --send-keys xxxx --keyserver https://keyserver.ubuntu.com/
```

其中 `xxxx` 为上一步 `--list-keys` 结果中 `pub` 后面的字符串（例如 `33DBF2E0`）。

也可以通过 [https://keyserver.ubuntu.com/](https://keyserver.ubuntu.com/) 网页粘贴 `public-key.txt` 内容上传。

上传成功后，在该网页输入 `0x33DBF2E0`（注意以 `0x` 开头）即可查询。该网站查询有延迟，可能需要等待约 1 小时。

#### 生成 Fingerprint 并绑定到 Apache 账号

公钥服务器没有真实性检查，任何人都可以以你的名义上传公钥，因此需要在 [id.apache.org](https://id.apache.org) 中绑定指纹以供其他人核对。

生成指纹：

```bash
gpg --fingerprint [用户ID]
```

示例：

```text
$ gpg --fingerprint xxx-yyy
pub   4096R/33DBF2E0 2018-12-06
      Key fingerprint = 07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0
uid                  xxx-yyy (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

将完整指纹（`07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0`）粘贴到 [https://id.apache.org](https://id.apache.org) 的 `OpenPGP Public Key Primary Fingerprint` 字段。

> 注：每个 Apache 账号可以绑定多个 Public Key。

#### 将公钥追加到 KEYS 文件

:::danger 重要
**绝对不要删除 KEYS 文件中已有的内容**，只能追加新增。
:::

依次在 Dev 与 Release 两个 SVN 仓库追加 KEY：

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
# edit doris/KEYS file
gpg --list-sigs [用户 ID] >> doris/KEYS
gpg --armor --export [用户 ID] >> doris/KEYS
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

```bash
svn co https://dist.apache.org/repos/dist/release/doris
# edit doris/KEYS file
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

之后会自动同步到：

```text
https://downloads.apache.org/doris/KEYS
```

在后续的发版投票邮件中，请使用 `https://downloads.apache.org/doris/KEYS` 这一地址。

## Maven 发版准备

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 发布 Doris Connector / Shade / SDK -->

对于 Doris Connector、Shade、SDK 等组件，需要使用 Maven 进行版本发布，必须配置 `~/.m2/settings.xml` 与 `~/.m2/settings-security.xml`。

### 1. 生成主密码

主密码用于加密后续的其他密码：

```bash
mvn --encrypt-master-password <password>
```

输出形如 `{VSb+6+76djkH/43...}`。将其写入 `~/.m2/settings-security.xml`：

```xml
<settingsSecurity>
  <master>{VSb+6+76djkH/43...}</master>
</settingsSecurity>
```

### 2. 加密 Apache 账号密码

```bash
mvn --encrypt-password <password>
```

`<password>` 是你的 Apache 账号密码，输出形如 `{GRKbCylpwysHfV...}`。

在 `~/.m2/settings.xml` 中加入以下 `<servers>` 配置：

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

两个 `server id` 的用途：

| Server ID | 用途 |
| --- | --- |
| `apache.snapshots.https` | 发布 SNAPSHOT 版本 |
| `apache.releases.https` | 发布 Release 版本到 Staging 仓库 |

## 在社区发起 DISCUSS

<!-- 知识类型: 操作步骤 -->

DISCUSS 并非发版前的强制流程，但在重要版本发布前**强烈建议**在 `dev@doris.apache.org` 邮件组发起讨论。讨论内容包括但不限于：

- 重要功能的说明与设计要点；
- Bug 修复说明；
- 兼容性变更与升级注意事项；
- 预计的发版时间表。

## FAQ / Troubleshooting

**Q：`gpg --gen-key` 一直卡住怎么办？**

熵不足导致，可执行 `find / | xargs file` 或安装 `rng-tools` 后运行 `rngd -r /dev/urandom` 补充随机源。

**Q：签名时报 `gpg: signing failed: Inappropriate ioctl for device`？**

终端无法接收 passphrase 输入，执行 `export GPG_TTY=$(tty)` 后重试。

**Q：`mvn deploy` 报 401 Unauthorized？**

检查 `~/.m2/settings.xml` 中 `apache.releases.https` 的用户名与加密后密码，确认 `~/.m2/settings-security.xml` 中主密码与之匹配。

**Q：上传到公钥服务器后查询不到？**

`keyserver.ubuntu.com` 同步有延迟，通常需等待约 1 小时。
