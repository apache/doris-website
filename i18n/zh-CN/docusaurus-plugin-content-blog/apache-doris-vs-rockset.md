---
{
  "title": "为什么 Apache Doris 是 Rockset 的最佳开源替代方案",
  "summary": "在众多自称能替代 Rockset 的产品中，Apache Doris 是少数覆盖其全部关键功能的产品之一。",
  "description": "在众多自称能替代 Rockset 的产品中，Apache Doris 是少数覆盖其全部关键功能的产品之一。",
  "date": "2024-06-24",
  "author": "velodb.io · Zaki Lu, Apache Doris Committer",
  "tags": [
    "Tech Sharing"
  ],
  "externalLink": "https://www.velodb.io/blog/567",
  "image": "/images/doris-vs-rockset.jpeg"
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

OpenAI 宣布 [收购 Rockset](https://openai.com/index/openai-acquires-rockset/)这一基于云的全托管分析数据库，在数据领域引发广泛关注。在祝贺之余，人们也在问： **为什么选择 [Rockset](https://rockset.com)**？

![OpenAI 收购 Rockset](/images/openai-twitter-rockset.png)

Rockset 由前 Meta 工程总监 Venkat Venkataramani 于 2016 年创立，专注于实时搜索和数据分析。与其他数据库管理系统相比，其特点包括：

- **实时数据更新**：Rockset 能及时获取和交付最新数据，保证数据新鲜度，支持毫秒级的字段粒度实时更新。

- **融合索引**：结合倒排索引、列式存储和行式存储的优势，提供高效、灵活的数据查询服务。

- **原生支持半结构化数据**：适用于不断增长的半结构化数据处理需求，以及哈希连接和嵌套循环连接。

- **SQL 和 JOIN 兼容性**：Rockset 的搜索索引针对多种连接查询进行了优化。

这则消息也让 Rockset 用户面临紧迫的迁移期限：他们需要在三个月内为自己的场景找到合适的替代方案。这为其他分析数据库带来了机会，但真正覆盖上述关键功能的产品并不多，Apache Doris 是其中值得关注的一个。

作为开源实时数据仓库，Apache Doris 已被全球超过 4000 家企业采用，提供以下能力：

- **实时数据更新**：Apache Doris 不仅支持 [实时更新](https://doris.apache.org/docs/table-design/data-model/unique) 和删除，还支持实时部分列更新，适合频繁更新数据的场景。

- **行列混合存储**：Apache Doris 是列式数据仓库，在 [ClickBench](https://benchmark.clickhouse.com/)上取得了领先的 OLAP 性能。同时支持行式存储，以服务于 [高并发点查询场景](https://doris.apache.org/docs/query/high-concurrent-point-query/)，能够在毫秒内响应近百万次查询请求。

- **[倒排索引](https://doris.apache.org/docs/table-design/index/inverted-index) 和全文检索**：Apache Doris 能高效、灵活地执行关键词搜索，支持在所有字段上创建索引，并灵活组合字段进行多维数据分析。

- **原生支持半结构化数据**：Apache Doris 引入了 [VARIANT](https://doris.apache.org/docs/sql-manual/sql-types/Data-Types/VARIANT) 数据类型，在低成本存储基础上提供灵活的数据结构和高速查询。与传统 JSON 处理方式相比，VARIANT 可带来 10 倍性能提升。

- **支持多种 SQL 和 [连接操作](https://doris.apache.org/docs/query/join-optimization/doris-join-optimization)**：Apache Doris 高度兼容 MySQL 语法和接口，支持 INNER JOIN、CROSS JOIN 以及各种 OUTER JOIN，并能根据数据类型自动优化，以适应不同场景。

作为 Apache 软件基金会的顶级项目，Apache Doris 得到了持续成长的社区支持。截至原文发布时，项目拥有超过 11.8K 个 GitHub Star 和 636 位贡献者。

Apache Doris 是 Rockset 的最佳开源替代方案。如需帮助，欢迎联系 dev@doris.apache.org 。
