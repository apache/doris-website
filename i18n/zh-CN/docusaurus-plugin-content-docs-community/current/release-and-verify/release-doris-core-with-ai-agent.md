---
title: 使用 AI Agent 发布 Apache Doris Core
language: zh-CN
description: "面向 AI Agent 和 Release Manager 的 Apache Doris Core 端到端版本发布草稿：准备、打包签名、投票、发布完成和官网更新。"
keywords:
    - Apache Doris Core release
    - AI Agent
    - Release Manager
    - Apache voting
    - SVN dist
    - GPG signing
    - release notes
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

# 使用 AI Agent 发布 Apache Doris Core

<!-- Knowledge type: Agent runbook -->
<!-- Applicable scenario: Apache Doris Core release / Release Manager assistant -->

本文是一份给 AI Agent 阅读的 Doris Core 发布运行手册。目标不是让 Agent 自动代替 Release Manager 做决定，而是让 Agent 能够按阶段引导 Release Manager 完成一次端到端发布：准备分支和标签、生成 RC 源码包、签名、上传 Apache dev SVN、发起投票、完成正式发布、更新官网发布信息。

如果你是 Agent，按本文顺序工作。每一步都要先说明目标、需要 Release Manager 确认的输入、将要执行或建议执行的命令，以及这一步完成后的可验证结果。

## 适用范围和边界

本文适用于 Apache Doris Core，也就是 `apache/doris` 仓库的源码发布。发布辅助脚本位于 Doris 仓库：

```text
tools/release-tools/
```

官网更新辅助说明位于 Doris Website 仓库：

```text
doc-tools/skills/add-release/SKILL.md
```

Agent 必须遵守以下边界：

| 项目 | 要求 |
| --- | --- |
| 发布决策 | 由 Release Manager 和社区决定，Agent 只能提醒、检查和整理信息 |
| ASF 账号和密码 | 不写入文件，不输出到日志，不提交到 Git |
| GPG 私钥和口令 | 由 Release Manager 本地管理，Agent 不能索要或保存口令 |
| 公共 SVN 写入 | 每次写入前都要让 Release Manager 确认目标 URL 和文件列表 |
| 邮件发送 | 脚本只生成邮件草稿，Release Manager 必须人工检查并从 `@apache.org` 邮箱发送 |
| 投票结果 | Agent 可以协助统计，Release Manager 必须确认投票是否满足 ASF 规则 |
| Convenience binaries | 可由脚本本地签名和生成校验文件，但脚本不会上传二进制包 |

## Agent 开始前必须收集的信息

开始执行前，Agent 先向 Release Manager 确认以下信息。缺少任何关键项时，不要进入打包上传步骤。

| 信息 | 示例 | 用途 |
| --- | --- | --- |
| 发布版本 | `4.0.7` | 生成源码包名、官网链接和发布邮件 |
| RC 编号 | `rc01` 或 `rc02` | 生成 Git tag 和 dev SVN 目录 |
| Git tag | `4.0.7-rc01` | 发布候选版本的不可变源码点 |
| release branch | `branch-4.0` | 确认 tag 来自正确分支 |
| Apache ID | `morningman` | SVN、KEYS、邮件和签名信息 |
| Apache 邮箱 | `morningman@apache.org` | 投票邮件签名人 |
| 签名 key | GPG fingerprint，或留空自动检测 | 生成 `.asc` 签名 |
| Release Notes URL | GitHub issue 或官网 release note URL | 写入投票邮件和官网 |
| 是否有 convenience binaries | `x64`、`x64-noavx2`、`arm64` tarball 路径 | 可选签名和投票邮件展示 |
| 是否具备 PMC release SVN 权限 | 是或需要 PMC 协助 | 正式发布时写入 release SVN |
| 是否需要立即更新官网 | 是或否 | 决定是否执行 Doris Website 更新流程 |

Agent 应该复述一次收集到的发布计划，例如：

```text
本次计划发布 Apache Doris 4.0.7，RC 为 rc01，tag 为 4.0.7-rc01。
源码 RC 将上传到 https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01/。
投票通过后，正式源码包将发布到 https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7/。
```

## 阶段 1：确认发布准备已经完成

Agent 先检查发布准备，不要直接切入脚本执行。Doris release helper scripts 假设以下工作已经完成：

