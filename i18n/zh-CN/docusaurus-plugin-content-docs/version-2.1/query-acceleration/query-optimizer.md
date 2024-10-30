---
{
    "title": "查询优化器介绍",
    "language": "zh-CN"
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

## 研发背景

在当前的信息技术环境中，查询优化器面临着多重挑战：一方面，它们需要处理用户日益复杂的查询语句和多样化的查询场景；另一方面，用户对查询实时性的要求愈发严格，渴望能够即时获取所需结果。此外，为了应对不断出现的新需求，查询优化器必须具备快速迭代与灵活适应的能力。

基于这样的背景，Doris 开始着手研发了一款全新的查询优化器。该优化器依托现代优化器架构，旨在更高效地应对当前 Doris 场景的查询请求，同时提供卓越的扩展性，为未来可能出现的更复杂需求奠定坚实基础。

## Doris 查询优化器优势

### 更聪明

优化器将每个 RBO（基于规则的优化）和 CBO（基于成本的优化）的优化点，以规则的形式清晰地呈现出来。针对每一个规则，优化器都提供了一组描述查询计划形状的模式，这些模式能够精确地匹配可优化的查询计划。因此，优化器能够更好地支持诸如多层子查询嵌套等更为复杂的查询语句。

同时，优化器的 CBO 基于先进的 Cascades 框架，充分利用了丰富的数据统计信息、数据特征信息以及精心调优的代价模型。这使得优化器在处理多表 Join 等复杂查询时，能够游刃有余，轻松应对。

### 更稳定

优化器的所有优化规则均在逻辑执行计划树上完成。查询语法语义解析完成后，查询会被转换为树状结构。相比旧优化器，新优化器的内部数据结构更为合理、统一。

以子查询处理为例，新优化器基于新的数据结构，避免了旧优化器中众多规则对子查询的单独处理，从而降低了优化规则出现逻辑错误的可能性。

### 更灵活

优化器的架构设计合理且现代，使得扩展优化规则和处理阶段变得非常方便。因此，我们能够迅速增加新的功能，以满足不断变化的新需求。

## 优化器工作原理

### 整体流程

![优化器工作原理](/images/cost-based-optimizer.jpg)

优化器的执行流程大致分为以下几个步骤：

1. **语法分析：** 优化器会尝试将 SQL 文本转换为抽象语法树（AST）。如果 SQL 文本合法，则继续进行后续步骤；如果非法，则会报错并终止执行。

2. **语义分析：** 优化器会对 AST 中的元素进行语义分析。这一步骤会检查 SQL 查询中的表、列、函数等是否存在，以及它们的使用是否符合语法和语义规则。如果语义合法，则继续执行；如果语义非法，则会报错并终止执行。

3. **改写查询计划（RBO）：** 在语法和语义分析之后，优化器会进行基于规则的优化（RBO）。这一步骤会通过一系列预定义的规则对查询计划进行改写，以确定性地优化执行速度。常见的优化手段包括列裁剪、谓词下推、分区裁剪等。

4. **优化查询计划（CBO）：** 最后，优化器会进行基于代价的优化（CBO）。在这一步骤中，优化器会在搜索空间中枚举等价的计划集合，并评估它们的执行代价。通过比较不同计划的执行代价，优化器会选择代价最小的计划作为最终的执行计划。这一步骤旨在确保查询能够以最高效的方式执行，从而提供最佳的性能。

## 常用会话变量

**1. 设置规划超时时间 `nereids_timeout_second`**

- 此变量用于设置查询规划的最大允许时间。当规划时间超出该设定值时，查询规划将被终止，并返回错误信息。在规划查询语句的过程中，系统会获取 SQL 中涉及的所有表的读锁，这一机制的主要目的是维护集群的稳定性，防止因规划时间过长而造成的资源过度占用以及锁冲突问题。

- 默认值：30s

- 适用场景：当查询涉及大量外部表或查询语句特别复杂时，可以适当增加此值，以确保查询能够正常进行。
