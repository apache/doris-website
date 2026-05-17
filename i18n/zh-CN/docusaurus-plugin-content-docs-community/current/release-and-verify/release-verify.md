---
title: 验证 Apache 发布版本
language: zh-CN
description: Apache Doris 发版校验流程：下载、签名校验、源码协议检查、编译验证与投票。
keywords:
    - Apache Doris
    - 发版校验
    - GPG 签名
    - sha512 校验
    - LICENSE 检查
    - skywalking-eyes
    - 发版投票
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

# 验证 Apache 发布版本

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Apache 发版流程 / 校验投票 -->

该验证步骤适用于：

- 发版投票时对 Release Candidate（RC）的校验。
- 对已发布版本的完整性校验。

本文以 Doris Core 版本的验证为例，其他组件请注意替换对应名称。

## 验证 Checklist

以下 7 项需全部通过，才能投出 +1 票：

| 序号 | 校验项 | 验证手段 |
|------|--------|----------|
| 1 | 下载链接合法 | 链接来自 `dist.apache.org` 或 `downloads.apache.org` |
| 2 | 校验值和 PGP 签名合法 | `gpg --verify` + `sha512sum --check` |
| 3 | 代码与当前发布版本匹配 | 对比源码与 Git tag |
| 4 | LICENSE 和 NOTICE 文件正确 | 人工检查 |
| 5 | 所有文件携带必要的协议说明 | `apache/skywalking-eyes` |
| 6 | 源码包中不包含已编译内容 | 人工检查 `target/`、`build/`、二进制文件 |
| 7 | 编译能够顺利执行 | 参考编译文档执行编译 |

## 1. 下载源码包、签名文件、校验值文件和 KEYS

下载所有相关文件，以 `a.b.c-incubating` 为示例：

```shell
wget https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.sha512

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.asc

wget https://downloads.apache.org/incubator/doris/KEYS
```

> 如果是投票验证，则需从邮件中提供的 SVN 地址获取相关文件。

## 2. 检查签名和校验值

### 2.1 安装 GnuPG

推荐使用 GnuPG，可通过以下命令安装：

| 系统 | 安装命令 |
|------|----------|
| CentOS / RHEL | `yum install gnupg` |
| Ubuntu / Debian | `apt-get install gnupg` |

### 2.2 导入 KEYS 并校验

这里以 Doris 主代码 Release 为例，其他 Release 类似：

```shell
gpg --import KEYS
gpg --verify apache-doris-a.b.c-incubating-src.tar.gz.asc apache-doris-a.b.c-incubating-src.tar.gz
sha512sum --check apache-doris-a.b.c-incubating-src.tar.gz.sha512
```

> 注意：`gpg --import` 如果报错 `no valid user IDs`，可能是 GPG 版本不匹配，请升级到 2.2.x 或以上版本。

## 3. 验证源码协议头

使用 [skywalking-eyes](https://github.com/apache/skywalking-eyes) 进行协议验证。

进入源码根目录并执行：

```shell
sudo docker run -it --rm -v $(pwd):/github/workspace apache/skywalking-eyes header check
```

运行结果示例：

```text
INFO GITHUB_TOKEN is not set, license-eye won't comment on the pull request
INFO Loading configuraftion from file: .licenserc.yaml
INFO Totally checked 5611 files, valid: 3926, invalid: 0, ignored: 1685, fixed: 0
```

如果 `invalid` 为 0，则表示验证通过。

## 4. 验证编译

请参阅各组件的编译文档验证编译：

- Doris 主代码编译：参阅 [编译文档](/community/source-install/compilation-with-docker)。
- Flink Doris Connector 编译：参阅 [Flink Doris Connector 文档](/docs-next/dev/connection-integration/data-integration/flink-doris-connector)。
- Spark Doris Connector 编译：参阅 [Spark Doris Connector 文档](/docs-next/dev/connection-integration/data-integration/spark-doris-connector)。

## 5. 投票

有关投票的具体信息，请参阅 [ASF 投票流程](https://www.apache.org/foundation/voting.html)。

验证完成后，可使用以下模板回复 `dev@doris` 邮件组中的投票邮件：

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

### 5.1 投票规则要点

| 规则 | 说明 |
|------|------|
| Binding 投票 | PMC 成员的投票具有约束力，其他投票为建议性 |
| 通过条件 | 多数批准——至少 3 个 PMC 的 +1，且 +1 多于 -1 |
| 投票时长 | 至少开放 72 小时 |
| 默认无 +1 | Release Manager 与所有投票人都不会隐含 +1，只有明确投票才有效 |

PMC 成员拥有具有约束力的投票，但社区鼓励所有成员投票，即使他们的投票只是建议性的。

Release Manager 需要检查投票的有效性。可通过 PMC 的花名册来验证电子邮件地址是否一致。建议：

- 使用 Apache 邮箱投票，以确保投票有效性。
- 在投票中注明 Apache ID，方便 Release Manager 统计。

一般来说，如果有人发现严重问题，社区将取消发布投票。但在大多数情况下，最终决定权在于 Release Manager。该流程的具体情况可能因项目而异，但**"3 个 +1 票的最低法定人数"规则是通用的**。

请注意：**Release Manager 或任何 ASF 投票中的任何人都不会隐含 +1。只有明确投票才有效。** 同时也鼓励 Release Manager 对版本进行投票。

## FAQ / Troubleshooting

### Q1：`gpg --verify` 报错 `gpg verify failed` 或 `BAD signature`

可能原因：

- KEYS 文件未导入：先执行 `gpg --import KEYS`。
- 签名文件与源码包不匹配：确认 `.asc` 与 `.tar.gz` 在同一目录、版本号一致。
- 源码包在下载中损坏：重新下载并比对 `.sha512`。

### Q2：`gpg --import` 报错 `no valid user IDs`

GPG 版本过低。升级到 2.2.x 或以上版本：

```shell
# Ubuntu
apt-get install gnupg2

# CentOS
yum install gnupg2
```

### Q3：`sha512sum --check` 报 `shasum mismatch` 或 `FAILED`

源码包损坏或与校验文件不匹配。重新下载源码包，确认下载完成（对比文件大小），再次校验。

### Q4：skywalking-eyes 报 `LICENSE check failed` / `invalid > 0`

源码中存在缺失协议头的文件。常见原因：

- 新增的代码文件未添加 Apache License Header。
- 第三方文件未在 `.licenserc.yaml` 的 `paths-ignore` 中声明。

需要 Release Manager 修复后重新打 RC。

### Q5：编译失败应该投 -1 吗？

如果编译失败由 Release 包自身问题导致（例如缺失文件、依赖错误），应投 -1 并附详细原因。如果是本地环境问题（例如依赖未装、JDK 版本不对），应先排查环境再做判断。
