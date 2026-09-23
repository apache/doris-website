---
{
    "title": "VARIANT",
    "language": "zh-CN",
    "description": "VARIANT 用于存储半结构化 JSON 数据。本页是 VARIANT 的参考文档，涵盖写入与解析、CAST、NULL 语义、比较与排序、Schema Template、ALTER TABLE、属性、索引和限制。"
}
---

## 描述 {#overview}

VARIANT 类型用于存储半结构化 JSON 数据，可以包含对象、数组、字符串、数值、布尔值和 `null`。写入时，Doris 会推断每个 JSON 路径的类型，并对高频路径执行子列列式提取（Subcolumnization），把它们存成独立的列式子列。查询这些路径时只读取所需的子列。

:::tip 为什么使用 VARIANT
如果文档结构会持续变化，但查询仍集中在少数热点路径上，`VARIANT` 的优势主要体现在三点：

- 热点路径会参与子列列式提取（Subcolumnization），因此能直接受益于列存性能、文件裁剪和向量化计算。
- 关键路径可以建立路径级索引，支持全文检索，同时继续受益于 Doris 的稀疏索引裁剪能力。
- 面向宽列场景的存储优化，让万级子列规模的自动子列列式提取（Subcolumnization）保持可用。若参与子列列式提取（Subcolumnization）的路径接近 10000，对硬件要求会明显提高，通常应优先评估 DOC mode。

如果你还在决定默认模式、Sparse、DOC mode 还是 Schema Template，建议先阅读 [VARIANT 使用与配置指南](./variant-workload-guide.md)。本页提供写入与解析、类型规则、CAST、NULL 与比较语义、ALTER、索引、限制和配置的参考。
:::

:::info 版本说明
本页描述 Doris 5.0.0 及之后版本中的 VARIANT。与 Doris 4.x 相比，最容易影响已有 SQL 的差异有：

- `INSERT` 会把字符串作为 VARIANT 字符串写入，不再按 JSON 解析，从 `s3()`、`hdfs()` 等表函数执行 `INSERT INTO ... SELECT` 也是如此。用 `INSERT` 写入 JSON 文本时请使用 `PARSE_TO_VARIANT`；Stream Load 等导入作业仍会解析 JSON。
- 整个 VARIANT 值支持 `GROUP BY`、`DISTINCT` 和集合运算；两个 VARIANT 值之间可以用 `=`、`!=`、`<=>` 比较，也可以作为 Join 键、`ORDER BY` 键和窗口键。
- 即使路径在 Schema Template 中声明了类型，`v['path']` 仍是 `VARIANT` 类型，需要显式 CAST。会话变量 `enable_variant_schema_auto_cast` 已不再生效。
- `VARIANT_TYPE` 返回单个类型名称（如 `object`），不再返回从路径到类型的映射。
- VARIANT 数组可以用整数下标访问，下标从 1 开始。

Doris 4.x 的行为请参阅本页的 4.x 版本。
:::

## 快速上手 {#quick-start}

```sql
CREATE TABLE events (
    id BIGINT,
    v  VARIANT
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- INSERT 会把字符串字面量保留为 VARIANT 字符串，因此 JSON 文本需要显式解析。
INSERT INTO events VALUES
    (1, PARSE_TO_VARIANT('{"user": {"id": 42, "name": "alice"}, "tags": ["doris", "sql"], "score": 9.5}')),
    (2, PARSE_TO_VARIANT('{"user": {"id": 7, "name": "bob"}, "score": 3}'));

SELECT id,
       CAST(v['user']['name'] AS STRING) AS name,
       v['tags'][1] AS first_tag
FROM events
WHERE CAST(v['score'] AS DOUBLE) > 5;
```

```text
+------+-------+-----------+
| id   | name  | first_tag |
+------+-------+-----------+
|    1 | alice | doris     |
+------+-------+-----------+
```

