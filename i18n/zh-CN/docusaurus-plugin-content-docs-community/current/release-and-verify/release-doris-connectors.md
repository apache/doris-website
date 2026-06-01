---
title: 发布 Apache Doris Connectors
language: zh-CN
description: Apache Doris Spark/Flink Connector 发版流程：Maven Staging、SVN 上传与社区投票。
keywords:
    - Apache Doris Connector 发版
    - Spark Connector
    - Flink Connector
    - Maven Staging
    - Apache 投票
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

# 发布 Apache Doris Connectors

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 版本发布 / Apache 投票流程 -->

Doris Connectors 目前包含 Flink Connector 与 Spark Connector，二者代码库独立于 Doris 主代码库：

| Connector | 代码库 |
| --- | --- |
| Flink Connector | [https://github.com/apache/doris-flink-connector](https://github.com/apache/doris-flink-connector) |
| Spark Connector | [https://github.com/apache/doris-spark-connector](https://github.com/apache/doris-spark-connector) |

本文以 Spark Connector 1.2.0 为例，介绍 Connector 类组件从 Maven Staging、SVN 准备到社区投票的完整流程。

## 准备发布

首先，请参阅 [发版准备](./release-prepare) 文档完成签名、SVN、Maven 等环境的准备。

## 发布到 Maven

### 1. 准备分支与 Tag

在代码库中创建 `release-1.2.0` 分支，并 checkout 到该分支。

修改 `pom.xml` 中的版本 `revision` 为 `1.2.0`，提交本次修改：

```bash
git commit -a -m "Commit for release 1.2.0"
```

创建并推送 Tag：

```bash
git tag 1.2.0
git push origin 1.2.0
```

### 2. 发布到 Maven Staging

Spark Connector 针对不同 Spark 版本（如 2.3、3.1、3.2）发布不同的 Release，因此需要分别编译并发布。下面以 Spark 2.3、Scala 2.11 为例。

首先本地安装验证：

```bash
mvn clean install \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

> 相关参数可参考 `build.sh` 脚本中的编译命令，`revision` 为本次发布的版本号。

发布到 Apache Staging 仓库：

```bash
mvn deploy \
-Papache-release \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

执行成功后，在 [https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories) 可以看到刚发布的版本：

![](/images/staging-repositories.png)

:::caution 注意
确认产物中包含 `.asc` 签名文件。
:::

如果操作有误，需将该 staging drop 掉后重新执行上述步骤。

检查无误后，点击 `close` 按钮完成 Staging 发布。

### 3. 准备 SVN

检出 Dev SVN 仓库：

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

打包 Tag 源码并生成签名文件和 SHA512 校验文件（以下以 `1.2.0` 为例）：

```bash
git archive --format=tar release-1.2.0 --prefix=apache-doris-spark-connector-1.2.0-src/ | gzip > apache-doris-spark-connector-1.2.0-src.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-spark-connector-1.2.0-src.tar.gz.asc  --detach-sign apache-doris-spark-connector-1.2.0-src.tar.gz
sha512sum apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

在 macOS 上请使用：

```bash
shasum -a 512 apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

最终得到三个文件：

| 文件 | 用途 |
| --- | --- |
| `apache-doris-spark-connector-1.2.0-src.tar.gz` | 源码包 |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.asc` | GPG 签名文件 |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.sha512` | SHA512 校验文件 |

将三个文件移动到 SVN 目录：

```text
doris/spark-connector/1.2.0/
```

完整 SVN 目录结构示例：

```text
|____0.15
| |____0.15.0-rc04
| | |____apache-doris-0.15.0-incubating-src.tar.gz.sha512
| | |____apache-doris-0.15.0-incubating-src.tar.gz.asc
| | |____apache-doris-0.15.0-incubating-src.tar.gz
|____KEYS
|____spark-connector
| |____1.2.0
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.asc
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

其中 `0.15` 是 Doris 主代码目录，`spark-connector/1.2.0` 下是本次发布的内容。

> KEYS 文件的准备方式见 [发版准备](./release-prepare) 中的相关章节。

### 4. 投票

在 `dev@doris.apache.org` 邮件组发起投票，模板如下：

```text
Hi all,

This is a call for the vote to release Apache Doris Spark Connector 1.2.0

The git tag for the release:
https://github.com/apache/doris-spark-connector/releases/tag/1.2.0

Release Notes are here:
https://github.com/apache/doris-spark-connector/issues/109

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/spark-connector/1.2.0/

Maven 2 staging repository:
https://repository.apache.org/content/repositories/orgapachedoris-1031


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

切换到 spark connector 目录（以 Spark 2.3、Scala 2.11 为例）：

```bash
cd spark-doris-connector
mvn deploy \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3 \
```

之后可在以下地址查看 snapshot 版本：

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-spark-connector/
```

## FAQ / Troubleshooting

**Q：`mvn deploy` 报 `gpg: signing failed: Inappropriate ioctl for device`？**

执行 `export GPG_TTY=$(tty)` 后重试。

**Q：Staging 仓库中缺少 `.asc` 签名文件怎么办？**

检查 `mvn deploy` 命令是否带了 `-Papache-release`，并确认 `~/.m2/settings.xml` 与 `settings-security.xml` 配置正确。如果产物不完整，drop 掉本次 staging 后重新执行 `mvn deploy`。

**Q：不同 Spark 版本如何在同一次发布中发布多个产物？**

针对每个 Spark/Scala 版本组合，独立执行 `mvn deploy`，每次指定不同的 `-Dspark.version`、`-Dscala.version`、`-Dspark.major.version`；所有组合均完成后再一并 close staging 仓库。
