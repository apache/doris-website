---
title: 发布 Apache Doris Shade
language: zh-CN
description: Apache Doris Shade 发版流程：Maven release prepare/perform、SVN 上传与社区投票。
keywords:
    - Apache Doris Shade 发版
    - Maven release prepare
    - Maven release perform
    - Apache 投票
    - Maven Staging
    - SVN dist
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

# 发布 Apache Doris Shade

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 版本发布 / Apache 投票流程 -->

Doris Shade 代码库独立于 Doris 主代码库，位于：

- [https://github.com/apache/doris-Shade](https://github.com/apache/doris-Shade)

本文以发布 Doris Shade v1.0.0 为例，介绍 Shade 类组件从 Maven release plugin、SVN 准备到社区投票的完整流程。

## 准备发布

首先，请参阅 [发版准备](./release-prepare) 文档完成签名、SVN、Maven 等环境的准备。

## 发布到 Maven

### 1. 准备分支

在代码库中创建 `1.0.0-release` 分支，并 checkout 到该分支。

### 2. 发布到 Maven Staging

执行 Maven release plugin 生成 release tag：

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

`-DpushChanges=false` 表示执行过程中**不会**自动向代码库推送新生成的分支和 tag。

`release:prepare` 执行过程中会要求填写三项信息：

| 提示项 | 推荐填写 | 示例 |
| --- | --- | --- |
| Doris Shade 版本号 | 默认即可，格式 `{shade.version}` | `1.0.0` |
| Release Tag 名称 | 使用默认 tag 名称 | `1.0.0` |
| 下一个版本号 | 用于本地分支，无实际意义 | `1.0.1-SNAPSHOT` |

执行过程中可能要求输入 GPG passphrase。如果出现 `gpg: no valid OpenPGP data found`，先执行 `export GPG_TTY=$(tty)` 再重试。

`mvn release:prepare` 执行成功后，本地会生成一个 tag 和一个 branch，当前分支会新增两个 commit：

1. 第一个 commit 对应新生成的 tag；
2. 第二个 commit 对应下一个版本的 branch。

可通过 `git log` 查看确认。

本地 tag 确认无误后，将 tag 推送到代码库：

```bash
git push upstream --tags
```

其中 `upstream` 指向 `apache/doris-shade` 代码库。

最后执行 release:perform：

```bash
mvn release:perform
```

执行成功后，在 [https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories) 可以看到刚发布的版本：

![](/images/staging-repositories.png)

:::caution 注意
确认产物中包含 `.asc` 签名文件。
:::

如果操作有误，需要：

1. 删除本地 tag；
2. 删除代码库中的 tag；
3. 删除本地新生成的两个 commit；
4. 将 staging drop 掉；
5. 重新执行上述步骤。

检查无误后，点击 `close` 按钮完成 Staging 发布。

### 3. 准备 SVN

检出 Dev SVN 仓库：

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

打包 tag 源码并生成签名文件和 SHA512 校验文件（以下以 `1.0.0` 为例）：

```bash
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-shade-1.0.0-src/ | gzip > apache-doris-shade-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-shade-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-shade-1.0.0-src.tar.gz
sha512sum apache-doris-shade-1.14_2.12-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

在 macOS 上请使用：

```bash
shasum -a 512 apache-doris-shade-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

最终得到三个文件：

| 文件 | 用途 |
| --- | --- |
| `apache-doris-shade-1.0.0-src.tar.gz` | 源码包 |
| `apache-doris-shade-1.0.0-src.tar.gz.asc` | GPG 签名文件 |
| `apache-doris-shade-1.0.0-src.tar.gz.sha512` | SHA512 校验文件 |

将三个文件移动到 SVN 目录：

```text
doris/doris-shade/1.0.0/
```

完整 SVN 目录结构示例：

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-shade
│   └── 1.0.0
│       ├── apache-doris-shade-1.0.0-src.tar.gz
│       ├── apache-doris-shade-1.0.0-src.tar.gz.asc
│       └── apache-doris-shade-1.0.0-src.tar.gz.sha512
```

其中 `1.2.3-rc01` 是 Doris 主代码目录，`doris-shade/1.0.0` 下是本次发布的内容。

> KEYS 文件的准备方式见 [发版准备](./release-prepare) 中的相关章节。

### 4. 投票

在 `dev@doris.apache.org` 邮件组发起投票，模板如下：

```text
Hi all,

This is a call for the vote to release Apache Doris-Shade 1.0.0

The git tag for the release:
https://github.com/apache/doris-shade/releases/tag/doris-shade-1.0.0

Release Notes are here:
https://github.com/apache/doris-shade/blob/doris-shade-1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-shade/

KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...
```

## 完成发布

请参阅 [完成发布](./release-complete) 文档完成所有发布流程。

## 附录：发布到 SNAPSHOT

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 发版前预览 -->

Snapshot 并非 Apache Release 版本，仅用于发版前的预览。需要经过 PMC 讨论通过后才能发布 Snapshot 版本。

切换到 doris-shade 目录：

```bash
mvn deploy
```

之后可在以下地址查看 snapshot 版本：

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-shade/
```

## FAQ / Troubleshooting

**Q：`mvn release:prepare` 报 `gpg: no valid OpenPGP data found`？**

终端无法接收 GPG passphrase，执行 `export GPG_TTY=$(tty)` 后重试。

**Q：`mvn release:perform` 失败后如何完全回滚？**

按顺序执行：删除本地 tag（`git tag -d <tag>`）、删除远端 tag（`git push upstream :refs/tags/<tag>`）、回退本地两个 commit（`git reset --hard HEAD~2`）、在 Apache Staging 上 drop 掉对应仓库，然后重新执行 `mvn release:clean` 与 `mvn release:prepare`。

**Q：Maven release plugin 与手工打 tag + `mvn deploy` 有什么区别？**

`release:prepare/perform` 会自动管理版本号变更、tag 创建与产物上传，更适合 Shade 这种 pom 简洁的项目；手工方式则在多产物（如 Spark Connector 跨 Spark 版本）场景下更灵活。
