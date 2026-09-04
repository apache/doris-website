---
title: 代码评审和准入
language: zh-CN
description: Apache Doris Pull Request 提交后的 Review、CI 触发、问题修复与合入流程。
keywords:
    - Apache Doris
    - Pull Request Review
    - CI
    - TeamCity
    - AI Review
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

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: PR 提交后 / Review / CI / 合入 -->

创建 Pull Request（PR）后，贡献者还需要完成代码 Review、CI 检查和问题修复，PR 才能进入合入阶段。本文介绍从提交 PR 到最终合入的完整流程。关于创建 PR 的方法，请参阅[代码提交指南](./pull-request.md)。

流程概览：

1. 如果您不是 Committer，请联系 Committer 审核并 Approve CI workflow。
2. 自查改动，并按需使用 `doris-repo-review` skill 在本地执行 AI Review。
3. CI workflow 获得 Approve 后，通过 PR 评论触发 TeamCity 检查。
4. 修复 CI 和 Review 发现的问题，确保当前提交的所有 Required checks 通过。
5. 获得 Reviewer 和相关 Code Owner 的代码 Approve 后，由 Committer 合入 PR。

## 1. 请求 Committer Approve CI workflow

非 Committer 提交 PR 后，CI workflow 可能会等待具有权限的社区成员批准。此时，请联系一名 Committer 检查改动并 Approve workflow。workflow Approve 只表示允许 CI 执行 PR 中的代码，并不代表 Committer 已经批准代码改动或同意合入。

