---
{
    "title": "数据类型映射",
    "language": "zh-CN",
    "description": "Doris Streaming Job CDC 的数据类型映射：自动建表时上游 MySQL / PostgreSQL 类型如何映射为 Doris 列类型，以及写入 Doris 时值如何转换。"
}
---

<!-- 知识类型: 参考 / 数据类型映射 -->

下表展示上游 MySQL / PostgreSQL 的每个列类型如何映射为 Doris 列类型。**只有一套映射**，两种同步方式共用，区别只在于由谁创建目标表：

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

## PostgreSQL 到 Doris

| PostgreSQL 类型 | Doris 类型 | 备注 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` | `STRING` | |
| `int2` / `smallserial` | `SMALLINT` | |
| `int4` / `serial` | `INT` | |
| `int8` / `bigserial` | `BIGINT` | |
| `float4` | `FLOAT` | |
| `float8` | `DOUBLE` | |
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | 精度上限 38；未指定 scale 时默认 9 |
| `bpchar(n)`（即 `CHAR(n)`） | `CHAR` / `VARCHAR` | 长度 ×3 以兼容 UTF-8；`> 255` 转为 `VARCHAR` |
| `varchar` / `text` | `STRING` | 注意：PostgreSQL `varchar` 映射为 `STRING`（不带长度） |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | 精度 0–6；`timestamptz` 按 server 时区归一 |
| `time` / `timetz` / `interval` | `STRING` | `timetz` 保留其 UTC 归一后的偏移量 |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64 编码字符串 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| 几何类型（`point`、`line`、`polygon` 等） | `STRING` | 序列化为 GeoJSON 字符串（`type` / `coordinates` / `srid`） |
| 数组类型（如 `int4[]`、`text[]`） | `ARRAY<T>` | 仅支持一维 |
| 其他 / 用户自定义类型 | `STRING` | |
