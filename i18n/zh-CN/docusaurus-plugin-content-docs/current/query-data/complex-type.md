---
{
    "title": "复杂类型查询",
    "language": "zh-CN",
    "description": "了解如何在 Apache Doris 中查询 Array、Map、Struct、JSON 等复杂类型，并通过专用 SQL 函数处理半结构化数据。",
    "keywords": [
        "Doris 复杂类型",
        "Array 查询",
        "Map 查询",
        "Struct 查询",
        "JSON 查询",
        "半结构化数据",
        "复杂类型函数"
    ]
}
---

<!-- 知识类型: 能力概览 / 函数索引 -->
<!-- 适用场景: 半结构化数据查询 / 嵌套字段访问 -->

在面对日志、埋点、用户画像、订单详情等场景时，业务数据往往不是扁平的关系结构，而是天然的嵌套或半结构化形态。Apache Doris 支持 Array、Map、Struct、JSON 等复杂类型，让这类数据可以直接以原始结构存储，并通过专用函数完成查询与计算。

## 适用场景

复杂类型适合用于以下查询场景：

- 标签、分类、商品多值属性等需要使用 **Array** 表达的列表型字段。
- 配置、属性键值对等需要使用 **Map** 表达的字典型字段。
- 嵌套对象、复合字段等需要使用 **Struct** 表达的结构化记录。
- 来自上游系统、Schema 不固定的 **JSON** 半结构化数据。

## 复杂类型函数索引

针对上述复杂类型，Doris 提供了对应的 SQL 函数集合，可在查询语句中直接使用。详细的函数说明请查阅 SQL 手册中的 SQL 函数章节：

| 复杂类型 | 函数文档 |
| --- | --- |
| Array | [Array 函数](../sql-manual/sql-functions/scalar-functions/array-functions/array) |
| Map | [Map 函数](../sql-manual/basic-element/sql-data-types/semi-structured/MAP) |
| Struct | [Struct 函数](../sql-manual/sql-functions/scalar-functions/struct-functions/struct) |
| JSON | [JSON 函数](../sql-manual/sql-functions/scalar-functions/json-functions/json-parse) |