1. Release Manager 已经在社区完成发布计划讨论。
2. release branch 已经创建。
3. 目标版本的 issue、PR、重要 bugfix 已经清理或延期。
4. 必要 patch 已经 cherry-pick 到 release branch。
5. QA 或相关负责人已经完成稳定性验证。
6. 分支可以正常编译。
7. Release Notes 已经准备好，通常是 GitHub issue 或 Markdown 文档。
8. Git tag 已经创建，并推送到 `apache/doris` 对应 remote。

Agent 可以让 Release Manager 在 Doris 仓库执行以下检查：

```bash
git fetch --tags <apache-remote>
git rev-parse <version>-<rc>
git ls-remote --tags <apache-remote> refs/tags/<version>-<rc>
```

完成标准：

- 本地 tag 存在。
- Apache Doris GitHub remote 上存在同名 tag。
- 本地 tag 和 remote tag 指向同一个 commit。
- Release Manager 确认 release branch、Release Notes 和验证工作已经准备好。

如果 tag 不存在或 tag commit 不一致，Agent 必须停止发布流程，让 Release Manager 修正 tag 后再继续。

## 阶段 2：配置 `release.env`

Agent 引导 Release Manager 进入 Doris 仓库的 release tools 目录：

```bash
cd tools/release-tools
```

然后编辑 `release.env`。对于 `4.0.7-rc01`，关键字段类似如下：

```bash
VERSION="4.0.7"
RC="rc01"
TAG="${VERSION}-${RC}"
GIT_REMOTE="upstream-apache"

APACHE_ID="<your-apache-id>"
APACHE_EMAIL="<your-apache-id>@apache.org"
SIGNER_NAME="<your display name>"
SIGNING_KEY="<your signing key fingerprint, or empty if only one secret key exists>"

RELEASE_NOTES_URL="<release notes issue or page URL>"
ANNOUNCE_RELEASE_NOTES_URL="<release notes URL for announce email, or empty to reuse>"
```

Agent 必须提醒 Release Manager 检查这些派生值：

| 字段 | 预期 |
| --- | --- |
| `TAG` | 必须带 RC 后缀，例如 `4.0.7-rc01` |
| `PKG_BASE` | 投票阶段源码包名，包含 RC 后缀，例如 `apache-doris-4.0.7-rc01-src` |
| `RELEASE_PKG_BASE` | 正式发布源码包名，不含 RC 后缀，例如 `apache-doris-4.0.7-src` |
| `DEV_SVN_DIR` | dev SVN RC 目录，例如 `https://dist.apache.org/repos/dist/dev/doris/4.0.7-rc01` |
| `RELEASE_SVN_DIR` | release SVN 目录，例如 `https://dist.apache.org/repos/dist/release/doris/4.0/4.0.7` |
| `VERIFY_GUIDE_URL` | 指向 Doris release verify 文档 |

如果本次需要在投票邮件里列出 convenience binaries，Release Manager 可以把本地二进制 tarball 的绝对路径填入 `BIN_FILES`。Agent 必须说明：

- `02-package-sign-upload.sh` 只会给 `BIN_FILES` 里的二进制包生成 `.asc` 和 `.sha512`。
- 这些二进制包不会被脚本上传到 Apache dev SVN。
- Apache 投票所需的正式 release artifacts 是 source-only。

## 阶段 3：导出 ASF SVN 凭据

Agent 让 Release Manager 在当前 shell 中导出 ASF 凭据：

```bash
export ASF_USERNAME=<your-apache-id>
export ASF_PASSWORD='<your-apache-ldap-password>'
```

Agent 不要要求 Release Manager 把密码发给自己，也不要把密码写入 `release.env`。

完成标准：

- 当前 shell 中存在 `ASF_USERNAME`。
- 当前 shell 中存在 `ASF_PASSWORD`。
- 这两个变量不会被提交到 Git。

## 阶段 4：检查签名和发布环境

运行：

```bash
./01-check-env.sh
```

该脚本会检查：

- `git`、`gpg`、`svn`、`sha512sum`、`curl`、`gzip` 等工具是否存在。
- `GPG_TTY` 是否可用。
- `gpg.conf` 是否配置 SHA512 digest 偏好。
- 本地是否有可用的 GPG secret key。
- 签名 key 是否已经出现在 Doris KEYS 中。
- 本地 test sign 和 verify 是否成功。
- ASF SVN 凭据是否存在。

如果脚本提示需要编辑 `gpg.conf`、导入 key、生成 key 或发布 KEYS，Agent 必须先解释脚本将修改什么，再让 Release Manager 决定是否确认。

