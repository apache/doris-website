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

## JDBC URL 参数归一化

> 自 4.1.4 版本开始生效。

创建 MySQL 数据源的 Streaming Job（以及使用 `cdc_stream()` 表函数）时，如果用户没有显式指定，Doris 会自动在 `jdbc_url` 上追加以下参数：

| 参数 | 注入值 | 影响 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` 按 `TINYINT` 读取（`1` / `0`），不再按 `BOOLEAN` 读取（`true` / `false`） |
| `yearIsDateType` | `false` | `YEAR` 按整数年份读取，不再按日期读取 |
| `useUnicode` | `true` | 使用 Unicode 编码 |
| `characterEncoding` | `utf-8` | 字符集统一为 UTF-8 |

如果在 `jdbc_url` 中显式设置了上述参数，Doris 会保留用户的取值，不做覆盖。PostgreSQL 的 `jdbc_url` 不做归一化。

:::caution 升级影响

从 4.1.3 及更早版本升级后，已有的 MySQL CDC 作业中 `TINYINT(1)` 列的取值展示会由 `true` / `false` 变为 `1` / `0`，`YEAR` 列会由日期变为整数年份。如果需要保留旧行为，可在 `jdbc_url` 中显式设置 `tinyInt1isBit=true` 和 `yearIsDateType=true`。

:::

## MySQL 到 Doris

| MySQL 类型 | Doris 类型 | 备注 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | **自 4.1.4 版本起**映射为 `TINYINT`（取值 `1` / `0`）；4.1.4 之前映射为 `BOOLEAN`（`true` / `false`）。原因见下方【JDBC URL 参数归一化】 |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | **自 4.1.4 版本起**按整数年份读取，而不是按日期读取；MySQL 的零年（`0000`）保留为 `0` |
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