- `v['user']['name']` 和 `v['tags'][1]` 返回 `VARIANT` 值。数组下标从 1 开始。
- 对路径做比较或计算之前，先把它 CAST 为具体类型。`v['score'] > 5` 通过[隐式转换](#implicit-conversion)也能执行，但它按 `DECIMAL(38, 9)` 比较，而且无法利用索引。
- Stream Load 等导入作业会自动解析 JSON 文本。参见[写入数据](#write-data)。

## 定义 VARIANT 列 {#define-a-variant-column}

```sql
column_name VARIANT
column_name VARIANT< field_definition [, field_definition ...] >
column_name VARIANT< properties('key' = 'value' [, ...]) >
column_name VARIANT< field_definition [, ...], properties('key' = 'value' [, ...]) >

field_definition:
    [MATCH_NAME | MATCH_NAME_GLOB] 'path_or_pattern' : data_type [COMMENT 'comment']
```

- `field_definition` 列表就是 [Schema Template](#schema-template)，用于固定部分路径的存储类型。
- `properties(...)` 用于设置列级存储属性，参见[列属性](#column-properties)。
- VARIANT 列可以是 `NULL` 或 `NOT NULL`，默认值只能是 `NULL`。

```sql
CREATE TABLE IF NOT EXISTS example_tbl (
    k BIGINT,
    v VARIANT<
        'id' : INT,             -- 路径 id 以 INT 存储
        'message*' : STRING,    -- 匹配 message* 的路径以 STRING 存储
        'tags*' : ARRAY<TEXT>,  -- 匹配 tags* 的路径以 ARRAY<TEXT> 存储
        properties('variant_max_subcolumns_count' = '2048')
    > NULL
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

VARIANT 列在表中的使用范围：

| 用法 | 是否支持 | 说明 |
| --- | --- | --- |
| Duplicate Key、Unique Key、Aggregate Key 表的 Value 列 | 支持 | 在 Aggregate Key 表中，聚合类型必须是 `REPLACE` 或 `REPLACE_IF_NOT_NULL`。 |
| Key 列、分区列、分桶列 | 不支持 | |
| 在表结构中嵌套在其他类型内（`ARRAY<VARIANT>`、`MAP`、`STRUCT`） | 不支持 | 查询结果仍可以是 `ARRAY<VARIANT>`，例如 `COLLECT_LIST(v)` 的结果。 |
| 默认值 | 只能是 `NULL` | `DEFAULT '{}'` 等非 NULL 默认值会被拒绝。 |

## 写入数据 {#write-data}

### 输入如何变成 VARIANT 值 {#how-input-becomes-a-variant-value}

| 写入方式 | 结果 |
| --- | --- |
| `INSERT ... VALUES` 或 `INSERT ... SELECT` 写入 `CHAR`、`VARCHAR`、`STRING` 表达式 | VARIANT **字符串**。即使内容看起来像 JSON，也不会被解析。从 `s3()`、`hdfs()`、`local()` 等表函数执行 `INSERT INTO ... SELECT`、带 `http_stream` SQL 语句的 Stream Load，以及 Group Commit 方式的 INSERT，都是如此。 |
| `INSERT` 写入 `PARSE_TO_VARIANT(expr)` 或 `TRY_PARSE_TO_VARIANT(expr)` | 解析后的 JSON 值。参见[解析错误](#parse-errors)。 |
| `INSERT` 写入 `JSON`/`JSONB` 表达式 | 按原结构直接转换。 |
| `INSERT` 写入其他类型的表达式 | 带类型的值，参见[其他类型 CAST 为 VARIANT](#cast-to-variant)。 |
| 导入作业（Stream Load、Broker Load、Routine Load） | 写入 VARIANT 列的字符串字段会按 JSON 解析，与文件格式无关：CSV 文本、Parquet 的 `STRING` 列、JSON 中的字符串值都是如此。CSV 中的 `\N` 导入为 SQL `NULL`。 |
| JSON 格式的导入作业 | 字段对应的 JSON 值。JSON 字符串会再按 JSON 文本解析一次：`"123"` 导入为数值 `123`，`"true"` 导入为布尔值 `true`，`"{\"a\": 1}"` 导入为对象，`"hello"` 仍是字符串 `hello`。顶层的 JSON 布尔值导入为数值 `1` 或 `0`。JSON `null` 或缺失的字段导入为 SQL `NULL`。 |

`NOT NULL` 的 VARIANT 列不接受 SQL `NULL`：严格模式下 `INSERT` 会失败，导入作业会过滤该行，文本解析失败而得到 SQL `NULL` 的行也会被过滤。

```sql
CREATE TABLE variant_tbl (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_tbl VALUES
    (1, '{"a": 1}'),                     -- 写入为字符串
    (2, PARSE_TO_VARIANT('{"a": 1}'));   -- 写入为对象

SELECT k, v, VARIANT_TYPE(v) AS type, v['a'] FROM variant_tbl ORDER BY k;
```

```text
+------+----------+--------+--------+
| k    | v        | type   | v['a'] |
+------+----------+--------+--------+
|    1 | {"a": 1} | string | NULL   |
|    2 | {"a":1}  | object | 1      |
+------+----------+--------+--------+
```

字符串根值输出时不带引号，因此写入的字符串看起来可能和 JSON 一样，可以用 `VARIANT_TYPE` 区分。如需把这类字符串转成结构化值，请通过 `PARSE_TO_VARIANT(CAST(v AS STRING))` 重新写入。

分步骤的导入示例请参阅[导入 VARIANT 数据](../../../../data-operate/import/complex-types/variant.md)。

### 解析错误 {#parse-errors}

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md)、[TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md) 和导入作业使用同一个 JSON 解析器。导入作业处理错误的方式与 `TRY_PARSE_TO_VARIANT` 相同：

| 输入 | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` 与导入作业 |
| --- | --- | --- |
| 合法 JSON | 解析后的值 | 解析后的值 |
| 非法 JSON 文本，如 `hello` 或 `{"id":` | 保留为 VARIANT 字符串 | 保留为 VARIANT 字符串 |
| 包含超出 [-2^63, 2^64 - 1] 的整数，或超出 `DOUBLE` 范围的数值的 JSON，如 `{"a": 1, "n": 100000000000000000000}` | 整段文本保留为 VARIANT 字符串，因此 `v['a']` 返回 `NULL` | 整段文本保留为 VARIANT 字符串 |
| 空字符串 | 空对象 `{}` | 空对象 `{}` |
| 嵌套超过 128 层 | 报错 | SQL `NULL` |
| 对象 key 超过 `variant_max_json_key_length` 字节（BE 配置，默认 255） | 报错 | SQL `NULL` |
| 同一对象中有重复 key | 报错 | SQL `NULL` |
| 不是合法 UTF-8 的字符串 | 报错 | SQL `NULL` |

有两个 BE 配置会改变上述规则：

- `variant_throw_exeception_on_invalid_json`（默认 `false`）：设置为 `true` 后，解析器无法接受的文本（包括含超范围数值的 JSON）不再保留为 VARIANT 字符串，而是对 `PARSE_TO_VARIANT` 报错，对 `TRY_PARSE_TO_VARIANT` 和导入作业返回 SQL `NULL`。
- `variant_enable_duplicate_json_path_check`（默认 `false`）：设置为 `true` 后，对象中重复的 key 保留第一个值，不再报错。

如需让含超范围整数的文档保持结构，可以先转换为 JSON：`CAST(CAST(text AS JSON) AS VARIANT)`。不超过 38 位的整数保持精确，更大的整数变为 `DOUBLE`。

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"id": 1}')) AS valid_json,    -- object
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS invalid_json,  -- string
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT))  AS string_cast;   -- string
```

### 写入后值的规范化 {#what-storage-keeps}

值写入表时会被规范化，读回的值可能与写入前计算出的值不同：

| 写入前 | 从表中读回 |
| --- | --- |
| 值为 JSON `null` 的对象成员，如 `{"a": null, "b": 1}` | 该成员被移除：`{"b":1}`；`v['a']` 返回 SQL `NULL`。 |
| 值为空对象或空数组的对象成员，以及按这些规则变空的对象，如 `{"a": {}, "b": [], "c": {"d": null}}` | 被移除：`{}` |
| 值为只含 `null` 元素的数组的对象成员，如 `{"p": [null, null], "q": 1}` | 可能被移除：`{"q":1}` |
| 数组内的值，如 `{"arr": [{"a": null}, {}, [], null]}` | 原样保留；`v['arr'][1]['a']` 是 VARIANT `null`。 |
| 根值为 JSON `null`，如 `PARSE_TO_VARIANT('null')` | 空对象 `{}` |
| 根值为空数组 `[]` 或空对象 `{}` | 保留 |
| 不在 Schema Template 路径上的 `DATE`、`DATETIME` 值，如 `CAST(date_col AS VARIANT)` | 以文本形式存储，读回时是字符串 |
| 同一路径上混有布尔值和数值 | 布尔值可能读回为 `1` 或 `0`，取决于同一次写入中值的先后顺序以及 Compaction |
| 含 `.` 的 key，如 `{"a.b": 1}` | 按嵌套路径存储：`{"a":{"b":1}}`，`v['a.b']` 和 `v['a']['b']` 都返回 `1`。如果一个文档同时包含 key `a.b` 和 `a` 下的 key `b`，整条 INSERT 或整个导入作业都会失败。 |
| 对象 key | 按字节序返回 |

这些规则会受同一次写入的其他行以及 DOC mode 影响，因此不要依赖 `null` 值或空容器在写入后仍然保留。在 Schema Template 中声明过的路径会转换为声明的类型，参见 [Schema Template](#schema-template)。

## 类型推断与类型冲突 {#type-inference-and-type-conflicts}

没有 Schema Template 时，Doris 在解析 JSON 时推断每个值的类型，`VARIANT_TYPE` 返回的就是这个类型：

| JSON 值 | 类型 |
| --- | --- |
| `BIGINT` 范围内的整数 | `tinyint`、`smallint`、`int` 或 `bigint` 中能容纳该值的最小类型 |
| 超出 `BIGINT` 范围、不超过 18446744073709551615 的整数 | `decimal` |
| 带小数部分或指数的数值 | `double` |
| 超出 [-2^63, 2^64 - 1] 的整数，或超出 `DOUBLE` 范围的数值 | 不作为数值处理：整段文本都是非法 JSON（参见[解析错误](#parse-errors)） |
| 字符串 | `string` |
| `true`、`false` | `bool` |
| `null` | `null` |
| 数组、对象 | `array`、`object` |

数据存储时，每个路径只有一种存储类型：

- 整数存为 `BIGINT`，需要时存为 `LARGEINT`；浮点数存为 `DOUBLE`，定点数存为 `DECIMAL`，字符串存为 `STRING`，布尔值存为 `BOOLEAN`，由标量组成的数组存为 `ARRAY<T>`。
- 对象数组、嵌套数组，以及值的类型不一致的路径（例如整数与浮点数、数值与字符串、标量与数组），存为 `JSONB`（`DESC` 中显示为 `json`）。元素类型冲突的数组存为 `ARRAY<JSONB>`。

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a 存为 JSONB
```

`JSONB` 路径保留所有值，但失去类型化存储的能力：索引和基于类型的裁剪都不再作用于该路径。布尔值是一个特例：如果路径上的第一个值是布尔值、后续的值是数值，该路径可能按数值存储，布尔值读回为 `1` 或 `0`。需要稳定类型的路径，请在 Schema Template 中声明。

`VARIANT_TYPE` 报告的是每个值的类型，因此从 `BIGINT` 路径读出的整数仍可能是 `tinyint`。要查看每个路径的存储类型，请执行 `SET describe_extend_variant_column = true;` 后再执行 `DESC table_name;`，参见[查看子列与类型](#inspect-subcolumns-and-types)。

## 访问路径与输出 {#access-paths-and-output}

- `v['key']` 和 `v['a']['b']` 读取对象成员；`v['arr'][1]` 读取数组元素，下标从 1 开始，`-1` 表示最后一个元素。[ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md) 与之等价。
- 结果是 `VARIANT` 值。key 不存在、下标为 `0` 或越界、对数组使用字符串 key、对对象使用整数下标、对标量值使用 key，都返回 SQL `NULL`。
- 在计算出的值中，含 `.` 的 key 是一个整体：`v['a.b']` 读取 key `a.b`，而 `v['a']['b']` 读取 `a` 下的 `b`。存储不保留这种区分，参见[写入后值的规范化](#what-storage-keeps)。
- 路径不会自动展开数组。对于 `{"a": [{"b": 1}]}`，`v['a']['b']` 返回 `NULL`，应写作 `v['a'][1]['b']`。

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

常见写法是把路径 CAST 为查询需要的类型：

```sql
SELECT * FROM tbl WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';
SELECT * FROM tbl WHERE v['bool'];                -- 隐式 CAST 为 BOOLEAN
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';   -- 使用该路径上的倒排索引
```

读取整个 VARIANT 值会返回 JSON 文本。对象 key 按字节序输出，且不含空白，因此与输入文本并非按字节完全一致。字符串根值输出时不带引号。`CAST(v AS STRING)` 则按对应 SQL 类型的格式输出标量根值，例如布尔根值变为 `1` 或 `0`。

```sql
INSERT INTO variant_tbl VALUES (3, PARSE_TO_VARIANT('{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }'));

SELECT v FROM variant_tbl WHERE k = 3;
-- {"a":1,"b":2,"c":{"x":10,"y":20}}
```

## CAST 与隐式转换 {#cast-and-implicit-conversion}

### 其他类型 CAST 为 VARIANT {#cast-to-variant}

| 源类型 | 结果 |
| --- | --- |
| `CHAR`、`VARCHAR`、`STRING` | VARIANT 字符串，不解析 JSON 文本。字符串必须是合法的 UTF-8，否则 CAST 报错。 |
| `BOOLEAN` | 布尔值。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT` | 整数。 |
| `LARGEINT` | 定点数。绝对值超过 10^38 - 1 的值会变成字符串。 |
| `FLOAT`、`DOUBLE` | 浮点数。 |
| `DECIMALV2`、`DECIMAL(p, s)`（`p <= 38`） | 定点数。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS` | 日期，或不带时区的时间戳。 |
| `IPV4`、`IPV6` | 字符串，内容为该值的文本形式。 |
| `JSON` / `JSONB` | 保持原结构。包含 VARIANT 无法表示的值（如 `DECIMAL256` 数值）时，CAST 报错。 |
| `ARRAY<T>` | 数组，逐个转换元素。`T` 必须是 `VARIANT` 或本表中的类型。 |
| `MAP`、`STRUCT`、`TIME`、`TIMESTAMPTZ`、`VARBINARY` 等其他类型 | 不支持，语句报错。 |

源值还必须是其类型的合法值，非法值会被拒绝，不会被自动修复。CAST 不会解析字符串：`CAST('{"id": 1}' AS VARIANT)` 得到字符串 `{"id": 1}`。需要解析 JSON 文本时请使用 `PARSE_TO_VARIANT`。

### VARIANT CAST 为其他类型 {#cast-from-variant}

| 目标类型 | 结果 |
| --- | --- |
| `BOOLEAN` | 布尔值保持不变；数值非零即为 `true`；字符串按 `CAST(string AS BOOLEAN)` 的规则转换。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT` | 整数。定点数和浮点数的小数部分被截断（`1.5` 变为 `1`）；布尔值变为 `1` 或 `0`；`"123"` 这样的数字字符串会被转换。 |
| `FLOAT`、`DOUBLE`、`DECIMAL(p, s)` | 数值和数字字符串。`DECIMAL` 按 scale `s` 舍入。超出 `FLOAT` 范围的值变为 `Infinity`。 |
| `DATE`、`DATETIME(p)`、`TIMESTAMP_NS`、`TIMESTAMPTZ(p)` | 日期时间值、日期时间格式的字符串，以及 `20240102` 这样的数值。 |
| `IPV4`、`IPV6` | IP 地址格式的字符串。 |
| `CHAR`、`VARCHAR`、`STRING` | 字符串根值原样返回，不带引号；对象和数组返回 JSON 文本；其他标量按对应 SQL 类型的格式输出：布尔根值为 `1` 或 `0`，`DATETIME` 值带 6 位小数，`TIMESTAMP_NS` 值带 9 位小数。VARIANT `null` 返回字符串 `null`。 |
| `JSON` / `JSONB` | 保持原结构。没有 JSON 对应类型的值（如日期、时间戳）会变成 JSON 字符串；带时区的时间戳按会话时区格式化。 |
| `ARRAY<T>` | 按元素转换的数组，无法转换的元素变为 `NULL`。内容为 JSON 数组的字符串（如 `"[1, 2]"`）也会被转换。其他值返回 `NULL`。 |
| `MAP`、`STRUCT`、`TIME` 等其他类型 | 不支持，语句报错。 |

值无法转换为目标类型时返回 SQL `NULL`。这与 `enable_strict_cast` 无关：即使在严格模式下，把 VARIANT CAST 为其他类型也不会因为值本身而报错。

```sql
SELECT CAST(PARSE_TO_VARIANT('"123"') AS INT)      AS from_string,   -- 123
       CAST(PARSE_TO_VARIANT('"abc"') AS INT)      AS not_a_number,  -- NULL
       CAST(PARSE_TO_VARIANT('1.5') AS INT)        AS truncated,     -- 1
       CAST(PARSE_TO_VARIANT('300') AS TINYINT)    AS overflow,      -- NULL
       CAST(PARSE_TO_VARIANT('{"a": 1}') AS INT)   AS from_object,   -- NULL
       CAST(PARSE_TO_VARIANT('[1, "2", null, "x"]') AS ARRAY<INT>) AS arr;  -- [1, 2, null, null]

SELECT CAST(PARSE_TO_VARIANT('true') AS STRING)        AS bool_root,     -- 1
       CAST(PARSE_TO_VARIANT('{"b": true}') AS STRING) AS object_text,   -- {"b":true}
       CAST(PARSE_TO_VARIANT('"abc"') AS STRING)       AS string_root,   -- abc
       CAST(PARSE_TO_VARIANT('null') AS STRING)        AS variant_null;  -- null
```

### Decimal 与日期时间值 {#decimal-and-datetime-values}

把以下类型转换为 VARIANT 时：

| Doris 类型 | 行为 |
| --- | --- |
| 旧版 `DECIMALV2` | 精确保留 precision 不超过 27、scale 不超过 9 的值。 |
| `DECIMAL(p, s)` | 精确保留 `1 <= p <= 38` 且 `0 <= s <= p` 的值；不支持 precision 超过 38 的 Decimal。 |
| `DATE` | 不含时间和时区的日历日期。 |
| `DATETIME(p)` | `0 <= p <= 6`，不做时区调整。 |
| `TIMESTAMP_NS` | 纳秒精度，不做时区调整；值必须在 TIMESTAMP_NS 取值范围内。 |
| `TIMESTAMPTZ(p)` | 不能 CAST 为 VARIANT。可以在 Schema Template 中把路径声明为 `TIMESTAMPTZ`。 |
| `TIME` | 不支持。 |

### 隐式转换 {#implicit-conversion}

本节中，**子路径**指直接作用在 VARIANT 值上的路径表达式：`v['a']`、`v['a']['b']` 或 `ELEMENT_AT(v, 'a')`。其他 VARIANT 表达式，如列 `v` 本身、`PARSE_TO_VARIANT(...)`、`CAST(... AS VARIANT)`、`COALESCE(v['a'], v['b'])`，都属于**整个值**。

以下情况 Doris 会隐式转换 VARIANT：

- **子路径与非 VARIANT 值比较。** 在 `v['a'] = 1`、`v['d'] > DATE '2024-01-01'`、`v['a'] IN (1, 2)` 中，子路径会根据另一侧操作数 CAST 为具体类型：整数和定点数按 `DECIMAL(38, 9)` 比较，`FLOAT`、`DOUBLE` 按 `DOUBLE` 比较，`DATE`、`DATETIME`、`TIMESTAMPTZ` 按 `DATETIME(6)` 比较（时区被丢弃），字符串按 `STRING` 比较，布尔值按 `BOOLEAN` 比较。转换遵循上文的 CAST 规则，因此字符串 `"1"` 等于 `1`，而无法转换的值使比较结果为 `NULL`。与字符串字面量比较时按字符串比较：`v['d'] > '2024-01-01'` 是字符串比较，不是日期比较。Join 条件（如 `t1.v['id'] = t2.id`）也按同样的规则转换。
- **整个值与非 VARIANT 值组成的 `IN` 列表。** `v IN ('a', 'b')` 会把 `v` CAST 为列表的类型，因此对象按其 JSON 文本比较。这与 `v = 'a'` 不同，后者会被拒绝。
- **函数参数。** 当函数的参数是数值、字符串或 JSON 类型时，VARIANT 参数会被 CAST 为参数类型，例如 `ABS(v['n'])`、`LENGTH(v['s'])`、`SUM(v['n'])`。
- **JSON 函数。** `JSON_EXTRACT`、`JSON_KEYS`、`JSON_CONTAINS`、`TO_JSON` 等函数可以直接传入 VARIANT 参数，Doris 会先用 `CAST(v AS JSON)` 转换。同时接受字符串参数的函数（`JSON_VALID`、`JSON_QUOTE`、`JSON_UNQUOTE`、`JSON_PARSE`）使用字符串形式，因此字符串根值传给 `JSON_PARSE(v)` 会失败；把 VARIANT 值转换为 JSON 请使用 `CAST(v AS JSON)`。整文档类的 JSON 函数需要读取并组装完整的 VARIANT 值，因此只读一个路径时，`v['a']['b']` 远快于 `JSON_EXTRACT(v, '$.a.b')`。
- **在 `IF`、`CASE`、`COALESCE`、`IFNULL` 或 `UNION` 中把 VARIANT 与其他类型混用。** 结果取另一侧的类型（整数变为 `DECIMAL(38, 9)`），所有 VARIANT 值都会 CAST 为该类型，无法转换的值变为 `NULL`：`COALESCE(PARSE_TO_VARIANT('"abc"'), 0)` 返回 `0.000000000`。如需保持 VARIANT 结果，请让另一侧也是 VARIANT：`COALESCE(v['a'], CAST(0 AS VARIANT))`。

隐式转换有两个代价：

- **无法利用索引和裁剪。** 隐式 CAST 后的比较逐行求值。`v['id'] = 123` 这样的数值比较无法利用 zone map、BloomFilter 或倒排索引，即使路径在 Schema Template 中声明过也是如此。请把子路径 CAST 为它的存储类型，例如 `CAST(v['id'] AS BIGINT) = 123`。字符串子路径与字符串字面量比较时仍能使用倒排索引。
- **`DECIMAL(38, 9)` 的限制。** 绝对值不小于 10^29 的值会变为 `NULL`，小数点后第 9 位之后的数字会被舍去。`v['n'] > 5` 匹配不到 `1e30`，`v['x'] = 0.1234567891` 也会匹配 `0.123456789`。值可能这么大或这么精确时，请 CAST 为 `DOUBLE` 或存储类型。

以下情况 Doris 不做隐式转换，需要显式 CAST：

- 算术运算：`v['a'] + 1` 会报错，请写成 `CAST(v['a'] AS BIGINT) + 1`。
- 整个值与非 VARIANT 值比较：`v = 1`、`v = 'x'`、`PARSE_TO_VARIANT('1') = 1` 会报错。
- 两个 VARIANT 值之间的 `<`、`<=`、`>`、`>=`，包括两个子路径之间的比较，如 `v['a'] < v['b']`。
- 对 VARIANT 值使用 `MIN`、`MAX`。
- Schema Template 中声明的路径：即使 `id` 声明为 `INT`，`v['id']` 仍是 `VARIANT`。上面的子路径规则仍然适用，所以 `v['id'] = 1` 可以执行，而 `v['id'] + 1` 需要 CAST。

## NULL 语义 {#null-semantics}

### SQL NULL 与 VARIANT null {#sql-null-and-variant-null}

VARIANT 中有两种 null：

- **SQL `NULL`** 表示没有值。它来自值为 `NULL` 的列、不存在的路径（如 `v['no_such_key']`）或失败的 CAST，遵循普通的 SQL 规则。
- **VARIANT `null`** 是一个值，即 JSON 字面量 `null`，例如 `PARSE_TO_VARIANT('null')` 的结果或数组中的 `null` 元素。`VARIANT_TYPE` 对它返回 `null`。它不是 SQL `NULL`。

| 操作 | SQL `NULL` | VARIANT `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| `COALESCE(v, x)`、`IFNULL(v, x)`，`x` 为 VARIANT | 返回 `x` | 返回该 VARIANT `null` |
| `COUNT(v)`、`COUNT(DISTINCT v)` | 不计入 | 计入 |
| `GROUP BY v`、`DISTINCT` | 所有 SQL `NULL` 归为一组 | 所有 VARIANT `null` 归为另一组 |
| `ORDER BY v` | 由 `NULLS FIRST` 或 `NULLS LAST` 决定位置；默认升序时排在最前，降序时排在最后 | 升序时排在其他所有非 NULL 值之前 |
| `v = x`、等值 Join | 不会匹配 | 与另一个 VARIANT `null` 匹配 |
| `v <=> x` | 与 SQL `NULL` 匹配 | 与另一个 VARIANT `null` 匹配 |
| `CAST(v AS STRING)` | SQL `NULL` | 字符串 `null` |
| `CAST(v AS INT)` 等标量类型 | SQL `NULL` | SQL `NULL` |
| `CAST(v AS JSON)` | SQL `NULL` | JSON `null` |

如果 `COALESCE` 或 `IFNULL` 中的 `x` 不是 VARIANT，VARIANT 一侧会先被 CAST，参见[隐式转换](#implicit-conversion)。

### 计算侧的值与存储侧的值 {#computed-values-and-stored-values}

JSON `null` 最终是 VARIANT `null` 还是 SQL `NULL`，取决于这个值是否写入过表：

| 值的来源 | 对象成员为 `null`（`{"a": null}`） | 根值为 `null` | 数组元素为 `null` |
| --- | --- | --- | --- |
| 查询中计算得到（`PARSE_TO_VARIANT`、CAST、函数） | `v['a']` 是 VARIANT `null` | VARIANT `null` | VARIANT `null` |
| 从表中读取 | 该成员已被移除，`v['a']` 是 SQL `NULL`（数组内对象的成员会保留） | 读回为 `{}` | VARIANT `null` |

导入作业还有一条规则：JSON 格式中，`"v": null` 或缺失字段会给该列导入 SQL `NULL`；CSV 格式中，`\N` 导入 SQL `NULL`，而文本 `null` 会被解析为 VARIANT `null`，读回时是 `{}`。

```sql
-- 计算侧：成员存在，值为 VARIANT null。
SELECT PARSE_TO_VARIANT('{"a": null}')['a'] IS NULL                AS is_sql_null,  -- 0
       VARIANT_TYPE(PARSE_TO_VARIANT('{"a": null}')['a'])          AS type;         -- null

-- 存储侧：成员被移除，读取时返回 SQL NULL。
INSERT INTO variant_tbl VALUES (4, PARSE_TO_VARIANT('{"a": null, "b": 1}'));

SELECT v, v['a'] IS NULL AS is_sql_null FROM variant_tbl WHERE k = 4;
-- v: {"b":1}, is_sql_null: 1
```

由此带来的影响：

- 对于已存储的数据（数组之外的对象成员），无论 `a` 原本不存在还是为 `null`，`v['a'] IS NULL` 都为 true，写入后无法再区分这两种情况。
- 对于计算出的值，`IS NULL` 不会匹配 JSON `null`。如果希望把 JSON `null` 也当作缺失处理，需要同时判断类型：`x IS NULL OR VARIANT_TYPE(x) = 'null'`。
- 存储后的 `{"a": null}`、`{}` 以及根值 `null` 读回时都是 `{}`，因此在 `GROUP BY`、`DISTINCT` 和 Join 中是同一个值。

## 比较、分组与排序 {#comparison-grouping-and-ordering}

VARIANT 值按逻辑值比较，而不是按文本或物理编码比较。相等判断、Hash（`GROUP BY`、`DISTINCT`、Join）和排序（`ORDER BY`、窗口键）使用同一套规则，因此相等的值一定落在同一分组，排序时也处于同一位次。

### 支持的操作 {#supported-operations}

| 对 VARIANT 值的操作 | 支持情况 | 说明 |
| --- | --- | --- |
| 两个 VARIANT 值之间，或与 `NULL` 字面量之间的 `=`、`!=`、`<=>` | 支持 | 也包括子路径，如 `v['a'] = w['a']`。 |
| 等值 Join、Semi/Anti Join、`IN`/`NOT IN` 子查询 | 支持 | VARIANT Join 键不会生成 Runtime Filter。 |
| `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`UNION`、`INTERSECT`、`EXCEPT` | 支持 | |
| `ORDER BY`、`ORDER BY ... LIMIT` | 支持 | |
| 窗口函数的 `PARTITION BY` 与 `ORDER BY` | 支持 | |
| `COUNT(v)`、`COLLECT_LIST(v)`、`ARRAY_AGG(v)` | 支持 | |
| `IF`、`CASE`、`IFNULL`、`COALESCE` | 支持 | 把 VARIANT 与其他类型混用会转换 VARIANT 值，参见[隐式转换](#implicit-conversion)。 |
| `CAST(v AS ARRAY<VARIANT>)`、`EXPLODE_VARIANT_ARRAY`，以及对 `ARRAY<VARIANT>` 使用 `EXPLODE`、`EXPLODE_OUTER` | 支持 | |
| VARIANT 值之间的 `<`、`<=`、`>`、`>=`、`BETWEEN` | 不支持 | 请先 CAST 为具体类型。 |
| 整个 VARIANT 值与非 VARIANT 值比较，如 `v = 1` | 不支持 | 子路径会被隐式转换：`v['a'] = 1` 可以执行。 |
| 包含 VARIANT 值的 `IN` 列表，如 `v IN (PARSE_TO_VARIANT('1'))` | 不支持 | 由非 VARIANT 值组成的 `v IN ('a', 'b')` 可以通过隐式转换执行。 |
| `MIN`、`MAX` | 不支持 | 请先 CAST 子路径。 |
| 以 VARIANT 作为参数的 `ARRAY(...)`、`MAP(...)`、`NAMED_STRUCT(...)` | 不支持 | |

### 相等规则 {#equality}

- **数值。** 整数、小数部分为零的定点数、值为整数的浮点数相等：`1`、`1.0`、`1.00` 是同一个值。定点数末尾的零不影响取值，`-0.0` 等于 `0`。带小数部分的定点数和浮点数永不相等：`DECIMAL 1.5` 不等于 `DOUBLE 1.5`。带小数部分的 JSON 数值解析为 `DOUBLE`；定点数来自 CAST、Schema Template 路径，以及超出 `BIGINT` 范围的整数。
- **不同种类的值永不相等。** 数值 `1`、字符串 `"1"` 和 `true` 是三个不同的值。`DATE` 不等于字符串 `"2024-01-01"`，不带时区的时间戳也不等于带时区的时间戳。
- **字符串** 只有字节完全相同时才相等，区分大小写。
- **对象** 在 key 集合相同且对应的值都相等时相等，与 key 的顺序无关。
- **数组** 在长度相同且对应位置的元素都相等时相等，元素顺序有影响。
- VARIANT `null` 等于另一个 VARIANT `null`；SQL `NULL` 遵循 SQL 规则。

```sql
SELECT PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('1.0')                             AS int_double,  -- 1
       PARSE_TO_VARIANT('1.5') = CAST(CAST(1.5 AS DECIMAL(10, 2)) AS VARIANT)       AS dbl_dec,     -- 0
       PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('"1"')                             AS num_str,     -- 0
       PARSE_TO_VARIANT('{"a": 1, "b": 2}') = PARSE_TO_VARIANT('{"b": 2, "a": 1}') AS obj,         -- 1
       PARSE_TO_VARIANT('[1, 2]') = PARSE_TO_VARIANT('[2, 1]')                     AS arr;         -- 0
```

### 排序规则 {#ordering}

对 VARIANT 值执行 `ORDER BY` 时使用统一的全序。不同种类的值先按种类排序：

```text
null < boolean < number < string < binary < date < timestamp with time zone
     < timestamp without time zone < time < UUID < object < array
```

binary、time 和 UUID 值无法通过 Doris 的 JSON 解析或 CAST 产生，只可能来自其他系统写入的 VARIANT 数据，例如带 VARIANT 列的 Parquet 文件。

同一种类内：

- **布尔值：** `false` 在 `true` 之前。
- **数值：** 在整数、定点数和浮点数之间统一按数值大小排序。定点数与浮点数数值相同且带小数部分时，定点数排在前面。负无穷最小；正无穷和 NaN 最大，NaN 在正无穷之后。
- **字符串：** 按 UTF-8 字节排序。大写字母排在小写字母之前，`"10"` 排在 `"9"` 之前。
- **日期与时间戳：** 按时间先后。所有日期都排在所有时间戳之前。
- **对象：** 按 key 的顺序逐项比较：先比较最小的 key，再比较它的值，然后比较下一个 key，依此类推。一个对象的所有项是另一个对象的前缀时，前者排在前面，因此 `{"a":1}` < `{"a":1,"b":2}` < `{"b":0}`。
- **数组：** 逐个元素比较；前缀排在前面，因此 `[]` < `[null]` < `[1]` < `[1,2]`。

SQL `NULL` 的位置由 `NULLS FIRST` 或 `NULLS LAST` 决定。

```sql
SELECT v, VARIANT_TYPE(v) AS type
FROM (
    SELECT PARSE_TO_VARIANT('[1, 2]') AS v UNION ALL
    SELECT PARSE_TO_VARIANT('{"a": 1}')    UNION ALL
    SELECT PARSE_TO_VARIANT('"9"')         UNION ALL
    SELECT PARSE_TO_VARIANT('"10"')        UNION ALL
    SELECT PARSE_TO_VARIANT('10')          UNION ALL
    SELECT PARSE_TO_VARIANT('9.5')         UNION ALL
    SELECT PARSE_TO_VARIANT('true')        UNION ALL
    SELECT PARSE_TO_VARIANT('null')        UNION ALL
    SELECT NULL
) t
ORDER BY v;
```

```text
+---------+---------+
| v       | type    |
+---------+---------+
| NULL    | NULL    |
| null    | null    |
| true    | bool    |
| 9.5     | double  |
| 10      | tinyint |
| 10      | string  |
| 9       | string  |
| {"a":1} | object  |
| [1,2]   | array   |
+---------+---------+
```

### 按具体类型比较与按 VARIANT 比较 {#typed-comparison-and-variant-comparison}

比较采用 VARIANT 规则还是具体类型的规则，由操作数决定。假设路径 `a` 上有 `1`、`1.0`、`"1"` 三个值：

| 表达式 | 比较方式 | 结果 |
| --- | --- | --- |
| `v['a'] = 1` | 对 `v['a']` 隐式 CAST 后按 `DECIMAL(38, 9)` 比较 | 三个值都匹配 |
| `v['a'] = CAST(1 AS VARIANT)`、`v['a'] = w['a']` | VARIANT | 匹配 `1` 和 `1.0`，不匹配 `"1"` |
| `GROUP BY v['a']` | VARIANT | `1` 和 `1.0` 同组，`"1"` 另成一组 |
| `GROUP BY CAST(v['a'] AS STRING)` | `STRING` | 只有一组 `1` |
| `ORDER BY v['a']` | VARIANT | 先数值，后字符串 |
| `ORDER BY CAST(v['a'] AS INT)` | `INT` | 按数值排序；无法转换的值变为 `NULL` |

### 注意事项 {#notes}

- **代价。** VARIANT 键按逻辑值做 Hash 和比较。在一个 4400 万行的测试中，以 VARIANT 为键的 `GROUP BY`、排序和 Join，耗时是对 `CAST(v['path'] AS <type>)` 执行相同操作的 1.2 到 3.7 倍。路径类型确定时，请先 CAST。
- **结果以存储后的值为准。** [写入后值的规范化](#what-storage-keeps)发生在比较之前：原本为 `null` 的成员已经不存在；未在 Schema Template 中声明的 `DATE` 按字符串比较；同一路径上与数值混在一起的布尔值可能读回为 `1` 或 `0`。类型重要的路径请在 Schema Template 中声明。
- **混合类型按种类排序，而不是按值排序。** 如果一个路径上既有数值又有数字字符串，`ORDER BY v['a']` 会把所有数值排在所有字符串之前，字符串之间再按字节排序。需要数值序或字典序时，请先 CAST 为同一类型。
- **看起来相同的值可能不同。** 在 `GROUP BY` 结果中，数值 `1` 与字符串 `"1"` 显示得完全一样，却是两个分组。可以用 `VARIANT_TYPE` 区分。
- 跨种类的排序由 Doris 定义，目的是保证结果确定。它不属于 JSON 标准，也可能与其他系统不同。
- VARIANT 值的内部 Hash 只用于执行，不是稳定的用户侧校验值。

## Schema Template {#schema-template}

Schema Template 用于声明部分路径的存储类型。只需声明需要稳定类型或路径级索引的关键路径，文档的其余部分仍保持动态。

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'tz_val': TIMESTAMPTZ,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");
```

模板字段可以使用以下类型：

- 数值：`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`FLOAT`、`DOUBLE`，以及 `p <= 38` 的 `DECIMAL(p, s)`
- `STRING`（或 `TEXT`）
- `BOOLEAN`
- `DATE`、`DATETIME(p)`、`TIMESTAMPTZ(p)`、`TIMESTAMP_NS`
- `IPV4`、`IPV6`
- `ARRAY<T>`，`T` 为以上类型之一（仅支持一维）

`CHAR`、`VARCHAR`、`DECIMALV2`、`TIME`、`JSON`、`MAP`、`STRUCT` 和嵌套数组不能用于 Schema Template。DOC mode 下，模板字段进一步限制为字符串、整数、`FLOAT`、`DOUBLE`、`BOOLEAN` 以及由这些类型组成的数组。

### 写入模板路径 {#writing-to-template-paths}

在声明过的路径上，每个值都按非严格模式的 CAST 规则转换为声明类型。无法转换的值存为 `NULL`，读回时该路径不存在；这一行的其余部分照常写入。转换可能会改变值：

```sql
CREATE TABLE tpl_demo (
    k INT,
    v VARIANT<'id': INT, 'price': DECIMAL(10, 2), 'ts': DATETIME(3)>
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO tpl_demo VALUES
    (1, PARSE_TO_VARIANT('{"id": "123", "price": 9.999, "ts": "2024-01-01 10:00:00.123456"}')),
    (2, PARSE_TO_VARIANT('{"id": "abc", "price": "x", "ts": "not a time"}')),
    (3, PARSE_TO_VARIANT('{"id": 1.7}'));

SELECT k, v FROM tpl_demo ORDER BY k;
```

```text
+------+------------------------------------------------------------+
| k    | v                                                          |
+------+------------------------------------------------------------+
|    1 | {"id":123,"price":10.00,"ts":"2024-01-01 10:00:00.123000"} |
|    2 | {}                                                         |
|    3 | {"id":1}                                                   |
+------+------------------------------------------------------------+
```

- `"123"` 变为 `123`，`1.7` 被截断为 `1`，`9.999` 被舍入为 `10.00`，时间戳保留声明的精度（毫秒）；其文本形式总是显示 6 位小数。
- `"abc"`、`"x"`、`"not a time"` 无法转换，因此被丢弃。
- 带小数部分的 JSON 数值在转换前会先解析为 `DOUBLE`，因此 `DECIMAL` 路径可能丢失精度。如需保留全部位数，请把这类值写成 JSON 字符串（参见 [FAQ](#faq)）。
- 日期和 IP 值必须写成 JSON 字符串：`{"date": 2020-01-01}` 与 `{"ip": 127.0.0.1}` 都不是合法 JSON，应写作 `{"date": "2020-01-01"}` 与 `{"ip": "127.0.0.1"}`。

### 读取模板路径 {#reading-template-paths}

即使路径已声明类型，`v['path']` 仍是 `VARIANT`，Doris 不会自动把它 CAST 为声明类型。需要声明类型时请显式 CAST；在过滤条件中也请 CAST 为声明类型，这样查询才能利用该路径上的 zone map 和索引：

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE CAST(v['id'] AS INT) = 123;
```

Schema Template 只决定值如何存储。同样的 JSON 在查询中计算时保留解析得到的类型：

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"price": 9.999}')['price']);  -- double
```

### 通配符匹配 {#pattern-matching}

字段名默认是 glob 模式（`MATCH_NAME_GLOB`）：`*` 匹配任意字符序列，包括嵌套 key 之间的 `.`；`?` 匹配单个字符。例如 `'m*'` 既匹配 `m1`，也匹配 `m2.x`。一个路径匹配多个字段时，使用定义顺序中的第一个：

```sql
CREATE TABLE test_var_pattern (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'enumString*' : STRING,
        'enum*' : ARRAY<TEXT>,
        'ip*' : IPV6
    > NULL
)
PROPERTIES ("replication_num" = "1");

-- enumString1 同时匹配 enumString* 和 enum*，使用第一个（STRING）。
```

如需按字面值匹配包含 `*` 的名称，请使用 `MATCH_NAME`：

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

匹配成功的路径默认参与子列列式提取（Subcolumnization）。如果匹配的路径过多、生成了过多子列，可以考虑开启 `variant_enable_typed_paths_to_sparse`（参见[列属性](#column-properties)）。

列创建后不能修改 Schema Template，参见 [ALTER TABLE](#alter-table)。

## ALTER TABLE {#alter-table}

| 操作 | 是否支持 | 说明 |
| --- | --- | --- |
| `ADD COLUMN ... VARIANT [NULL]` | 支持 | 新列可以带 Schema Template 和属性。 |
| `ADD COLUMN ... VARIANT NOT NULL` | 不支持 | 通过 `ALTER` 新增的 `NOT NULL` 列需要默认值，而 VARIANT 只允许 `DEFAULT NULL`。`NOT NULL` 的 VARIANT 列只能在 `CREATE TABLE` 中定义。 |
| `DROP COLUMN`、`RENAME COLUMN`、`MODIFY COLUMN ... COMMENT '...'` | 支持 | |
| 把 `NOT NULL` 改为 `NULL` | 仅限没有 Schema Template 的列 | |
| 把 `NULL` 改为 `NOT NULL` | 不支持 | |
| 对带 Schema Template 的列做其他任何修改，包括原样重写同一个模板 | 不支持 | 报错 `Can not change variant schema templates`。 |
| 为没有模板的列添加 Schema Template | 不支持 | 报同样的错误。 |
| 修改 `variant_max_subcolumns_count`、`variant_enable_typed_paths_to_sparse`、`variant_max_sparse_column_statistics_size`、`variant_sparse_hash_shard_count`、`variant_enable_doc_mode` 或 `variant_doc_hash_shard_count` | 不支持 | |
| 修改 `variant_doc_materialization_min_rows` | 仅限没有 Schema Template 的列 | |
| 在 VARIANT 与其他类型之间转换，如 `STRING` 转为 `VARIANT` | 不支持 | |
| 在 VARIANT 列上 `ADD INDEX`、`DROP INDEX` | 支持 | 带 `field_pattern` 的索引只能在 `CREATE TABLE` 中定义。VARIANT 列不支持 `BUILD INDEX`。 |

`MODIFY COLUMN` 需要给出完整的新列定义。未写出的属性取对应 `default_variant_*` 会话变量的值。取值与会话变量不同的属性都要原样写出，否则 Doris 会把省略视为修改属性而拒绝执行。

`ALTER TABLE` 不支持的修改（如新的 Schema Template、`NOT NULL` 的 VARIANT 列），可以按新定义建表，再用 `INSERT INTO new_table SELECT ... FROM old_table` 复制数据。源列为 `STRING` 时，请用 `PARSE_TO_VARIANT` 包裹。

```sql
CREATE TABLE t (
    k  INT,
    v  VARIANT,
    vd VARIANT<properties('variant_enable_doc_mode' = 'true')>
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- 失败：通过 ALTER 新增的 NOT NULL 列需要默认值。
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL DEFAULT '{}';
-- ERROR: Json or Variant type column default value just support null

-- 成功：可为 NULL 的列，可以带 Schema Template 和属性。
ALTER TABLE t ADD COLUMN v3 VARIANT<'id': BIGINT, properties('variant_max_subcolumns_count' = '16')> NULL;

-- 失败：Schema Template 不能修改。
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates

-- 成功：在没有模板的 DOC mode 列上，只修改 variant_doc_materialization_min_rows。
ALTER TABLE t MODIFY COLUMN vd VARIANT<
    properties('variant_enable_doc_mode' = 'true', 'variant_doc_materialization_min_rows' = '100')
>;
```

## 列属性 {#column-properties}

列属性写在 VARIANT 类型内的 `properties(...)` 中：

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_enable_typed_paths_to_sparse' = 'true',
          'variant_sparse_hash_shard_count' = '64'
      )
  >
);
```

| 属性 | 默认值 | ALTER | 描述 |
| --- | --- | --- | --- |
| `variant_max_subcolumns_count` | `2048` | 否 | 单个数据文件中参与子列列式提取（Subcolumnization）的动态路径数上限；非空值多的路径优先入选，其余路径存入稀疏列。`0` 表示不限制。取值范围 0 到 100000，建议不超过 10000。默认值已足够覆盖大多数 workload；如果确实需要大规模子列，优先考虑 [DOC mode](./variant-workload-guide.md#doc-mode-template)。 |
| `variant_enable_typed_paths_to_sparse` | `false` | 否 | 默认情况下，Schema Template 路径一定参与子列列式提取，且不计入 `variant_max_subcolumns_count`。设置为 `true` 后，这些路径也计入上限，并可能存入稀疏列。 |
| `variant_sparse_hash_shard_count` | `1` | 否 | 稀疏路径按 Hash 分散到的物理稀疏列数量。取值范围 0 到 1024，`0` 按 `1` 处理。 |
| `variant_max_sparse_column_statistics_size` | `10000` | 否 | 单个数据文件中记录统计信息的稀疏路径数上限。超过后，查询没有统计信息的路径时无法跳过稀疏列。取值范围 1 到 50000。 |
| `variant_enable_doc_mode` | `false` | 否 | 开启 DOC mode。不能与 `variant_max_subcolumns_count`、`variant_enable_typed_paths_to_sparse`、`variant_max_sparse_column_statistics_size`、`variant_sparse_hash_shard_count` 同时设置。 |
| `variant_doc_materialization_min_rows` | `0` | 仅限没有 Schema Template 的列 | 仅用于 DOC mode。行数少于该值的写入只存储文档，待 Compaction 把文件合并到该阈值后再执行子列列式提取。`0` 表示写入时即执行子列列式提取。取值范围 0 到 1000000000。 |
| `variant_doc_hash_shard_count` | `64` | 否 | 仅用于 DOC mode。存储的文档被拆分到的列数。取值范围 0 到 1024，`0` 按 `1` 处理。 |

表中 **ALTER** 列表示 `ALTER TABLE ... MODIFY COLUMN` 能否修改该属性，参见 [ALTER TABLE](#alter-table)。稀疏列和 DOC mode 相关属性的用法参见[宽列](#wide-columns)。

### 会话变量 {#session-variables}

| 变量 | 默认值 | 描述 |
| --- | --- | --- |
| `default_variant_max_subcolumns_count` | `2048` | 定义 VARIANT 列时未指定 `variant_max_subcolumns_count` 所使用的值。 |
| `default_variant_enable_typed_paths_to_sparse` | `false` | 未指定 `variant_enable_typed_paths_to_sparse` 时使用的值。 |
| `default_variant_sparse_hash_shard_count` | `0` | 未指定 `variant_sparse_hash_shard_count` 时使用的值；`0` 按 `1` 处理。 |
| `default_variant_max_sparse_column_statistics_size` | `10000` | 未指定 `variant_max_sparse_column_statistics_size` 时使用的值。 |
| `default_variant_enable_doc_mode` | `false` | 未指定 `variant_enable_doc_mode` 时使用的值。 |
| `default_variant_doc_materialization_min_rows` | `0` | 未指定 `variant_doc_materialization_min_rows` 时使用的值。 |
| `default_variant_doc_hash_shard_count` | `64` | 未指定 `variant_doc_hash_shard_count` 时使用的值。 |
| `describe_extend_variant_column` | `false` | 为 `true` 时，`DESC` 还会列出 VARIANT 列的子列。 |

`default_variant_*` 变量在定义列时生效，包括 `CREATE TABLE` 和 `ALTER TABLE`。修改这些变量不影响已有的列，但会影响之后省略了该属性的 `MODIFY COLUMN`。

### BE 配置 {#be-configuration}

| 配置项 | 默认值 | 描述 |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | JSON 对象 key 的最大字节数，超过即为解析错误。取值范围 1 到 65535。 |
| `variant_throw_exeception_on_invalid_json` | `false` | 为 `false` 时，JSON 解析器无法接受的文本保留为 VARIANT 字符串；为 `true` 时，按解析错误处理。 |
| `variant_enable_duplicate_json_path_check` | `false` | 为 `false` 时，对象中重复的 key 是解析错误；为 `true` 时，保留第一个值，忽略重复出现的 key。 |

这三项都支持运行时修改。解析错误的处理方式参见[解析错误](#parse-errors)。

## Variant 索引 {#variant-indexes}

### 索引选择 {#choosing-indexes}

VARIANT 支持对子列建立 BloomFilter 与 Inverted Index 两类索引。
- 高基数等值/IN 过滤：优先使用 BloomFilter（更省存储、写入更高效）。
- 需要分词、短语、范围检索：使用 Inverted Index，并根据需求设置 `parser`/`analyzer` 等属性。

只有当过滤条件按路径的存储类型比较时，才能使用索引或 BloomFilter。数值路径需要显式 CAST；字符串路径与字符串字面量比较则不需要 CAST。

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- 利用 BloomFilter 做等值/IN 过滤
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 12345678;
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) IN (1, 2, 3);
```

给 VARIANT 列创建 Inverted Index 后，所有子列将继承相同的索引属性（如分词方式）。

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser" = "english")
);

-- 全部子列继承 english 分词属性
SELECT * FROM tbl WHERE v['id_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['id_2'] MATCH 'Apache';
```

### 根据子路径指定索引 {#index-by-subpath}

可为 VARIANT 的部分子列单独指定索引属性，甚至在同一路径上同时配置“分词与不分词”的两种倒排索引。指定路径索引需要在 Schema Template 中声明该路径的类型。

```sql
-- 常用属性：field_pattern（目标子路径）、analyzer、parser、support_phrase 等
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"),
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content")
);

-- v.content 同时具备分词与不分词的倒排索引
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```

支持通配符的路径索引：

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'pattern_*' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "pattern_*"),
    INDEX idx_v(v) USING INVERTED -- 全局指定非分词索引
);

SELECT * FROM tbl WHERE v['pattern_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['pattern_1'] = 'Doris';
```

### 索引失效问题 {#when-indexes-dont-work}

1. 类型变更导致索引丢失：子列类型发生不兼容变更（如 INT→JSONB）会丢失索引。可通过 Schema Template 固定类型与索引。
2. 过滤条件没有按路径的存储类型比较：
   ```sql
   -- 隐式数值比较逐行求值，不使用索引
   SELECT * FROM tbl WHERE v['id'] = 123456;

   -- 应 CAST 为存储类型
   SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 123456;
   ```
   如果 `v['id']` 以字符串存储，请与字符串比较：`v['id'] = '123456'`。
3. 索引配置错误：索引作用于“子列”，对 VARIANT 整体无效。
   ```sql
   -- v 本身不具备索引能力
   SELECT * FROM tbl WHERE v MATCH 'Doris';

   -- 若需对整体 JSON 文本建索引，可额外存字符串列并建索引
   CREATE TABLE IF NOT EXISTS tbl (
       k BIGINT,
       v VARIANT,
       v_str STRING,
       INDEX idx_v_str(v_str) USING INVERTED PROPERTIES("parser" = "english")
   );
   SELECT * FROM tbl WHERE v_str MATCH 'Doris';
   ```

## 宽列 {#wide-columns}

当导入数据包含大量不同的 JSON key 时，通过子列列式提取（Subcolumnization）生成的子列会迅速增多；当规模达到一定程度，可能出现元数据膨胀、写入/合并开销增大、查询性能下降等问题。为应对“宽列”（子列过多），VARIANT 提供两种机制：**稀疏列** 与 **DOC 编码**。

如果你要决定什么时候选 Sparse、什么时候选 DOC mode，请先看 [VARIANT 使用与配置指南](./variant-workload-guide.md)。本节只说明机制本身及其相关属性。

注意：这两种机制**互斥**——启用 DOC 编码后将无法使用稀疏列机制，反之亦然。

### 稀疏列机制 {#sparse-columns}

**机制说明**

- 系统会按“非空比例/稀疏度”对路径排序：高频（不稀疏）路径优先执行子列列式提取（Subcolumnization），并存为独立子列；可执行 Subcolumnization 的最大子列数量由 `variant_max_subcolumns_count` 指定，其余低频（稀疏）路径会被合并存放到稀疏列中。
- 在 Schema Template 中声明过的路径，默认不会被放入稀疏列；可通过 `variant_enable_typed_paths_to_sparse` 允许这些路径进入稀疏列。
- 稀疏列支持 sharding：通过将稀疏子路径分散到多个稀疏列中，降低单列读取负担、提升读取效率；可通过 `variant_sparse_hash_shard_count` 指定稀疏列的实际存储个数。

**参考说明**

- JSON key 总量大，但各个 JSON key 的“非空比例/稀疏度”都比较接近、缺乏区分度：这种情况下很难区分哪些列是真正稀疏的，稀疏列机制的效果会被降低。
- `variant_max_subcolumns_count` 默认就是 `2048`，已经足够覆盖大多数 workload。不要为了预留更多自动提取子列而激进调大；如果场景确实需要大规模子列列式提取（Subcolumnization），优先参考 [DOC mode](./variant-workload-guide.md#doc-mode-template)。实践上仍建议不超过 **10000**。
- `variant_sparse_hash_shard_count` 的设置可按“进入稀疏列的总列数 / 128”粗略估算。例如：VARIANT 中所有 JSON key 为 1 万，设置 `variant_max_subcolumns_count = 2000`，进入稀疏列的总列数约为 8000，则 `variant_sparse_hash_shard_count` 可参考 `8000/128`。

### DOC 编码机制 {#doc-encoding-doc-mode}

**机制说明**

- 子路径仍可执行子列列式提取（Subcolumnization）用于按路径查询，同时会额外保存一份“原始 JSON”作为存储字段，以便更快返回整条 JSON 文档。
- DOC 编码支持 sharding：原始 JSON 会被拆分到多个列中存储，读取整条 JSON 时再组装这些分片；可通过 `variant_doc_hash_shard_count` 指定 DOC 编码的实际分片数。
- 小批量写入时可以暂不执行子列列式提取（Subcolumnization），后续合并时再触发：该行为由 `variant_doc_materialization_min_rows` 决定。例如 `variant_doc_materialization_min_rows = 10000`，当写入行数低于 1 万时，该批次只写入原始 JSON，不会触发 Subcolumnization。
- 对超宽列 workload，DOC mode 也是更稳定的选择，尤其是在 Subcolumnization 规模接近万列时。相比默认的即时 Subcolumnization，compaction 内存可下降约 2/3，在稀疏宽列导入场景下导入性能可提升约 5~10 倍。
- 当 `VARIANT` 列非常宽、查询又经常读取整条文档时，DOC mode 相比从大量子列重组文档，`SELECT variant_col` 的效率可获得数量级提升。

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_enable_doc_mode' = 'true',
          'variant_doc_materialization_min_rows' = '10000',
          'variant_doc_hash_shard_count' = '64'
      )
  >
);
```

**参考说明**

- 需开启 `variant_enable_doc_mode`。
- DOC mode 下，Schema Template 字段只能是字符串、整数、`FLOAT`、`DOUBLE`、`BOOLEAN` 以及由这些类型组成的数组。
- `variant_doc_hash_shard_count` 的设置可按 “JSON key 的总个数 / 128” 粗略估算。

### 达到上限后的行为与调优建议 {#behavior-at-limits-and-tuning-suggestions}

1. 超过上限后，新路径写入稀疏列；Rowset 合并后也可能把部分路径转入稀疏列。
2. 系统会优先让非空比例高、访问频率高的路径保留在子列列式提取（Subcolumnization）中。
3. 若参与子列列式提取（Subcolumnization）的路径接近 10000，对硬件要求较高（建议单机 ≥128G 内存、≥32C）。如果 workload 已经接近这个规模，建议优先评估 DOC mode。
4. 写入侧调优：适度增大客户端 batch_size，或使用 Group Commit（按需增大 `group_commit_interval_ms`/`group_commit_data_bytes`）。
5. 若无分桶裁剪需求，建议采用 RANDOM 分桶，并开启 single tablet 导入以降低 compaction 写放大。
6. BE 配置可按导入压力调整 `max_cumu_compaction_threads`（建议 ≥8）、`vertical_compaction_num_columns_per_group=500`（提升纵向合并效率，增加内存占用）、`segment_cache_memory_percentage=20`（提升元数据缓存命中）。
7. 关注 Compaction Score；若持续上升说明 Compaction 跟不动，需要降低导入压力。
8. 避免大范围 `SELECT *`；尽量使用具体路径投影 `SELECT v['path']`。

## 查看子列与类型 {#inspect-subcolumns-and-types}

方案一：使用 [VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type.md) 逐行查看某个值或某个路径的类型。它会读取检查的每一行：

```sql
SELECT VARIANT_TYPE(v), VARIANT_TYPE(v['a']) FROM variant_tbl LIMIT 10;
```

方案二：扩展 `DESC`，展示已完成子列列式提取（Subcolumnization）的子路径及其存储类型：

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

方案一查看的是每个值的类型，方案二查看的是每个路径的存储方式。

## 限制 {#limitations}

- **大宽表优化**：对于会通过子列列式提取（Subcolumnization）生成大量独立子列的宽表场景（例如超过 2000 列），强烈建议开启 **V3 存储格式**。通过在建表 `PROPERTIES` 中指定 `"storage_format" = "V3"`，可以将列元数据与 Segment Footer 解耦，加快文件打开速度并降低内存占用。
- JSON key 默认最长 255 字节（`variant_max_json_key_length`）。
- VARIANT 列不能作为 Key 列、分区列或分桶列，也不能在表结构中嵌套在其他类型内（参见[定义 VARIANT 列](#define-a-variant-column)）。
- 在未启用 DOC mode 时，读取整个 VARIANT 列会扫描所有子字段。对于超宽列，一般不建议直接 `SELECT variant_col`；如果整列读取是主要查询模式，建议优先使用 DOC mode。若列包含大量子字段，也可额外存储原始 JSON 的 STRING/JSONB 列，以优化如 `LIKE` 等整体匹配：

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- 更优做法：额外保留原始 JSON 字符串列用于整体检索
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```

## 对比 JSON 类型 {#compared-with-json-type}

- 存储：JSON 类型以 JSONB（行存）写入；VARIANT 写入时执行子列列式提取（Subcolumnization），压缩率更高、存储更小。
- 查询：JSON 需解析；VARIANT 直接列式扫描，通常显著更快。

改造的 ClickBench 测试结果（43 条查询）：
- 存储：VARIANT 相比 JSON 约节省 65% 存储空间。
- 查询：VARIANT 较 JSON 提速 8 倍以上，性能接近静态列。

**存储空间**

| 类型           | 存储空间   |
| -------------- | ---------- |
| 预定义静态列   | 12.618 GB  |
| VARIANT 类型   | 12.718 GB  |
| JSON 类型      | 35.711 GB  |

**节省约 65% 存储容量**

| 查询次数       | 预定义静态列 | VARIANT 类型 | JSON 类型     |
| -------------- | ------------ | ------------ | -------------- |
| 第一次查询 (cold) | 233.79s     | 248.66s      | 大部分查询超时 |
| 第二次查询 (hot)  | 86.02s      | 94.82s       | 789.24s        |
| 第三次查询 (hot)  | 83.03s      | 92.29s       | 743.69s        |

## FAQ {#faq}

1. VARIANT 中的 `null` 与 SQL `NULL` 相同吗？
   - 不相同。查询中计算出的 JSON `null` 是 VARIANT `null` 值，而不存在的路径是 SQL `NULL`。值写入表后，值为 `null` 的对象成员会被移除，读取时返回 SQL `NULL`。参见 [NULL 语义](#null-semantics)。
2. 为什么执行 `INSERT INTO t VALUES (1, '{"a": 1}')` 后，`v['a']` 返回 `NULL`？
   - `INSERT` 会把字符串作为 VARIANT 字符串写入，不做解析；从 `s3()`、`hdfs()` 或其他字符串列执行 `INSERT INTO ... SELECT` 也是如此。请使用 `PARSE_TO_VARIANT('{"a": 1}')`，或通过 Stream Load 等导入作业导入数据。参见[写入数据](#write-data)。
3. 为什么一整个合法的 JSON 文档被存成了字符串？
   - 文档中可能包含超出 [-2^63, 2^64 - 1] 的整数，或超出 `DOUBLE` 范围的数值。解析器会拒绝这样的文档，默认情况下它会保留为字符串。参见[解析错误](#parse-errors)。
4. 为什么我的查询/索引没有生效？
   - 请检查是否把路径 CAST 为其存储类型（隐式的数值比较无法使用索引）、是否因为类型冲突被提升为 JSONB、或是否误以为给 VARIANT“整体”建的索引可用于子列。
5. 为什么 `ORDER BY v['a']` 把 `"10"` 排在 `9` 之后，或者 `GROUP BY v['a']` 把 `1` 和 `"1"` 分成两组？
   - VARIANT 的排序和相等判断首先看值的种类：数值排在字符串之前，数值永远不等于字符串。需要数值语义或字典序时，请把路径 CAST 为同一类型。参见[比较、分组与排序](#comparison-grouping-and-ordering)。
6. 为什么 `COALESCE(v['a'], 0)` 返回定点数，或者对字符串值返回 `NULL`？
   - 把 VARIANT 与其他类型混用时，VARIANT 值会被转换为另一侧的类型。请写成 `COALESCE(v['a'], CAST(0 AS VARIANT))` 以保持 VARIANT 结果，或把 `v['a']` CAST 为所需类型。参见[隐式转换](#implicit-conversion)。
7. 为什么 DECIMAL 写入 VARIANT 列时出现小数位/精度丢失？
   - JSON 中带小数部分的数值会推断为 `DOUBLE` 而不是 `DECIMAL`，因此可能丢失末位小数。即使在 Schema Template 中把路径声明为 `DECIMAL`（例如 `v VARIANT<'num': DECIMAL(9, 3)>`），写入时也会先解析为 `DOUBLE` 再转换，仍不能完全保证精度。应在 JSON 文档中把该值写成字符串，例如 `PARSE_TO_VARIANT('{"num": "12.345"}')`，写入时会直接由字符串转换为 `DECIMAL(9, 3)`，不丢精度。
