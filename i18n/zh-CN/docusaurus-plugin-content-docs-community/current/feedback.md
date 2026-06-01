---
title: 向 Apache Doris 反馈问题
language: zh-CN
description: 向 Apache Doris 反馈 Bug 或建议的官方渠道：邮件列表与 GitHub Issue，附高质量问题反馈的写作要点。
keywords:
    - Apache Doris 问题反馈
    - Doris Bug 反馈
    - Doris GitHub Issue
    - dev@doris.apache.org
    - Doris 邮件列表反馈
    - 提交 Issue
    - 复现步骤
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

# 问题反馈

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Bug 报告 / 功能建议 / 使用问题 -->

如果你在使用 Apache Doris 过程中发现 Bug、性能问题或希望提出功能建议，可以通过邮件列表或 GitHub Issue 向社区反馈。本文说明两种官方反馈渠道，以及一份高质量反馈应包含的关键信息。

## 反馈渠道对照

按问题类型选择渠道：

| 渠道 | 适用场景 | 入口 |
|------|----------|------|
| 邮件列表 | 使用咨询、设计讨论、社区话题 | 发送邮件到 `dev@doris.apache.org`（需先订阅） |
| GitHub Issue | 可复现的 Bug、明确的功能建议、文档问题 | <https://github.com/apache/doris/issues/new/choose> |
| 安全漏洞 | 安全问题（不要公开披露） | 参见 [安全漏洞披露](security) |

## 反馈方式

### 方式 1：邮件列表

1. 向 `dev-subscribe@doris.apache.org` 发送任意标题与内容的邮件，按指引完成订阅（详见 [订阅邮件列表](subscribe-mail-list)）。
2. 订阅成功后，向 `dev@doris.apache.org` 发送邮件，描述问题或建议。

### 方式 2：GitHub Issue

访问 [新建 Issue 入口](https://github.com/apache/doris/issues/new/choose)，按模板提交 Bug Report 或 Feature Request。

## 高质量反馈的要点

<!-- 知识类型: 写作指南 -->

为帮助社区快速定位问题，建议反馈时包含以下信息：

- **详细描述问题**：提供日志、关键报错、已进行过的排查与分析。
- **最小化问题**：缩小问题范围，剥离与问题无关的业务上下文。
- **给出复现步骤**：附最小可复现的 SQL、配置或脚本。
- **关注问题本身**：尽量与业务/场景解耦；如果必须保留场景信息，请提供清晰明确的上下文。

## 相关链接

- [订阅邮件列表](subscribe-mail-list)：5 步完成 dev 邮件列表订阅。
- [安全漏洞披露](security)：按 ASF 流程报告安全问题。
- [加入社区](join-community)：Slack、Twitter、LinkedIn 等其他渠道。
