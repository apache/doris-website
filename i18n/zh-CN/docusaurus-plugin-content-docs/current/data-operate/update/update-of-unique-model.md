---
{
    "title": "主键模型的导入更新",
    "language": "zh-CN",
    "description": "这篇文档主要介绍 Doris 主键模型基于导入的更新。"
}
---

这篇文档主要介绍 Doris 主键模型基于导入的更新。

## 整行更新

使用 Doris 支持的 Stream Load、Broker Load、Routine Load、Insert Into 等导入方式，向主键模型（Unique 模型）导入数据时，如果没有相应主键的数据行，则插入新数据；如果有相应主键的数据行，则进行更新。也就是说，Doris 主键模型的导入是一种"upsert"模式。基于导入，对已有记录的更新，默认和导入一个新记录是完全一样的，因此可以参考数据导入的文档部分。

## 部分列更新

关于主键模型（Unique Key Model）表的列更新详细说明，包括使用示例、灵活部分列更新和新行处理等内容，请参考[列更新](./partial-column-update.md#主键模型的列更新)文档。