完成标准是脚本输出：

```text
environment looks READY for <version>-<rc>
```

如果没有出现这行，Agent 不得继续执行打包上传。

## 阶段 5：打包、签名并上传 RC 源码包

在运行上传脚本前，Agent 先向 Release Manager 复述目标 dev SVN URL：

```text
https://dist.apache.org/repos/dist/dev/doris/<version>-<rc>/
```

Release Manager 确认后，运行：

```bash
./02-package-sign-upload.sh
```

该脚本会执行以下工作：

1. 检查本地 tag 是否存在。
2. 检查 Apache Doris GitHub remote 上是否存在同名 tag。
3. 检查本地 tag 和 remote tag 是否指向同一个 commit。
4. 使用 `git archive` 生成源码 tarball。
5. 生成 `.asc` GPG 签名。
6. 生成 `.sha512` checksum。
7. 验证签名和 checksum。
8. 可选地给 `BIN_FILES` 中的 convenience binaries 生成签名和 checksum。
9. 在两次确认后，把源码 tarball、`.asc`、`.sha512` 上传到 Apache dev SVN。

Agent 必须在两个确认点提醒 Release Manager 检查：

- 目标 SVN URL 是否正确。
- 上传文件是否只有 source tarball、signature 和 checksum。
- 文件名是否带 RC 后缀。
- SVN commit message 是否对应本次 RC。

完成标准：

- dev SVN 中存在以下三个文件：

```text
apache-doris-<version>-<rc>-src.tar.gz
apache-doris-<version>-<rc>-src.tar.gz.asc
apache-doris-<version>-<rc>-src.tar.gz.sha512
```

- 脚本最后提示下一步运行 `./03-vote-mail.sh`。

如果上传前发现版本、tag、文件名或 SVN URL 错误，Agent 必须停止，不要让 Release Manager 确认 commit。

## 阶段 6：生成并发送 `[VOTE]` 邮件

运行：

```bash
./03-vote-mail.sh
```

该脚本会在 `WORK_DIR` 中生成：

```text
vote-email.txt
vote-email.eml
```

Agent 协助 Release Manager 检查邮件草稿，重点检查：

| 检查项 | 要求 |
| --- | --- |
| Subject | `[VOTE] Release Apache Doris <version>-<rc>` |
| GitHub tag link | 指向 `https://github.com/apache/doris/releases/tag/<version>-<rc>` |
| Release Notes | 指向本次版本的 Release Notes |
| RC artifacts | 指向 dev SVN 的 RC 目录 |
| PGP key | fingerprint、Apache 邮箱和 KEYS URL 正确 |
| Verify guide | 指向 Doris release verify 文档 |
| Vote duration | 明确至少开放 72 小时 |
| Convenience binaries | 如果出现，URL、`.asc`、`.sha512` 都正确 |

邮件必须由 Release Manager 从 `@apache.org` 邮箱手动发送到：

```text
dev@doris.apache.org
```

Agent 不能自动发送邮件。

完成标准：

- `[VOTE]` 邮件已经发送到 `dev@doris.apache.org`。
- Release Manager 记录投票开始时间。
- 投票至少等待 72 小时。

## 阶段 7：跟踪投票并发送 `[RESULT]` 邮件

投票期间，Agent 可以帮助 Release Manager 建立投票表：

| Voter | Apache ID | Vote | Binding | Notes |
| --- | --- | --- | --- | --- |
| `<name>` | `<apache-id>` | `+1` | yes/no | `<verification summary>` |

Agent 必须提醒 Release Manager：

- 只有明确回复的票才计入结果。
- Release Manager 没有默认 `+1`，如需投票也要显式回复。
- PMC 成员的票是 binding vote，其他社区成员的票是 non-binding vote。
- 投票至少开放 72 小时。
- 通常需要至少 3 个 binding `+1`，并且 `+1` 多于 `-1`。
- 如果出现有效的 `-1` 或严重验证问题，Release Manager 应评估是否取消本次 RC 并准备下一个 RC。

投票通过后，Release Manager 手动发送 `[RESULT]` 邮件。Agent 可以协助生成正文，但必须让 Release Manager 检查投票人数、binding 状态和邮件 thread 链接。

完成标准：

- `[RESULT][VOTE]` 邮件已经发送到 `dev@doris.apache.org`。
- Release Manager 确认本次 RC 已经通过。

