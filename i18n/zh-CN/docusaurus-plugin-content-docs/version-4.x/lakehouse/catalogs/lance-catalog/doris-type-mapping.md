---
{
    "title": "Lance 与 Doris 数据类型映射",
    "sidebar_label": "Doris 数据类型映射",
    "description": "Doris 4.2 Lance 类型映射参考：数据类型、精度、嵌套类型和不支持的类型。"
}
---

以下表格描述 Doris 4.2（`branch-4.2`）中 Lance Catalog 和 Lance 文件 TVF 的读取类型映射。Doris 不支持写入 Lance。

| Lance / Arrow 类型 | Doris 类型 | 说明 |
|---|---|---|
| `null`（可空字段） | `NULL` | 所有值均为 SQL NULL；非可空 Null 字段不支持 |
| `duration(s/ms/us/ns)` | `BIGINT` | 保留字段声明单位的有符号计数，不统一转换为秒 |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `uint8` | `SMALLINT` | 无符号整数无损提升 |
| `int16` | `SMALLINT` | |
| `uint16` | `INT` | 无符号整数无损提升 |
| `int32` | `INT` | |
| `uint32` | `BIGINT` | 无符号整数无损提升 |
| `int64` | `BIGINT` | |
| `uint64` | `LARGEINT` | 无符号整数无损提升 |
| `float16` | `FLOAT` | 提升为 32 位浮点数 |
| `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | 最大精度为 38 |
| `decimal256(P,S)` | `DECIMAL(P,S)` | 最大精度为 76 |
| `utf8`、`large_utf8` | `STRING` | |
| `arrow.json` Extension | `JSON` | 底层类型为 `utf8` 或 `large_utf8` |
| `lance.json` Extension | `JSON` | 底层类型为 `large_binary`；按 JSON 逻辑类型读取 |
| `lance.bfloat16` Extension | `FLOAT` | 底层类型为 `fixed_size_binary(2)`；无损提升为 Float32 |
| `binary`、`large_binary` | `VARBINARY(2147483647)` | |
| `fixed_size_binary(N)` | `VARBINARY(N)` | 保留固定字节宽度 |
| `date32(day)`、`date64(ms)` | `DATE` | `date64` 应表示完整自然日 |
| `time32(s)` | `TIME(0)` | |
| `time32(ms)` | `TIME(3)` | |
| `time64(us)`、`time64(ns)` | `TIME(6)` | 纳秒精度截断为微秒 |
| 无时区 `timestamp(s)` | `DATETIME(0)` | 不随 Session Time Zone 转换 |
| 无时区 `timestamp(ms)` | `DATETIME(3)` | 不随 Session Time Zone 转换 |
| 无时区 `timestamp(us)`、`timestamp(ns)` | `DATETIME(6)` | 纳秒精度截断为微秒 |
| 带时区 `timestamp` | `TIMESTAMPTZ(P)` | 保存时间点，按 Doris Session Time Zone 展示 |
| `struct` | `STRUCT` | 子字段递归映射 |
| `list`、`large_list`、`fixed_size_list` | `ARRAY` | 元素类型递归映射 |
| `map` | `MAP` | Key 和 Value 类型递归映射 |

## 使用说明

时间戳的精度 `P` 按单位确定：秒为 0、毫秒为 3、微秒和纳秒为 6。与 Iceberg/Paimon 的纳秒映射不同，Lance 的纳秒时间戳仍映射为 `DATETIME(6)` 或 `TIMESTAMPTZ(6)`，并截断到微秒。Decimal 要求 `1 <= P <= 76` 且 `0 <= S <= P`；负 scale 不支持。

Doris 根据 `ARROW:extension:name` 元数据识别上述扩展类型，并校验其底层存储类型。JSON 扩展映射为 Doris `JSON`（内部类型 `JSONB`），普通 `utf8`/`large_utf8` 列即使包含 JSON 文本，仍映射为 `STRING`，不会自动变成 JSON。支持 JSON 读取不代表任意 JSON 路径表达式都能下推；下推范围见[谓词下推](../lance-catalog.mdx#谓词下推)。

JSON、Duration、Null 和 BFloat16 读取需要 FE 与参与查询的 BE 均包含对应类型支持。旧构建可能仍显示不支持；升级时应同时确认 Schema 识别和实际读取能力。

当前不支持以下类型：

- 非可空的 Arrow `null` 字段。
- 未列为支持的 Arrow/Lance Extension 类型，例如 Lance Blob v2；已知扩展类型的底层存储与上表不匹配时也不支持。
- 无法递归映射其子类型的复杂类型。
- 保留了 Dictionary 标记的 Arrow Dictionary 类型。

对于不支持的顶层列，Catalog 表的 `DESC` 和 Lance 文件 TVF 的 `DESC FUNCTION` 都会保留该列，并显示 `unknown type: UNSUPPORTED_TYPE`。如果复杂类型的任一子字段无法映射，则整个顶层复杂列会标记为不支持。查询只投影支持的列仍可正常执行；当 SQL 投影不支持的列时，Doris 会在分析阶段报错。例如：

```sql
SELECT * EXCEPT(blob_col)
FROM lance_catalog.default.all_types;
```

:::note
部分 Lance Java SDK 版本可能在读取 Schema 时丢失 Dictionary 标记，并将 Dictionary 列暴露为物理索引类型。该结果不代表 Doris 已支持 Dictionary 的逻辑值，请勿依赖这一行为。
:::

实现依据：[LanceTypeConverter.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/lance/metadata/LanceTypeConverter.java)（`branch-4.2`）。