建议加入 [Apache Doris Slack 社群](https://doris.apache.org/slack?utm_source=website&utm_medium=docs&utm_content=review_ci)，在 `#dev` 频道发送以下信息，以便社区快速找到合适的 Reviewer：

```text
PR: <PR 链接>
模块: <涉及的模块>
变更: <一句话说明改动目的>
本地验证: <已经执行的测试>
需要帮助: Approve CI workflow / Review
```

如果您不确定应该联系谁，可以查看相关模块近期合入的 PR 或相关文件的提交历史，再在 `#dev` 频道中邀请熟悉该模块的 Committer 参与。

## 2. 在本地完成 Review

等待 workflow Approve 或远程 CI 时，先对 PR 做一次完整自查：

- 确认改动范围与 PR 描述一致，没有混入无关修改。
- 检查正常路径、异常路径、边界条件和兼容性影响。
- 确认新增行为有对应测试，已有测试没有被无理由删除或弱化。
- 确认配置、用户文档、错误信息和升级说明已经按需更新。
- 确认日志中不包含密码、Token、密钥或其他敏感信息。

### 使用 `doris-repo-review` 进行本地 AI Review

Apache Doris 提供了 [`doris-repo-review` skill](https://github.com/apache/doris-skills/tree/main/skills/doris-repo-review)，可以在本地 Doris 源码仓库中按在线 Code Review 流水线相同的方法审查 PR。该 skill 不编译代码或运行测试，因此不能替代 CI。

首先安装 Apache Doris skills：

```bash
npx skills add apache/doris-skills
```

本地环境需要具备 `git`、已完成认证的 `gh` CLI、`jq` 和 `python3`，Doris 仓库需要包含完整 Git 历史。进入本地 `apache/doris` 源码仓库后，在支持 skill 的 Agent 中执行：

```text
/doris-repo-review https://github.com/apache/doris/pull/<PR 编号>
```

也可以在命令末尾补充重点审查内容：

```text
/doris-repo-review https://github.com/apache/doris/pull/<PR 编号> focus on compatibility and error handling
```

skill 会将当前工作目录对齐到 PR 的准确提交，并在 `review-docs/` 中生成中英文 Review 文档。运行前请先提交或自行暂存已跟踪文件的本地修改。skill 不会替您暂存或删除修改，并可能将当前工作目录切换到 detached HEAD。

当 Review 同时满足以下条件时，skill 会通过本机 `gh` 登录账号，在 PR 中自动发布一条与当前 commit 绑定的机器可读 PASS 评论：

- Review 结论为 `APPROVE`，没有 `Blocker` 或 `Major` 问题。
- Review 已收敛，并且 Review 文档通过校验。
- 使用的模型和推理强度符合 skill 的要求。
- PR head 在 Review 期间没有变化。

如果 Review 结论为 `REQUEST_CHANGES`、Review 未收敛、运行环境不符合要求，或 PR head 已变化，skill 不会发布 PASS 评论。该 PASS 评论是本地 AI Review 的结果凭证，不是 Apache 社区的人工批准，也不能代替 Reviewer 的代码 Approve。

## 3. 触发 TeamCity CI

CI workflow 获得 Approve 后，可以在 PR 中评论以下命令，触发 TeamCity 流水线：

```text
run buildall
```

`run buildall` 会根据 PR 的变更范围触发完整的检查组合。通常优先使用该命令。需要单独执行或重试某一类检查时，可以使用 [TeamCity 触发 workflow](https://github.com/apache/doris/blob/master/.github/workflows/comment-to-trigger-teamcity.yml) 当前支持的其他命令。

| 命令 | 作用 |
|------|------|
| `run buildall` | 根据变更范围触发完整的编译和测试组合 |
| `run compile` | 触发编译检查 |
| `run beut` | 触发 BE 单元测试 |
| `run feut` | 触发 FE 单元测试 |
| `run cloudut` | 触发 Cloud 单元测试 |
| `run p0` | 触发 P0 回归测试 |
| `run p1` | 触发 P1 回归测试 |
| `run external` | 触发 External 回归测试 |
| `run cloud_p0` | 触发 Cloud P0 回归测试 |
| `run cloud_p1` | 触发 Cloud P1 回归测试 |
| `run vault_p0` | 触发 Vault P0 回归测试 |
| `run nonConcurrent` | 触发不能并发执行的回归测试 |
| `run check_coverage` | 触发代码覆盖率检查 |
| `run performance` | 触发性能测试 |

如果 PR 修改了 `regression-test/pipeline/` 下涉及凭证访问的流水线脚本，单项测试命令会被阻止。Committer 检查脚本安全性后，需要使用 `run buildall` 明确确认并触发流水线。

## 4. 判断 CI 是否通过

PR 页面中的检查分为 Required 和非 Required 两类：

- **Required checks**：当前 PR head 对应的所有 Required checks 必须通过，PR 才能合入。
- **非 Required checks**：结果用于辅助判断，不直接阻止合入。即使失败，也应确认失败是否由本次改动引起，不能直接忽略。

CI 失败后，打开对应检查的日志，先判断问题属于代码错误、测试错误、环境问题还是不稳定测试。代码或测试有问题时，修复后 push 新提交。怀疑基础设施或不稳定测试时，在 PR 中附上失败日志链接和判断依据，再请 Committer 或模块维护者协助重试或排查。

每次 push 都会改变 PR head。请以最新提交对应的检查结果为准，不要把旧提交的绿色检查或 AI Review PASS 当作当前提交的结果。

## 5. 由 Committer 触发在线 AI Review

Committer 或具有相应仓库权限的成员可以在 PR 中评论以下命令，触发在线 AI Review：

```text
/review
```

也可以在命令后说明重点，例如：

```text
/review focus on compatibility and error handling
```

在线 AI Review 与 `doris-repo-review` skill 使用一致的审查方法，但任务需要进入在线队列并等待可用资源。请在 PR 的 Checks 区域查看 `code-review` 状态和对应的 GitHub Actions 日志。不要因为任务暂时处于 Queued 或 Running 状态而重复触发。

`code-review` 检查成功表示在线 Review 已经执行完成并提交了 Review 结果，不代表 Review 一定没有发现问题。请继续阅读 AI Review 的总结和行级评论，并处理其中的问题。

## 6. 处理 Review 意见并完成合入

### 获得 Code Owner Approve

Apache Doris 使用 [`.github/CODEOWNERS`](https://github.com/apache/doris/blob/master/.github/CODEOWNERS) 为部分代码路径指定 Code Owner。PR 修改这些路径时，GitHub 会根据 `CODEOWNERS` 请求相应的个人或团队参与 Review。需要 Code Owner Review 的模块必须获得对应 Code Owner 的 Approve，才能完成合入。

Code Owner Approve 与 CI workflow Approve、普通 Reviewer Approve 是不同的检查项，三者不能相互替代。请在 PR 的 Reviewers 区域和合入条件中确认是否仍在等待 Code Owner Review。如果不确定应该联系谁，请以 `CODEOWNERS` 的最新内容为准，并在 Slack `#dev` 频道中附上 PR 链接寻求帮助。本文不列出具体 Code Owner 名单，以免名单与仓库配置不一致。

### 处理 Review 意见

收到人工或 AI Review 意见后：

1. 逐条确认意见是否适用于当前改动。
2. 对合理意见修改代码、补充测试或文档，并在 PR 中回复处理结果。
3. 对不适用的意见说明技术原因和验证依据。
4. 只在问题确实处理完成后 Resolve 对话。
5. push 新提交后，重新执行受影响的 CI 和 Review。与旧 commit 绑定的 AI Review PASS 不能覆盖新提交。
6. 如有冲突，rebase 最新目标分支并解决冲突。

PR 满足以下条件后，可以请 Committer 完成最终合入：

- PR 描述完整，改动范围清晰。
- Review 意见已经处理完毕。
- 最新 PR head 的所有 Required checks 已通过。
- PR 与目标分支没有未解决的冲突。
- Reviewer 已给出代码 Approve。
- PR 涉及的 Code Owner 已按要求给出 Approve。

最终由 Committer 根据 Review 结论、CI 结果和项目合入策略完成合入。
