---
{
    "title": "OLake",
    "language": "zh-CN",
    "description": "OLake Go 是开源的数据抽取与加载（EL）工具，可将业务数据库中的数据复制到 Apache Iceberg 表，或写入 Amazon S3 上的 Parquet 文件。Apache Doris 可通过 Iceberg Catalog 查询 OLake Go 写入的 Iceberg 表。"
}
---

[OLake Go](https://olake.io/) 是一款高性能的开源数据抽取与加载（EL）工具，可将业务数据库中的数据复制到 Apache Iceberg 表，或写入 Amazon S3 上的 Parquet 文件。它支持增量同步、变更数据捕获（CDC）和断点续传，并提供 Web 界面和命令行工具。

支持的数据源包括 PostgreSQL、MySQL 等关系型数据库，MongoDB 等文档数据库，以及 Kafka 和 S3。以 Iceberg 为目标时，OLake Go 将数据写入对象存储上的 Iceberg 表，并将表注册到 AWS Glue、Hive Metastore 或 REST Catalog 等 Iceberg Catalog 中。完整的数据源和 Catalog 列表请参阅 [OLake 文档](https://olake.io/docs/)。

## 与 Apache Doris 集成

要在 Doris 中查询 OLake Go 同步的数据，先让 OLake Go 将数据写入由双方均支持的 Iceberg Catalog 管理的表，再在 Doris 中创建指向同一元数据服务的 Iceberg Catalog。Doris 会直接从对象存储读取这些 Iceberg 表，无需迁移或复制数据。

- Doris 3.x 和 4.x 支持读取 Position Delete（位置删除）和 Equality Delete（等值删除）文件。
- 读取 Deletion Vector（删除向量）需要 Doris 4.1.0 或更高版本。

Doris 配置示例请参阅 [Iceberg Catalog](../../lakehouse/catalogs/iceberg-catalog.mdx)。有关 OLake Go 兼容的 Catalog 和删除格式，请参阅 [OLake Go 与 Apache Doris 集成指南](https://olake.io/docs/integrations/doris/)。

## 相关链接

- [OLake 官网](https://olake.io/)
- [OLake Go GitHub 仓库](https://github.com/datazip-inc/olake-go)
- [OLake 文档](https://olake.io/docs/)
