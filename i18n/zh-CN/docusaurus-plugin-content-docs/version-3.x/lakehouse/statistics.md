---
{
    "title": "统计信息",
    "language": "zh-CN",
    "description": "Doris 支持对外部数据源的表，如 Hive、Iceberg、Paimon 等进行自动或手动的统计信息收集。统计信息准确性直接决定了代价估算的准确性，对于选择最优查询计划至关重要，尤其在复杂查询场景下能显著提升查询执行效率。"
}
---

Doris 支持对外部数据源的表，如 Hive、Iceberg、Paimon 等进行自动或手动的统计信息收集。统计信息准确性直接决定了代价估算的准确性，对于选择最优查询计划至关重要，尤其在复杂查询场景下能显著提升查询执行效率。

具体可参阅 [统计信息](../query-acceleration/optimization-technology-principle/statistics#外表收集) 文档中的【外表收集】部分。

