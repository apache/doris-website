---
title: 发布 Doris SDK
language: zh-CN
description: Apache Doris SDK 发版流程：Maven Release prepare/perform、SVN 上传与社区投票。
keywords:
    - Apache Doris
    - Doris SDK
    - 发版流程
    - Maven Release
    - SVN 上传
    - 社区投票
    - GPG 签名
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

# 发布 Doris SDK

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Apache 发版流程 / SDK 发布 -->

Doris SDK 代码库独立于 Doris 主代码库，地址为 [apache/doris-sdk](https://github.com/apache/doris-sdk)。本文以发布 `Doris SDK v1.0.0` 为例，介绍从 Maven Staging 发布到社区投票的完整流程。

## 发版流程概览

| 步骤 | 目的 | 关键产物 |
|------|------|----------|
| 1. 准备发布 | 完成发版前置准备（KEYS、账号、环境等） | GPG Key、Apache 账号 |
| 2. 准备分支 | 在仓库中创建发版分支 | `1.0.0-release` 分支 |
| 3. 发布到 Maven Staging | 生成 Release Tag，发布到 Apache Maven Staging | Tag、Staging Repository |
| 4. 准备 SVN | 上传源码包、签名、校验文件到 SVN | tar.gz / .asc / .sha512 |
| 5. 发起投票 | 在 dev@doris 邮件组发起投票 | 投票邮件 |
| 6. 完成发布 | 投票通过后归档与公告 | Release 包 |

## 1. 准备发布

请参阅 [发版准备](./release-prepare) 文档完成发版前置准备工作。

## 2. 发布到 Maven

### 2.1 准备分支

在代码库中创建分支 `1.0.0-release`，并切换到该分支：

```shell
git checkout -b 1.0.0-release
```

### 2.2 发布到 Maven Staging

执行以下命令生成 release tag：

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

其中 `-DpushChanges=false` 表示执行过程中不会向代码库推送新生成的分支和 tag。

执行 `mvn release:prepare` 命令后，需要依次提供以下三个信息：

| 输入项 | 说明 | 示例 |
|--------|------|------|
| Doris SDK 的版本号 | 本次发布的版本，格式 `{sdk.version}` | `1.0.0` |
| Release Tag 名称 | 本地生成的 tag 名称 | `1.0.0` |
| 下一个版本的版本号 | 仅用于生成本地分支，无实际意义 | `1.0.1-SNAPSHOT` |

**常见问题：**

- `mvn release:prepare` 可能要求输入 GPG passphrase。
- 如果出现 `gpg: no valid OpenPGP data found` 错误，先执行以下命令再重试：

    ```shell
    export GPG_TTY=$(tty)
    ```

`mvn release:prepare` 执行成功后会在本地生成一个 tag 和一个 branch，并在当前分支新增两个 commit：

1. 第一个 commit 对应新生成的 tag。
2. 第二个 commit 对应下一个版本的 branch。

可通过 `git log` 查看。

确认本地 tag 无误后，将 tag 推送到代码库：

```shell
git push upstream --tags
```

其中 `upstream` 指向 `apache/doris-sdk` 代码库。

最后执行 perform 命令，将构建产物发布到 Maven Staging：

```shell
mvn release:perform
```

执行成功后，可在 [Apache Maven Staging Repositories](https://repository.apache.org/#stagingRepositories) 中找到刚刚发布的版本：

![](/images/staging-repositories.png)

**注意：发布的构件中需要包含 `.asc` 签名文件。**

如果操作有误，需要按以下顺序回滚：

1. 删除本地 tag。
2. 删除代码库中的 tag。
3. 删除本地新生成的两个 commit。
4. 在 Staging Repository 页面 `drop` 掉该 staging。
5. 重新执行上述步骤。

检查完毕后，点击页面中的 `close` 按钮完成 Staging 发布。

### 2.3 准备 SVN

#### 2.3.1 检出 SVN 仓库

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.3.2 打包 Tag 源码并生成签名

以 `1.0.0` 为例，其他 tag 操作类似：

```shell
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-sdk-1.0.0-src/ | gzip > apache-doris-sdk-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-sdk-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-sdk-1.0.0-src.tar.gz
sha512sum apache-doris-sdk-1.14_2.12-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

macOS 系统使用 `shasum` 替代 `sha512sum`：

```shell
shasum -a 512 apache-doris-sdk-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

最终得到三个文件：

```text
apache-doris-sdk-1.0.0-src.tar.gz
apache-doris-sdk-1.0.0-src.tar.gz.asc
apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

#### 2.3.3 上传到 SVN

将这三个文件移动到 SVN 目录 `doris/doris-sdk/1.0.0/` 下，最终 SVN 目录结构类似：

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-sdk
│   └── 1.0.0
│       ├── apache-doris-sdk-1.0.0-src.tar.gz
│       ├── apache-doris-sdk-1.0.0-src.tar.gz.asc
│       └── apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

其中 `1.2.3-rc01` 是 Doris 主代码的目录，`doris-sdk/1.0.0` 下是本次发布的内容。

KEYS 文件的准备步骤可参阅 [发版准备](./release-prepare) 文档。

### 2.4 投票

在 `dev@doris.apache.org` 邮件组发起投票，邮件模板如下：

```text
Hi All,

This is a call for the vote to release Apache Doris-SDK 1.0.0

The git tag for the release:
https://github.com/apache/doris-sdk/releases/tag/1.0.0

Release Notes are here:
https://github.com/apache/doris-sdk/blob/1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-sdk/1.0.0/

KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because …
```

## 3. 完成发布

投票通过后，请参阅 [完成发布](./release-complete) 文档完成所有后续发布流程。

## 附录：发布到 SNAPSHOT

Snapshot 并非 Apache Release 版本，仅用于发版前的预览。在经过 PMC 讨论通过后，可以发布 Snapshot 版本。

切换到 Doris SDK 目录，执行：

```shell
mvn deploy
```

之后可在以下地址查看 Snapshot 版本：

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-sdk/
```

## FAQ

### Q1：`mvn release:prepare` 报错 `gpg: no valid OpenPGP data found`

GPG 未关联当前终端。执行 `export GPG_TTY=$(tty)` 后重试。

### Q2：Staging 阶段 `close` 报错 `No public key`

GPG 公钥未上传到公钥服务器。执行下面的命令，将公钥同步到公开服务器：

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>` 可通过 `gpg -k` 查看。

### Q3：发现操作错误，如何回滚？

按以下顺序处理：

1. 删除本地 tag：`git tag -d <tag>`。
2. 删除远程 tag：`git push upstream --delete <tag>`。
3. 撤销本地两个 release commit。
4. 在 Staging Repositories 页面 `drop` 掉该 staging。
5. 重新执行 `mvn release:prepare` 与 `mvn release:perform`。
