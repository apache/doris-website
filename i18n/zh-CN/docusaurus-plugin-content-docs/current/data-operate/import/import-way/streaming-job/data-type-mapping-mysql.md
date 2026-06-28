---
{
    "title": "数据类型映射",
    "language": "zh-CN",
    "description": "Doris Streaming Job CDC 的数据类型映射：自动建表时上游 MySQL 类型如何映射为 Doris 列类型，以及写入 Doris 时值如何转换。"
}
---

<!-- 知识类型: 参考 / 数据类型映射 -->

下表展示上游 MySQL 的每个列类型如何映射为 Doris 列类型。**只有一套映射**，两种同步方式共用，区别只在于由谁创建目标表：

- **自动建表同步**：Doris 读取上游表结构，自动按这些 Doris 列类型创建目标表。
- **SQL 映射同步**：你自己创建目标表，每列使用兼容的 Doris 类型。

两种方式下，写入的值都遵循同一套映射。不支持的类型请参见[使用限制](./continuous-load-overview.md#使用限制)。

## MySQL 到 Doris

| MySQL 类型 | Doris 类型 | 备注 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `BOOLEAN` | |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 超高精度回退为 `STRING` |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | 保留微秒精度（0–6） |
| `TIMESTAMP` | `DATETIME(s)` | 按 server 时区归一 |
| `TIME` | `STRING` | 以字符串存储，如 `12:34:56.000000` |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64 编码字符串 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64 编码字符串 |
| `JSON` | `STRING` | 以 JSON 文本存储 |
| `ENUM` | `STRING` | 解析为标签值 |
| `SET` | `STRING` | 解析为逗号分隔的标签 |
| 空间类型（`GEOMETRY`、`POINT` 等）及其他类型 | 不支持 | 含此类列的表自动建表会失败；可改用 SQL 映射同步（在 `SELECT` 中转换）或排除该列 |
