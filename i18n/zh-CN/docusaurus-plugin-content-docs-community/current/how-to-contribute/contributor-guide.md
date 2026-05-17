---
title: 贡献者成长路径
language: zh-CN
description: Apache Doris 贡献者成长路径：从 Contributor 到 Committer / PMC 的标准、Code Review 与 PR 规则。
keywords:
    - Apache Doris
    - Contributor
    - Committer
    - PMC
    - Code Review
    - Pull Request 规则
    - 社区角色
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

# 贡献者成长路径

<!-- 知识类型: 规则规范 -->
<!-- 适用场景: 了解社区角色 / Code Review / PR 合入规则 -->

本文介绍 Apache Doris 社区的角色划分，以及从 Contributor 一路成长为 Committer、PMC 的路径。

## 社区角色

在 Apache 项目中，开发者有三种角色：

| 角色 | 定义 | 产生方式 |
|------|------|---------|
| **Contributor** | 代码正式合入代码库后，开发者自动成为该项目的 Contributor | 提交代码并合入 |
| **Committer** | 拥有代码仓库的合入权限 | 由 PMC（项目管理委员会）经过投票推举产生 |
| **PMC Member** | 项目管理委员会成员，对项目重大决策（如版本发布等）有投票权 | 由 PMC 经过投票推举产生 |

不同角色拥有不同的权利和义务，但晋升并没有严格的量化条件，更看重在社区的持续投入与影响力。

## Contributor 新人指南

### 订阅公共邮件列表

<!-- 知识类型: 操作步骤 -->

请订阅 `dev@doris.apache.org` 与 `commits@doris.apache.org` 邮件列表，通过分别发送邮件到 `dev-subscribe@doris.apache.org`、`commits-subscribe@doris.apache.org` 完成订阅。

`commits` 邮件列表非常重要，因为所有的 GitHub Issue、PR 提交都会自动发往该列表。

订阅步骤详见 [订阅邮件列表](../subscribe-mail-list)。

## Code Review 指南

<!-- 知识类型: 规则规范 -->
<!-- 适用场景: 进行 Code Review -->

1. 始终保持较高的标准来进行 Review，这样才能更好地保证整个产品的质量。

2. 对于用户接口类、整体架构方面的修改，需要在社区进行充分地讨论，可以在邮件组发起，也可以在 Issue 上发起。用户接口的改变包括支持新的 SQL 函数、支持新的 HTTP 接口、支持新的功能等。这样能够保证产品的一致性。

3. **测试覆盖**：新增的逻辑需要有对应的测试来覆盖。对于已有老代码不好增加测试的可以酌情考虑。

4. **文档**：新增加的功能必须要有文档来说明，否则不允许合入。必须要有英文文档，最好同时有中文文档。

5. **代码可读性**：如果 Reviewer 对代码逻辑不清晰，可以要求 Contributor 解释这段逻辑，并在代码里写充分的注释。

6. 尽量在评论的结尾给出明确的结论：是同意，还是要 change request。如果是小问题，可以只留评论。

7. 如果你已经看过了代码，觉得没有问题，但希望其他同学再确认下，可以留下 `+1 Comment`。

8. 互相尊重，互相学习。在评论时保持礼貌口吻，提建议尽量给出理由。

## Pull Request 指南

<!-- 知识类型: 规则规范 -->
<!-- 适用场景: 提交 PR / 推动 PR 合入 -->

### PR 涉及的三种角色

一个 PR 合入需要三种角色的参与：

| 角色 | 职责 |
|------|------|
| **Contributor** | PR 的提交者 |
| **Reviewer** | 对 PR 进行代码级评论的人 |
| **Moderator** | PR 合入的协调者，负责给 PR 设定相关标签、推动 Reviewer 评论、推动作者修改、合入 PR 等 |

在一个具体的 PR 中，一个人可能充当不同的角色，比如 Contributor 自己提交的 PR，既是 Contributor，又是这个 PR 的 Moderator。

### PR 合入规则

| 规则 | 要求 |
|------|------|
| 普通 PR 最低 `+1` 数 | 至少 1 个**非作者外的 Committer `+1`** |
| 接口类、整体架构修改的最低 `+1` 数 | 至少 **3 个 `+1`** |
| 首个 `+1` 后等待时间 | **至少一个工作日**，等待社区其他同学 Review |
| 回归测试 | **必须全部通过** |
| 评论回复 | Moderator 需确认所有评论都已回复 |
| 合入方式 | 统一使用 **「Squash and merge」** |

### PR 协作要点

1. Contributor 可以把一个 PR 分配给自己作为整个 PR 的 Moderator，负责后续 PR 的推动工作。分配给自己之后，其他的 Contributor 就知道这个 PR 有相关人负责了。

2. **鼓励 Contributor 作为自己 PR 的 Moderator**。

3. Reviewer 需要进行代码级的 Review，可参考上文的 Code Review 指南。

4. Reviewer 一旦评论了某个 PR 之后，需要持续跟进这个 PR 的后续改动，不鼓励评论了之后就不再管 Contributor 的后续回复。

5. 当不同的 Reviewer 对一个修改有争议时，可以尝试讨论解决。如果讨论没有办法解决，可以在 `dev@doris.apache.org` 中发邮件投票解决，采取少数服从多数的原则。

### 新增外部依赖的准入检查

<!-- 知识类型: 规则规范 -->

**新增外部依赖时要格外谨慎**。在引入新库前，需要回答以下问题：

- 新增的外部库提供了什么功能？现有的库能否提供此功能（可能需要一些努力）？
- 外部库是否由活跃的贡献者社区维护？
- 新增库的许可条款是什么？
- 是否将库添加到基础模块？这将影响 Doris 代码库的其他部分。以 Java 为例，如果新库引入了大量传递依赖项，那么可能会遇到类冲突的意外问题，这些问题很难通过测试发现，因为这取决于运行时加载库的顺序。

## 从 Contributor 到 Committer / PMC

<!-- 知识类型: 规则规范 -->
<!-- 适用场景: 晋升 Committer / PMC -->

成为 Committer 或 PMC Member 并没有严格的量化条件，PMC 会综合考量贡献者在以下方面的表现：

- **代码贡献**：持续提交高质量的 PR，参与核心模块的开发。
- **Code Review**：积极参与他人 PR 的 Review，帮助提升社区代码质量。
- **社区参与**：在邮件列表、Issue、Slack 上回答用户问题，参与设计讨论。
- **文档与布道**：撰写文档、博客，在大会上分享 Doris。
- **影响力**：能够独立推动重要功能或模块的演进。

详细的晋升标准请参考 Apache Doris 官方 Wiki：[Guidance for committer promotion](https://cwiki.apache.org/confluence/display/DORIS/Guidance+for+committer+promotion)。