## 阶段 8：发布正式源码包并生成 `[ANNOUNCE]` 邮件

只有在投票通过并发送 `[RESULT]` 邮件后，才能运行正式发布脚本：

```bash
./04-release-complete.sh
```

该脚本会：

1. 检查 dev SVN 中已经存在通过投票的 RC 源码包、签名和 checksum。
2. 检查 release SVN 目标目录是否尚不存在。
3. 使用 `svnmucc` 创建 release SVN 目录。
4. 把 dev SVN 中的 RC 文件移动到 release SVN。
5. 将正式发布文件名中的 RC 后缀去掉。
6. 删除 dev SVN 中的 RC 目录。
7. 生成 `announce-email.txt` 和 `announce-email.eml`。

Agent 必须提醒：

- 写入 release SVN 通常需要 PMC 权限。
- 目标 release SVN 目录不带 RC 后缀。
- 正式源码包文件名不带 RC 后缀。
- 该步骤会删除 dev SVN 的 RC 目录。
- 脚本会在真正提交 SVN 前要求最终确认。

如果只需要重新生成 announce 邮件，不要再次移动 SVN 文件，使用：

```bash
./04-release-complete.sh --mail-only
```

完成标准：

- release SVN 中存在以下文件：

```text
apache-doris-<version>-src.tar.gz
apache-doris-<version>-src.tar.gz.asc
apache-doris-<version>-src.tar.gz.sha512
```

- dev SVN 中对应 `<version>-<rc>` 目录已经被移除。
- announce 邮件草稿已经生成。

## 阶段 9：发送 `[ANNOUNCE]` 邮件

Agent 协助 Release Manager 检查 `announce-email.txt`：

| 检查项 | 要求 |
| --- | --- |
| Subject | `[ANNOUNCE] Apache Doris <version> release` |
| Download page | 指向 `https://doris.apache.org/download/` |
| Source artifacts | 指向 release SVN 正式目录 |
| Release Notes | 指向本次正式发布说明 |
| Signature | 使用 Release Manager 正确姓名 |

Release Manager 从 `@apache.org` 邮箱手动发送 announce 邮件到：

```text
dev@doris.apache.org
```

完成标准：

- `[ANNOUNCE]` 邮件已经发送。
- Release Manager 保存邮件 thread 链接，供后续官网或 GitHub Release 引用。

## 阶段 10：更新 Doris 官网发布信息

发布通过后，Agent 进入 Doris Website 仓库，阅读并执行：

```text
doc-tools/skills/add-release/SKILL.md
```

Agent 先收集或确认这些输入：

| 信息 | 说明 |
| --- | --- |
| Version | 例如 `4.0.7` |
| Release series | 例如 `4.0` |
| Release note source | GitHub issue、Markdown 或已发布说明 |
| Release date | 优先使用 Apache download 目录时间或 announce 日期 |
| Source package URL | `https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz` |
| Binary package URLs | `x64`、`x64-noavx2`、`arm64` 及其 `.asc`、`.sha512` |
| Source filename suffix | 确认源码包是否已经去掉 RC 后缀 |
| Website positioning | 是否更新 `Latest`、`Prev` 或仅加入历史版本 |
| Localization | 默认同步英文 release note 和中文 release note |

通常需要更新以下文件：

```text
src/constant/download.data.ts
releasenotes/v<series>/release-<version>.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v<series>/release-<version>.md
releasenotes/all-release.md
i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md
sidebarsReleases.json
```

Agent 必须特别检查：

- `DORIS_VERSIONS` 和 `ALL_VERSIONS` 都已加入新版本。
- 如果新版本成为官网主推版本，`VersionEnum.Latest` 或 `VersionEnum.Prev` 更新正确。
- 源码包 `source` 和 `version` 字段能拼出真实存在的源码包 URL。
- 每个二进制包都有 `.tar.gz`、`.asc`、`.sha512`。
- 英文和中文 release notes 结构一致。
- `all-release.md` 按发布日期倒序排列。
- `sidebarsReleases.json` 加入新 release note ID，并且 JSON 可解析。

建议执行的验证命令：

```bash
curl -sI https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-x64-noavx2.tar.gz
curl -sI https://download.selectdb.com/apache-doris-<version>-bin-arm64.tar.gz

git diff --check
node -e "JSON.parse(require('fs').readFileSync('sidebarsReleases.json','utf8')); console.log('sidebarsReleases.json ok')"
rg -n "<version>|release-<version>|apache-doris-<version>" src/constant/download.data.ts releasenotes i18n/zh-CN/docusaurus-plugin-content-docs-releases/current sidebarsReleases.json
```

