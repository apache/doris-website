---
title: 如何分享 Blog
language: zh-CN
description: 如何向 Apache Doris 社区分享技术博客：内容方向、投稿渠道与发布流程。
keywords:
    - Apache Doris
    - 技术博客投稿
    - Doris Blog
    - 社区贡献
    - 技术分享
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
<!-- 适用场景: 博客投稿 / 社区内容贡献 -->

Doris 社区欢迎大家分享 Doris 相关的技术文章。文章一经合入，将出现在 Doris 官网。本文介绍可投稿的内容方向、投稿渠道与提交流程。

## 推荐的内容方向

文章内容包括但不限于以下方向：

| 方向 | 示例选题 |
| --- | --- |
| Doris 使用技巧 | 高效写入、查询调优、运维实践 |
| Doris 功能介绍 | 物化视图、倒排索引、湖仓一体能力 |
| Doris 系统调优 | FE / BE 参数调优、JVM 优化 |
| Doris 功能原理解读 | 查询执行、存储格式、Compaction 机制 |
| Doris 业务场景实践 | 用户行为分析、日志检索、实时报表落地经验 |

## 投稿流程

<!-- 知识类型: 操作步骤 -->

1. 将博客 Markdown 文件准备好，放置在 [apache/doris-website](https://github.com/apache/doris-website) 仓库的 `/blog` 目录下。
2. 按照 [文档格式规范](./docs-format-specification) 编排正文，使用代码围栏、图片 Alt、中英文空格等规范。
3. 在仓库根目录的 README 与相关索引中确认是否需要补充博客入口。
4. 向 `apache/doris-website` 提交 Pull Request，描述博客主题与作者信息。
5. 等待社区 Committer Review，根据反馈迭代后合入主干。

具体仓库说明与最新流程请参阅 [apache/doris-website README](https://github.com/apache/doris-website)。

## 相关文档

- [文档贡献指南](./contribute-doc)
- [文档格式规范](./docs-format-specification)
