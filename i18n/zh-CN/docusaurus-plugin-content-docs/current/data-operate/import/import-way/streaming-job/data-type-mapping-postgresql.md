---
{
    "title": "数据类型映射",
    "language": "zh-CN",
    "description": "Doris Streaming Job CDC 的数据类型映射：自动建表时上游 PostgreSQL 类型如何映射为 Doris 列类型，以及写入 Doris 时值如何转换。"
}
---

<!-- 知识类型: 参考 / 数据类型映射 -->

下表展示上游 PostgreSQL 的每个列类型如何映射为 Doris 列类型。**只有一套映射**，两种同步方式共用，区别只在于由谁创建目标表：

- **自动建表同步**：Doris 读取上游表结构，自动按这些 Doris 列类型创建目标表。
- **SQL 映射同步**：你自己创建目标表，每列使用兼容的 Doris 类型。

两种方式下，写入的值都遵循同一套映射。不支持的类型请参见[使用限制](./continuous-load-overview.md#使用限制)。

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