如果 Release Manager 允许构建验证，再运行 Doris Website 仓库的常规 Docusaurus build 或本地检查命令。若 Release Manager 明确不要求构建，Agent 要在最终总结中说明 build 未执行。

完成标准：

- 官网下载数据已包含新版本。
- 英文和中文 release notes 已添加或更新。
- release index 和 sidebar 已更新。
- 源码包、二进制包、签名、checksum 链接可访问。
- 相关验证命令通过，或已明确说明未执行的验证。

## 阶段 11：发布后的收尾检查

Agent 最后协助 Release Manager 做一次收尾检查：

| 检查项 | 要求 |
| --- | --- |
| Apache downloads | `https://downloads.apache.org/doris/<series>/<version>/` 可访问 |
| Download page | 官网 `/download/` 能看到新版本 |
| Release notes | 官网 `/releases/` 能看到新版本说明 |
| GitHub Release | 对应 tag 的 GitHub Release 内容已更新 |
| Old versions | 如果官网策略要求，旧版本链接已指向 archive |
| Mailing list | `[VOTE]`、`[RESULT]`、`[ANNOUNCE]` thread 链接已保存 |
| Source verification | 从正式下载地址重新下载后，签名和 checksum 可验证 |

建议用正式下载地址做一次抽样验证：

```bash
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.asc
wget https://downloads.apache.org/doris/<series>/<version>/apache-doris-<version>-src.tar.gz.sha512
wget https://downloads.apache.org/doris/KEYS

gpg --import KEYS
gpg --verify apache-doris-<version>-src.tar.gz.asc apache-doris-<version>-src.tar.gz
sha512sum --check apache-doris-<version>-src.tar.gz.sha512
```

## 需要停止并重新评估的情况

遇到以下情况，Agent 必须建议 Release Manager 暂停发布流程：

- local tag 和 remote tag 指向不同 commit。
- `01-check-env.sh` 未输出 `environment looks READY`。
- GPG 签名或 checksum 验证失败。
- dev SVN 目标目录或 release SVN 目标目录不是本次版本。
- 投票未满 72 小时。
- binding `+1` 不足。
- 出现未解决的有效 `-1`。
- 验证者发现源码包中包含不应发布的二进制或构建产物。
- LICENSE、NOTICE 或 license header 检查失败。
- 官网链接指向不存在的源码包、二进制包、签名或 checksum。

如果问题需要重新制作 RC，Agent 应引导 Release Manager：

1. 修复 release branch。
2. 创建并推送新的 tag，例如从 `rc01` 递增到 `rc02`。
3. 更新 `release.env` 中的 `RC` 和 `TAG`。
4. 重新从阶段 4 开始执行。

## Agent 对 Release Manager 的建议对话模板

当 Release Manager 说“开始发布 Doris 4.0.7”时，Agent 可以这样回应：

```text
我会按 Doris Core 发布流程带你走完整 release。先确认几个关键输入：

1. 本次 RC 是 rc01 还是后续 RC？
2. 4.0.7-rcXX tag 是否已经创建并推送到 apache/doris？
3. 你的 Doris 仓库中指向 apache/doris 的 remote 名称是什么？
4. Release Notes URL 是什么？
5. 本次是否需要在投票邮件中列出 convenience binaries？
6. 你是否具备 release SVN 写权限，或需要 PMC 成员协助执行正式发布步骤？

确认后，我会先检查 tag 和 release.env，再运行 01-check-env.sh。任何公共 SVN 写入和邮件发送前，我都会停下来让你确认。
```

## 最终总结模板

发布完成后，Agent 向 Release Manager 输出一份简短总结：

```text
Apache Doris <version> 发布流程已完成。

- RC tag: <version>-<rc>
- Vote artifacts: <dev SVN URL>
- Release artifacts: <release SVN URL>
- Vote thread: <mail thread URL>
- Result thread: <mail thread URL>
- Announce thread: <mail thread URL>
- Website PR/commit: <URL or commit>
- Validation:
  - Signature/checksum: passed
  - Website links: passed
  - Docusaurus build: passed/skipped

仍需人工确认的事项：
- <none or list remaining follow-ups>
```
