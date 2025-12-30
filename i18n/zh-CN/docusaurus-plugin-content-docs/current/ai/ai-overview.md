---
{
    "title": "AI 概述",
    "language": "zh-CN",
    "description": "在 AI 技术快速演进的时代，数据基础设施正成为AI应用的核心支撑。Apache Doris 作为一款高性能、实时分析型数据库，深度融合了文本搜索、向量搜索、AI 函数和MCP智能交互能力，构建从数据存储、检索到分析的完整 AI 数据栈。"
}
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

在 AI 技术快速演进的时代，数据基础设施正成为AI应用的核心支撑。Apache Doris 作为一款高性能、实时分析型数据库，深度融合了文本搜索、向量搜索、AI 函数和MCP智能交互能力，构建从数据存储、检索到分析的完整 AI 数据栈。

- [文本搜索概述](text-search/overview.md)
- [向量搜索概述](vector-search/overview.md)
- [AI函数概述](ai-function-overview.md)
- [Doris MCP Server](https://github.com/apache/doris-mcp-server)

Doris 提供高性能、低成本、易集成的一体化解决方案, 广泛支持混合检索与分析、面向Agent的数据分析、RAG 应用构建、语义检索应用，以及大规模AI系统和应用的可观测性分析等场景。

## Agent Facing Analytics

随着 AI Agent 技术的兴起,越来越多的分析决策将由 AI 自动完成,这要求数据平台具备极致的实时性和高并发能力。与传统"人工分析"不同,Agent Facing Analytics 需要在毫秒级完成数据查询和决策,支持海量 Agent 的并发访问。典型场景包括实时反欺诈检测、智能广告投放、个性化推荐等。

Doris凭借高性能MPP架构，在这类面向Agent的分析场景中有非常突出的优势：

- 亚秒级数据延迟：支持实时数据摄入与更新,确保 Agent 决策基于最新数据
- 毫秒级查询响应：平均查询延迟 < 100ms,满足 Agent 实时决策需求
- 万级 QPS 并发：支持 10,000+ QPS,轻松应对海量 Agent 并发查询
- 原生 Agent 集成：通过 MCP Server 无缝对接 AI Agent,简化开发集成流程

## Hybrid Search and Analytics Processing

![img](/images/vector-search/image-5.png)

半结构化、非结构化数据正成为数据分析的一等公民。客户评论、聊天记录、生产日志、车机信号等数据已深度融入业务决策流程。传统的结构化分析方案需要融合全文检索和向量检索能力，在同一平台上既支持语义搜索，又能进行多维分析和聚合统计。例如：

- 客户洞察：结合评论文本检索和用户行为分析，精准定位客户需求和满意度趋势。
- 智能制造：融合生产日志全文搜索、设备图像识别和 IoT 指标分析，实现故障预测和质量优化。
- 车联网：综合车机信号数据分析、用户反馈文本挖掘和驾驶行为向量检索，提升智能座舱体验。

基于Doris的高性能实时分析、文本索引和向量索引能力构建上述场景的AI应用，具备多方面的优势：

- 一体化架构：在单一平台统一处理结构化分析、全文检索和向量搜索，无需数据迁移和异构系统集成
- 混合查询性能：单条 SQL 同时执行向量相似度搜索、关键词过滤和聚合分析，查询性能优异
- 灵活 Schema 支持：VARIANT 类型原生支持动态 JSON 结构，Light Schema Change 秒级变更字段和索引
- 全栈优化：从倒排索引、向量索引到 MPP 执行引擎的端到端优化，兼顾检索精度和分析效率

## Lakehouse for AI

AI 模型和应用开发需要从海量数据中准备训练集、进行特征工程、评估数据质量，传统架构往往需要在数据湖和分析引擎间频繁迁移数据。Lakehouse 架构将数据湖的开放存储与实时分析引擎深度融合，在统一平台上支撑数据准备、特征工程和模型评估的全流程，消除数据孤岛，加速 AI 开发迭代。

- 湖仓一体架构：基于开放湖表格式（如Iceberg/Paimon等）和 Catalog 构建开放湖仓，统一管理分析数据和 AI 数据
- 极速 SQL 引擎：Doris作为实时分析引擎，支持交互式查询和轻量级 ETL，为数据准备和特征工程提供最快的 SQL 计算能力
- 无缝数据流转：直接读写数据湖，无需数据搬迁，在存储层统一管理，在计算层灵活加速

基于Doris的Lakehouse架构对AI全流程进行加速：

- 大规模数据准备：利用Doris的高效数据处理能力，从 PB 级数据湖中高效过滤、采样和清洗数据，快速构建高质量训练数据集
- 实时特征工程：利用Doris的实时分析能力，在线进行特征提取、转换和聚合计算，为模型训练和推理提供实时特征服务
- 质量评估：对测试集和线上数据进行多维度快速分析，持续监控模型表现和数据漂移

## RAG（Retrieval-Augmented Generation）

RAG 通过从外部知识库检索相关信息为大模型提供上下文，有效解决模型幻觉和知识时效性问题。向量引擎是 RAG 系统的核心组件，需要在海量知识库中快速召回最相关的文档片段，同时支持高并发的用户查询请求，确保应用的响应体验。

- 企业知识库：基于内部文档、手册构建智能问答系统，员工通过自然语言快速获取准确答案
- 智能客服助手：结合产品知识库和历史案例，为客服人员或聊天机器人提供精准的回复建议
- 智能文档助手：在大规模文档集合中快速定位相关内容，辅助研究、写作和决策过程

在这类场景中，基于Doris构建RAG应用具备以下优势：

- 高并发性能：分布式架构支持高并发向量检索，轻松应对大规模用户并发访问
- 混合检索能力：在单条 SQL 中同时执行向量相似度搜索和关键词过滤，兼顾语义召回和精确匹配
- 弹性扩展：随集群扩容线性提升检索性能，从百万到百亿级向量无缝平滑过渡
- 一体化方案：统一管理向量数据、原始文档和业务数据，简化 RAG 应用的数据架构

## AI Observability

AI 模型训练迭代和应用运行过程中会产生海量日志、指标和追踪数据。为精准定位问题、持续优化性能，可观测性系统成为 AI 基础设施的关键一环。随着业务规模扩张，可观测平台面临 PB 级数据的高吞吐写入、毫秒级检索响应和成本控制的多重挑战。典型用例包括：

- 模型训练监控，实时追踪训练指标、资源消耗，快速定位训练异常和性能瓶颈；
- 推理服务追踪，记录每次推理请求的完整链路，分析延迟来源和错误模式；
- AI 应用日志分析，海量应用日志的全文检索和聚合分析，支持故障排查和行为洞察。

使用Doris构建AI Observability，具备以下优势：

- 极致性能：支持 PB 级/天（10GB/s）持续写入，倒排索引加速日志检索，秒级响应
- 成本优化：压缩率达 5:1 至 10:1，存储成本节省 50%-80%，支持冷数据低成本存储
- 灵活 Schema：Light Schema Change 秒级变更字段，VARIANT 类型原生支持动态 JSON 结构
- 生态友好：兼容 OpenTelemetry、ELK 生态，支持对接 Grafana/Kibana 可视化工具

## Semantic Search

语义搜索通过向量化技术捕捉文本深层含义，即使查询词与文档用词不同，也能召回语义相关的内容。这对于跨语言检索、同义词识别、意图理解等场景至关重要，显著提升搜索的召回率和用户体验。典型用例包括：

- 企业文档检索：员工用自然语言描述问题，系统理解意图后从海量文档中召回语义相关的政策、流程和知识
- 电商商品搜索：用户输入"适合夏天穿的透气鞋子"，系统理解需求并召回相关产品，而非仅匹配关键词
- 内容推荐平台：基于文章、视频的语义相似度进行智能推荐，发现用户可能感兴趣但用词不同的内

基于Doris构建语义搜索场景的应用，具备以下优势：

- 高性能向量检索：支持 HNSW 和 IVF 算法，亿级向量亚秒级响应，轻松应对大规模语义搜索需求
- 混合检索增强：单条 SQL 融合语义搜索和关键词过滤，在召回语义相关内容的同时确保必要词汇命中
- 多模态扩展：不仅支持文本语义搜索，还可扩展至图片、音频等多模态内容的语义检索
- 灵活量化优化：通过 SQ/PQ 量化技术，在保证检索精度的前提下大幅降低存储和计算成本