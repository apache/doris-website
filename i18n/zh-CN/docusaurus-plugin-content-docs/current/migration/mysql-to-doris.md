---
{
    "title": "MySQL 迁移到 Doris",
    "language": "zh-CN",
    "description": "从 MySQL 迁移数据到 Apache Doris 的完整指南"
}
---

本指南介绍如何将数据从 MySQL 迁移到 Apache Doris。MySQL 是最常见的迁移源之一，Doris 对 MySQL 协议有很好的兼容性，使迁移变得简单。

## 注意事项

1. **协议兼容**：Doris 兼容 MySQL 协议，因此现有的 MySQL 客户端和工具可以与 Doris 配合使用。

2. **实时需求**：如果需要实时同步，Flink CDC 支持自动建表和 Schema 变更。

3. **全库同步**：Flink Doris Connector 支持同步整个 MySQL 数据库，包括 DDL 操作。

4. **自增列**：MySQL AUTO_INCREMENT 列可以映射到 Doris 的自增功能。迁移时可以通过显式指定列值来保留原始 ID。

5. **ENUM 和 SET 类型**：MySQL ENUM 和 SET 类型在 Doris 中作为 STRING 迁移。

6. **二进制数据**：二进制数据（BLOB、BINARY）通常存储为 STRING。迁移时考虑使用 HEX 编码。

7. **大表性能**：对于数十亿行的表，考虑增加 Flink 并行度、调整 Doris 写缓冲以及使用批量模式进行初始加载。

## 数据类型映射

| MySQL 类型 | Doris 类型 | 说明 |
|------------|------------|------|
| BOOLEAN / TINYINT(1) | BOOLEAN | |
| TINYINT | TINYINT | |
| SMALLINT | SMALLINT | |
| MEDIUMINT | INT | |
| INT / INTEGER | INT | |
| BIGINT | BIGINT | |
| FLOAT | FLOAT | |
| DOUBLE | DOUBLE | |
| DECIMAL(P, S) | DECIMAL(P, S) | |
| DATE | DATE | |
| DATETIME | DATETIME | |
| TIMESTAMP | DATETIME | 以 UTC 存储，读取时转换 |
| TIME | STRING | Doris 不支持 TIME 类型 |
| YEAR | INT | |
| CHAR(N) | CHAR(N) | |
| VARCHAR(N) | VARCHAR(N) | |
| TEXT / MEDIUMTEXT / LONGTEXT | STRING | |
| BINARY / VARBINARY | STRING | |
| BLOB / MEDIUMBLOB / LONGBLOB | STRING | |
| JSON | VARIANT | 参见 [VARIANT 类型](../data-operate/import/complex-types/variant.md) |
| ENUM | STRING | |
| SET | STRING | |
| BIT | BOOLEAN / BIGINT | BIT(1) 映射为 BOOLEAN |

## 迁移选项

### 选项 1：Flink CDC（实时同步）

Flink CDC 捕获 MySQL binlog 变更并流式传输到 Doris。此方法适用于：

- 实时数据同步
- 自动建表的全库迁移
- 支持 Schema 演进的持续同步

**前提条件**：MySQL 5.7+ 或 8.0+，启用 binlog；Flink 1.15+ 配合 Flink CDC 3.x 和 Flink Doris Connector。

详细设置请参考 [Flink Doris Connector](../ecosystem/flink-doris-connector.md) 文档。

### 选项 2：JDBC Catalog

[JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) 允许从 MySQL 直接查询和批量迁移。这是一次性或定期批量迁移最简单的方法。

### 选项 3：DataX

[DataX](https://github.com/alibaba/DataX) 是一个广泛使用的数据同步工具，通过 `mysqlreader` 和 `doriswriter` 插件支持 MySQL 到 Doris 的迁移。

## 下一步

- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - 详细的连接器文档
- [数据导入](../data-operate/import/load-manual.md) - 其他导入方法
- [数据模型](../table-design/data-model/overview.md) - 选择正确的表模型
