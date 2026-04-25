---
{
    "title": "从其他 AP 系统迁移数据",
    "language": "zh-CN",
    "description": "从其他 AP 系统迁移数据到 Doris，可以有多种方式："
}
---

从其他 AP 系统迁移数据到 Doris，可以有多种方式：

- Hive/Iceberg/Hudi等，可以使用Multi-Catalog来映射为外表，然后使用Insert Into，来将数据导入

- 也可以从原来 AP 系统中导出数据为 CSV 等数据格式，然后再将导出的数据导入到 Doris

- 可以使用 Spark / Flink 系统，利用 AP 系统的 Connector 来读取数据，然后调用 Doris Connector 写入 Doris



:::info NOTE
如果有其他迁移工具可以加入此列表，可以联系 dev@doris.apache.org
:::

