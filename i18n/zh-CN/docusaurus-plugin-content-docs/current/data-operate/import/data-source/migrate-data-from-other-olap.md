---
{
    "title": "从其他 AP 系统迁移数据",
    "language": "zh-CN",
    "description": "从其他 OLAP/AP 系统（如 Hive、Iceberg、Hudi）迁移数据到 Apache Doris 的多种方式与方案选型指南。",
    "keywords": [
        "Doris 数据迁移",
        "OLAP 数据迁移",
        "AP 系统迁移",
        "Hive 迁移 Doris",
        "Iceberg 迁移 Doris",
        "Hudi 迁移 Doris",
        "Multi-Catalog",
        "Insert Into",
        "Doris Connector",
        "Spark Doris Connector",
        "Flink Doris Connector"
    ]
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 从其他 AP/OLAP 系统迁移数据到 Doris -->

本文介绍将其他 AP（分析型）系统中的数据迁移到 Apache Doris 的常见方式，帮助你根据源系统类型与现有技术栈选择合适的迁移路径。

## 迁移方式概览

根据源系统类型与可用工具，从其他 AP 系统迁移数据到 Doris 主要有以下三种方式：

| 迁移方式 | 适用场景 | 关键组件 |
| --- | --- | --- |
| Multi-Catalog + Insert Into | 源系统为 Hive、Iceberg、Hudi 等支持外部目录映射的系统 | Multi-Catalog、Insert Into |
| 中间文件中转 | 源系统支持导出为 CSV 等通用数据格式 | 数据导出工具、Doris 文件导入 |
| Connector 对接 | 已有 Spark / Flink 作业，或需要程序化迁移 | Spark/Flink AP Connector、Doris Connector |

## 迁移方式详解

### 方式一：通过 Multi-Catalog 映射为外表后导入

适用于 Hive、Iceberg、Hudi 等可被 Doris Multi-Catalog 识别的系统。

- 在 Doris 中通过 Multi-Catalog 将源系统映射为外表
- 使用 `Insert Into` 将外表数据写入 Doris 内表

### 方式二：通过中间文件中转

适用于源系统不便直接对接，但支持数据导出的场景。

- 从原 AP 系统中将数据导出为 CSV 等通用数据格式
- 再将导出的数据文件导入到 Doris

### 方式三：通过 Spark / Flink Connector 写入

适用于已有 Spark / Flink 数据处理链路，或需要在迁移过程中进行清洗/转换的场景。

- 使用 AP 系统对应的 Spark / Flink Connector 读取源数据
- 使用 Doris Connector 将数据写入 Doris

## FAQ

**Q：如果我使用的 AP 系统不在上述列表中怎么办？**

如果有其他迁移工具或方式可加入此列表，欢迎联系 dev@doris.apache.org。

:::info NOTE
如果有其他迁移工具可以加入此列表，可以联系 dev@doris.apache.org
:::
