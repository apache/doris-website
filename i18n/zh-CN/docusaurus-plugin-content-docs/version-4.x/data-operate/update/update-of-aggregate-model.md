---
{
    "title": "聚合模型的导入更新",
    "language": "zh-CN",
    "description": "这篇文档主要介绍 Doris 聚合模型上基于导入的更新。"
}
---

这篇文档主要介绍 Doris 聚合模型上基于导入的更新。

## 整行更新

使用 Doris 支持的 Stream Load，Broker Load，Routine Load，Insert Into 等导入方式，往聚合模型（Agg 模型）中进行数据导入时，都会将新的值与旧的聚合值，根据列的聚合函数产出新的聚合值，这个值可能是插入时产出，也可能是异步 Compaction 时产出，但是用户查询时，都会得到一样的返回值。

## 部分列更新

关于聚合模型（Aggregate Key Model）表的列更新详细说明，包括建表、数据写入示例和使用注意事项等内容，请参考[列更新](./partial-column-update.md#聚合模型的列更新)文档。
