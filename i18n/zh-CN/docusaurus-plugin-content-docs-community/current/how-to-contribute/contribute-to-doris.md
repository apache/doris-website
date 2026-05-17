---
title: 贡献 Apache Doris
language: zh-CN
description: 如何为 Apache Doris 贡献代码、文档与 Bug 修复，社区贡献入门总览。
keywords:
    - Apache Doris
    - 贡献代码
    - 贡献文档
    - 提交 PR
    - Bug 修复
    - 社区参与
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

<!-- 知识类型: 概述 -->
<!-- 适用场景: 初次了解如何为 Apache Doris 做贡献 -->

非常感谢您对 Apache Doris 项目感兴趣。社区欢迎您以任何形式参与，包括建议、意见（含批评）、评论以及代码与文档贡献。

参与 Doris 项目的方式有很多种：代码实现、测试编写、流程工具改进、文档完善等。任何贡献都会被认可，社区会将您加入贡献者列表。当贡献积累到一定程度后，您还有机会成为 Apache Committer，获得 Apache 邮箱并被收录到 [Apache Committer 列表](http://people.apache.org/committer-index.html)。

任何问题都可以通过下列渠道联系社区：微信、Slack、邮件列表，社区会及时解答。

## 初次接触

<!-- 知识类型: 操作步骤 -->

初次来到 Doris 社区，建议按以下方式建立联系：

1. 关注 Doris [GitHub 代码库](https://github.com/apache/doris)。
2. 订阅 [邮件列表](../subscribe-mail-list)，了解开发动态。
3. 加入 Doris 微信群（添加微信号 `morningman-cmy`，备注「加入 Doris 群」）。
4. 加入 Doris [Slack](https://doris.apache.org/slack) 频道。

通过以上渠道，您可以及时跟进 Doris 开发动态，并就关注的话题发表意见。

## Doris 的代码与文档

<!-- 知识类型: 项目结构 -->

如 [GitHub](https://github.com/apache/doris) 仓库所示，Apache Doris 的核心代码库主要包含 Frontend (FE)、Backend (BE) 和 Broker（用于读取 HDFS 等外部存储）。文档包括官方网站、GitHub Wiki 以及运行时在线帮助手册。各组件详情如下：

| 组件名称 | 组件描述 | 相关语言 |
|---------|---------|---------|
| [Frontend daemon (FE)](https://github.com/apache/doris) | 由查询协调器与元数据管理器组成 | Java |
| [Backend daemon (BE)](https://github.com/apache/doris) | 负责数据存储与查询片段执行 | C++ |
| [Broker](https://github.com/apache/doris) | 读取 HDFS 数据到 Doris | Java |
| [Website](https://github.com/apache/doris-website) | Doris 官方网站 | Markdown |
| [Manager](https://github.com/apache/doris-manager) | Doris Manager | Java |
| [Flink Connector](https://github.com/apache/doris-flink-connector) | Doris Flink Connector | Java |
| [Spark Connector](https://github.com/apache/doris-spark-connector) | Doris Spark Connector | Java |
| Doris 运行时 Help 文档 | 运行 Doris 时的在线帮助手册 | Markdown |

## 改进文档

文档是了解 Apache Doris 最主要的入口，也是社区最需要帮助的方向之一。

浏览文档可以加深对 Doris 的理解，覆盖功能与技术细节。如果发现文档有问题，请联系社区。

如果您希望改进文档质量（包括修订页面地址、更正链接、撰写更优秀的入门文档），社区都非常欢迎。

Doris 文档大多以 Markdown 编写，可以直接在 [apache/doris-website](https://github.com/apache/doris-website) 仓库中提交变更。相关指南如下：

- 提交文档变更，请参阅 [文档贡献指南](https://doris.apache.org/zh-CN/community/how-to-contribute/contribute-doc)。
- 提交代码变更，请参阅 [代码提交指南](https://doris.apache.org/zh-CN/community/how-to-contribute/pull-request)。

## 发现 Bug 或问题

<!-- 适用场景: 报告 Bug / 修复问题 -->

如果发现 Bug 或问题，处理方式有两种：

1. **报告问题**：通过 GitHub [Issues](https://github.com/apache/doris/issues/new/choose) 提交新的 Issue，社区会有同学定期处理。
2. **自行修复**：阅读并分析源码自行修复，然后提交 [Pull Request](./pull-request)。

> 提示：开始修复前，建议先与社区交流，确认是否已有人在处理同样的问题。

## 修改代码并提交 PR

<!-- 知识类型: 操作步骤 -->

参与代码贡献的基本流程：

1. 下载代码、编译并部署运行，确认行为是否与预期一致（可参考 [编译文档](https://doris.apache.org/zh-CN/docs/install/source-install/compilation-with-docker/)）。
2. 在 GitHub 上 Fork `apache/doris` 仓库到自己的账号下。
3. 为修改创建独立分支，并将原仓库添加为 `upstream`。
4. 提交 PR。详细步骤请参考 [Pull Request 指南](./pull-request)。

无论是修复 Bug 还是新增 Feature，社区都非常欢迎您的贡献。
