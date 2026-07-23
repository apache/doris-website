---
{
    "title": "VARIANT",
    "language": "zh-CN",
    "description": "VARIANT 类型用于存储半结构化 JSON 数据，可包含不同基础类型（整数、字符串、布尔等）以及一层数组与嵌套对象。写入时会自动基于 JSON Path 推断子列结构与类型，并对高频路径执行子列列式提取（Subcolumnization），使其以独立子列的形式参与分析，兼顾灵活性与性能。"
}
---

## VARIANT

## 描述

VARIANT 类型用于存储半结构化 JSON 数据，可包含不同基础类型（整数、字符串、布尔等）以及一层数组与嵌套对象。写入时会自动基于 JSON Path 推断子列结构与类型，并对高频路径执行子列列式提取（Subcolumnization），使其以独立子列的形式参与分析，兼顾灵活性与性能。

:::tip 为什么使用 VARIANT
如果文档结构会持续变化，但查询仍集中在少数热点路径上，`VARIANT` 的优势主要体现在三点：

- 热点路径会参与子列列式提取（Subcolumnization），因此能直接受益于列存性能、文件裁剪和向量化计算。
- 关键路径可以建立路径级索引，支持全文检索，同时继续受益于 Doris 的稀疏索引裁剪能力。
- 面向宽列场景的存储优化，让万级子列规模的自动子列列式提取（Subcolumnization）保持可用。若参与子列列式提取（Subcolumnization）的路径接近 10000，对硬件要求会明显提高，通常应优先评估 DOC mode。

如果你还在决定默认模式、Sparse、DOC mode 还是 Schema Template，建议先阅读 [VARIANT 使用与配置指南](./variant-workload-guide)。本页主要提供语法、类型规则、索引、限制和配置参考。
:::

## 使用 VARIANT 类型

### 建表语法

建表时将列类型声明为 VARIANT：

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```

通过 Schema Template 约束部分 Path 的类型（更多见“扩展类型”）：

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT <
        'id' : INT,            -- path 为 id 的子列被限制为 INT 类型
        'message*' : STRING,   -- 前缀匹配 message* 的子列被限制为 STRING 类型
        'tags*' : ARRAY<TEXT>  -- 前缀匹配 tags* 的子列被限制为 ARRAY<TEXT> 类型
    >
)
PROPERTIES("replication_num" = "1");
```

### 查询语法

```sql
-- 访问嵌套字段（返回类型为 VARIANT，需要显式或隐式 CAST 才能聚合/比较）
SELECT v['properties']['title'] FROM ${table_name};

-- 聚合前显式 CAST 为确定类型
SELECT CAST(v['properties']['title'] AS STRING) AS title
FROM ${table_name}
GROUP BY title;

-- 数组查询示例
SELECT *
FROM ${table_name}
WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
```

## 创建和访问值

:::info 版本说明
本节所述行为适用于 Doris 4.2 及后续版本。
:::

VARIANT 值可以从 JSON 文本、JSON/JSONB 值或带确定类型的 SQL 表达式创建：

- 如果要将字符串或 JSON/JSONB 表达式解析为结构化 VARIANT 值，请使用 [PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant)。
- 如果要将受支持的 SQL 值转换为 VARIANT，请使用 `CAST(expression AS VARIANT)`。字符串会保留为 VARIANT 字符串值，该 CAST 不解析 JSON。

### 解析 JSON 文本

```sql
SELECT PARSE_TO_VARIANT('{"user": {"id": 42}, "active": true}');
SELECT PARSE_TO_VARIANT('[10, 20, 30]');
SELECT PARSE_TO_VARIANT(CAST('{"user": {"id": 42}}' AS JSON));
```

如果非法 JSON 应该返回 SQL `NULL` 而不是使查询失败，请使用 [TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant)。

### 访问对象和数组

对象字段可以使用字符串 key 访问。在 Doris 4.2 及后续版本中，VARIANT 数组的非负索引从 0 开始，并支持从数组末尾倒数的负数索引。提取出的值仍是 `VARIANT`，如需按确定类型比较、计算或聚合，请先 CAST。

```sql
SELECT CAST(PARSE_TO_VARIANT('{"user": {"id": 42}}')['user']['id'] AS BIGINT);
SELECT ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), 0);  -- 10
SELECT ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), -1); -- 30
```

对象和数组访问的详细说明请参见 [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at)。

## CAST 规则

VARIANT 的 CAST 包括两个方向：把受支持的 SQL 值转换为 VARIANT，以及把 VARIANT 中兼容的值转换为具体 SQL 类型。

### 其他类型 CAST 为 VARIANT

| 源类型 | 行为 |
| --- | --- |
| `CHAR`、`VARCHAR`、`STRING` | 将输入保留为 VARIANT 字符串，不解析看起来像 JSON 的文本。 |
| `BOOLEAN` | 保留 Boolean 值。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT` | 保留整数值。 |
| `FLOAT`、`DOUBLE` | 保留浮点数值。 |
| `DECIMALV2`、`DECIMAL(p, s)`（`p <= 38`） | 保留 Decimal 值，但需满足下文限制。 |
| `DATE`、`DATETIME`、`TIMESTAMPTZ` | 保留对应的逻辑类型和值。 |
| `JSON` / `JSONB` | 将结构化值直接转换为 VARIANT；如果输入包含 VARIANT 无法表示的 JSONB 值类型，BE 会报错。 |
| `ARRAY<T>` | 当 `T` 为 `VARIANT` 或也在该白名单中时递归转换每个元素，并保留 SQL NULL 元素。 |

仅支持上表列出的源类型。其他源类型，包括 `MAP`、`STRUCT`、`TIME`、`IPV4`、`IPV6`、precision 超过 38 的 Decimal，以及包含不支持元素类型的数组，都会由 BE 报错。

```sql
-- 字符串会保留为 VARIANT 字符串根值，即使内容看起来像 JSON。
SELECT CAST(CAST('{"id": 1}' AS VARIANT) AS STRING) AS string_value,
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT)) AS root_type;
-- string_value：{"id": 1}；root_type：string

-- 需要结构化 VARIANT 值时，显式解析 JSON 文本。
SELECT PARSE_TO_VARIANT('{"id": 1}') AS parsed_object;
-- {"id":1}

-- JSON/JSONB 输入按结构转换。
SELECT CAST(CAST('{"id": 1}' AS JSON) AS VARIANT) AS parsed_object;
-- {"id":1}
```

字符串 CAST 不解析 JSON，因此非法 JSON 文本仍是合法的 VARIANT 字符串。如需严格解析 JSON，请使用 `PARSE_TO_VARIANT`；如需在解析失败时返回 SQL `NULL`，请使用 `TRY_PARSE_TO_VARIANT`。

### VARIANT CAST 为其他类型

VARIANT 可以 CAST 为兼容的标量、JSON/JSONB 或数组类型：

| 目标类型 | 行为 |
| --- | --- |
| `BOOLEAN` | 转换兼容的 Boolean 或标量根值。 |
| `TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT` | 将兼容的标量根值转换为指定整数类型。 |
| `FLOAT`、`DOUBLE` | 转换兼容的数值根。 |
| `DECIMALV2`、`DECIMAL(p, s)` | 将兼容的数值根转换为指定 Decimal 类型。 |
| `DATE`、`DATETIME`、`TIMESTAMPTZ` | 转换兼容的日期时间根值。 |
| `CHAR`、`VARCHAR`、`STRING` | 标量根值返回对应文本，对象和数组返回 JSON 文本。Variant/JSON `null` 返回字符串 `null`，外层 SQL `NULL` 仍是 SQL `NULL`。 |
| `JSON` / `JSONB` | 按结构转换；如果 VARIANT 值包含 JSON/JSONB 无法表示的类型，BE 会报错。 |
| `ARRAY<T>` | 当 `T` 为 `VARIANT` 或也在该白名单中时逐元素转换；不兼容元素遵循目标类型的 CAST 规则。 |

仅支持上表列出的目标类型。其他目标类型，包括 `MAP`、`STRUCT`、`TIME`、`IPV4` 和 `IPV6`，都会由 BE 报错。对于受支持的目标类型，值形状不兼容、文本非法或数值越界时，按照对应 CAST 模式报错或返回 SQL `NULL`。

```sql
SELECT CAST(PARSE_TO_VARIANT('42') AS BIGINT) AS id;
-- 42

SELECT CAST(PARSE_TO_VARIANT('[1, null, 3]') AS ARRAY<INT>) AS values;
-- [1, NULL, 3]

SELECT CAST(PARSE_TO_VARIANT('{"id": 1}') AS JSON) AS json_value;
-- {"id":1}
```

### Decimal 与日期时间转换限制

| Doris 输入类型 | VARIANT 支持情况 |
| --- | --- |
| 旧版 `DECIMALV2` | 精确保留 precision 不超过 27、scale 不超过 9 的值。 |
| `DECIMAL(p, s)` | 精确保留 `1 <= p <= 38` 且 `0 <= s <= p` 的值；不支持需要超过 38 位 precision 的值。 |
| `DATE` | 保留为不含时间和时区的日历日期。 |
| 旧版 `DATETIME` | 保留到秒，不进行时区调整。 |
| `DATETIME(p)` | 支持 `0 <= p <= 6`，不进行时区调整。 |
| `TIMESTAMPTZ(p)` | 支持 `0 <= p <= 6`，保留带时区调整的 timestamp 语义。 |
| precision 超过 38 的 Decimal | 不支持作为 VARIANT 输入。 |
| `TIME` | 不支持作为 VARIANT 输入。 |

源值还必须满足对应 Doris 类型本身的合法性要求。precision 超限、日期非法或值不兼容时会报错，不会自动修复。

## 相等性与 Hash 语义

在 Doris 4.2 及后续版本中，分组、去重和集合运算会按逻辑值判断相等性，而不是按来源 SQL 类型或物理表示：

- 等价的整数数值表示相等。
- Decimal 尾随零不影响值，因此 `1.20` 与 `1.2` 相等。
- `+0`、`-0` 与整数零相等。
- 对象 key 的顺序不影响相等性，但数组元素顺序会影响相等性。
- Variant/JSON `null` 与 SQL `NULL` 不同。

Hash 类算子使用同一套 canonical 逻辑表示计算 key。因此，只要两个值按上述规则相等，无论来源是解析后的 JSON 还是带类型的 CAST，都会得到相同的内部 Hash Key。该 Hash 只用于 Doris 内部执行，不是稳定的用户侧校验值。

这些规则适用于 `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`INTERSECT`、`EXCEPT` 和 `UNION DISTINCT` 等已支持的操作，但不会开放根 VARIANT 比较谓词：直接执行 `VARIANT = VARIANT` 或排序比较仍不支持。

```sql
-- 1 和 1.0 只有一个 distinct logical value。
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('1') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('1.0') AS value
) AS numeric_values;
-- distinct_count: 1

-- 对象 key 顺序被忽略；数组顺序会保留。
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('{"a": 1, "b": 2}') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('{"b": 2, "a": 1}') AS value
) AS object_values;
-- distinct_count: 1

SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('[1, 2]') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('[2, 1]') AS value
) AS array_values;
-- distinct_count: 2
```

## NULL 语义

SQL `NULL` 与 Variant/JSON `null` 是不同的值：

- SQL `NULL` 表示 SQL 值缺失，并遵循普通 SQL NULL 传播规则。
- Variant/JSON `null` 是一个 VARIANT 值，例如 `PARSE_TO_VARIANT('null')` 的返回值。
- `TRY_PARSE_TO_VARIANT` 遇到非法输入时返回 SQL `NULL`，这与成功解析 JSON 字面量 `null` 不同。

## 基本类型

VARIANT 自动推断的子列基础类型包括：

<table>
<tr><td>支持的类型<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL（等价于 JSON 的 null）<br/></td></tr>
<tr><td>BigInt(64 bit)<br/>Double<br/></td></tr>
<tr><td>String(Text)<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant（嵌套对象）<br/></td></tr>
<tr><td>Array&lt;T&gt;（仅支持一维）<br/></td></tr>
</table>

简单的 INSERT 示例：

```sql
INSERT INTO vartab VALUES
  (1, 'null'),
  (2, NULL),
  (3, 'true'),
  (4, '-17'),
  (5, '123.12'),
  (6, '1.912'),
  (7, '"A quote"'),
  (8, '[-1, 12, false]'),
  (9, '{ "x": "abc", "y": false, "z": 10 }'),
  (10, '"2021-01-01"');
```

提示：日期/时间戳等非标准 JSON 类型在未指定 Schema 时会以字符串形式存储；如需较高计算效率，建议将其提取为静态列或在 Schema Template 中明确声明类型。

## 扩展类型（Schema Template）

除基本类型外，VARIANT 还可通过 Schema Template 声明以下扩展类型：

- Number（扩展）
  - Decimal：Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Timestamptz
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt;（T 为以上任意类型，仅支持一维）

注意：预定义的 Schema 只能在建表时指定，当前不支持通过 ALTER 修改（后续可能支持“新增”子列定义，但不支持修改既有子列类型）。

示例：

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

INSERT INTO test_var_schema VALUES (1, '{
    "large_int_val" : "123222222222222222222222",
    "string_val" : "Hello World",
    "decimal_val" : 1.11111111,
    "datetime_val" : "2025-05-16 11:11:11",
    "tz_val" : "2025-05-16 11:11:11+08:00",
    "ip_val" : "127.0.0.1"
}');

SELECT variant_type(v1) FROM test_var_schema;

+---------------------------------------------------------------------------------------------------------------------------------------------------+
| variant_type(v1)                                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
| {"datetime_val":"datetimev2","decimal_val":"decimal128i","ip_val":"ipv4","large_int_val":"largeint","string_val":"string","tz_val":"timestamptz"} |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
```

`{"date": 2020-01-01}` 与 `{"ip": 127.0.0.1}` 均为非法 JSON 文本，正确格式应为 `{"date": "2020-01-01"}` 与 `{"ip": "127.0.0.1"}`。

一旦指定 Schema，若 JSON 实际类型与 Schema 冲突且无法转换，将保存为 NULL。例如：

```sql
INSERT INTO test_var_schema VALUES (1, '{
  "decimal_val" : "1.11111111",
  "ip_val" : "127.xxxxxx.xxxx",
  "large_int_val" : "aaabbccc"
}');

-- 仅 decimal_val 保留
SELECT * FROM test_var_schema;

+------+-----------------------------+
| id   | v1                          |
+------+-----------------------------+
|    1 | {"decimal_val":1.111111110} |
+------+-----------------------------+
```

Schema 仅指导“存储层”的持久化类型，计算逻辑仍以实际数据的动态类型为准：

```sql
-- 实际 v['a'] 的运行时类型仍可能是 STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```

通配符与匹配顺序：

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'enumString*' : STRING,
        'enum*' : ARRAY<TEXT>,
        'ip*' : IPV6
    > NULL
)
PROPERTIES ("replication_num" = "1");

-- 若 enumString1 同时匹配上述两个 pattern，则采用定义顺序中第一个匹配到的类型（STRING）
```

如列名中包含 `*` 且希望按名称精确匹配，可使用：

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

匹配成功的子路径默认会参与子列列式提取（Subcolumnization），并展开为独立列。若匹配子列过多导致列数暴增，建议开启 `variant_enable_typed_paths_to_sparse`（见“配置”）。

## 类型冲突与提升规则

当同一路径出现不兼容类型（如同一字段既出现整数又出现字符串）时，将提升为 JSONB 类型以避免信息丢失：

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a 将被提升为 JSONB
```

转换规则如下表格：

| 源类型         | 当前类型       | 最终类型       |
| -------------- | -------------- | -------------- |
| `TinyInt`      | `BigInt`       | `BigInt`       |
| `TinyInt`      | `Double`       | `Double`       |
| `TinyInt`      | `String`       | `JSONB`        |
| `TinyInt`      | `Array`        | `JSONB`        |
| `BigInt`       | `Double`       | `JSONB`        |
| `BigInt`       | `String`       | `JSONB`        |
| `BigInt`       | `Array`        | `JSONB`        |
| `Double`       | `String`       | `JSONB`        |
| `Double`       | `Array`        | `JSONB`        |
| `Array<Double>`| `Array<String>`| `Array<Jsonb>` |

若需严格限制子列类型（以稳定索引和存储），请结合 Schema Template 明确声明类型。

## Variant 索引

### 索引选择

VARIANT 支持对子列建立 BloomFilter 与 Inverted Index 两类索引。
- 高基数等值/IN 过滤：优先使用 BloomFilter（更省存储、写入更高效）。
- 需要分词、短语、范围检索：使用 Inverted Index，并根据需求设置 `parser`/`analyzer` 等属性。

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- 利用 BloomFilter 做等值/IN 过滤
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
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

### 根据子路径指定索引

在 3.1.x/4.0 及之后的版本中，可为 VARIANT 的部分子列单独指定索引属性，甚至在同一路径上同时配置“分词与不分词”的两种倒排索引。指定 Path 索引需配合 Path 类型（Schema Template）使用。

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

支持通配符的 Path 索引：

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

注意：2.1.7+ 仅支持 InvertedIndex V2 属性（文件更少、写入 IOPS 更低，适配存算分离）。2.1.8+ 不再支持离线 Build Index 构建。

### 索引失效问题

1. 类型变更导致索引丢失：子列类型发生不兼容变更（如 INT→JSONB）会丢失索引。可通过 Schema Template 固定类型与索引。
2. 查询类型不匹配：
   ```sql
   -- v['id'] 实际为 STRING，按 INT 进行等值会导致索引失效
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
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

## insert 与导入

### INSERT INTO VALUES

```sql
CREATE TABLE IF NOT EXISTS variant_tbl (
    k BIGINT,
    v VARIANT
) PROPERTIES("replication_num" = "1");

INSERT INTO variant_tbl VALUES (1, '{"a" : 123}');

select * from variant_tbl;
+------+-----------+
| k    | v         |
+------+-----------+
|    1 | {"a":123} |
+------+-----------+

-- 其中 v['a'] 是 Variant 类型
select v['a'] from variant_tbl;
+--------+
| v['a'] |
+--------+
| 123    |
+--------+

-- v['a']['no_such_key'] 对于不存在的 JSON 键，将返回 NULL
select v['a']['no_such_key'] from variant_tbl;;
+-----------------------+
| v['a']['no_such_key'] |
+-----------------------+
| NULL                  |
+-----------------------+

```

### 导入（Stream Load）

```bash
# 以按行 JSON 为例（每行一条 JSON 记录）
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```

参考 [variant](../../../../data-operate/import/complex-types/variant.md)

导入完成后可用 `SELECT count(*)` 或 `SELECT * ... LIMIT 1` 验证。为提升高并发导入性能，推荐建表选择 RANDOM 分桶并开启 Group Commit（参见官方“Group Commit”文档）。

## 输出

从 VARIANT 列读出的 JSON 文本与写入时的 JSON 文本并非按字节完全一致：JSON object 内的 key 会按字典序输出，与输入 JSON 中的顺序无关。

```sql
INSERT INTO variant_tbl VALUES
  (2, '{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }');

SELECT v FROM variant_tbl WHERE k = 2;
+-----------------------------------+
| v                                 |
+-----------------------------------+
| {"a":1,"b":2,"c":{"x":10,"y":20}} |
+-----------------------------------+
```

排序在每一层都会生效——顶层 key 输出为 `a`、`b`、`c`，嵌套 object 内 key 输出为 `x`、`y`。

## 支持的运算

在 Doris 4.2 及后续版本中，整个 VARIANT 值支持基于 Hash 的分组和去重，但不支持比较、Join Key 或排序语义。

| 对整个 VARIANT 值执行的操作 | 支持情况 | 说明 |
| --- | --- | --- |
| `GROUP BY` | 支持 | 使用上文所述的逻辑相等与 canonical Hash 规则。 |
| `DISTINCT`、`COUNT(DISTINCT ...)` | 支持 | 逻辑等价的值会被去重。 |
| `INTERSECT`、`EXCEPT`、`UNION DISTINCT` | 支持 | 使用相同的逻辑相等与 Hash 语义。 |
| `COUNT(*)`、`COUNT(variant)` | 支持 | `COUNT(variant)` 按普通 SQL 规则排除外层 SQL `NULL`。 |
| `IF`、`CASE`、`IFNULL`、`COALESCE` | 支持 | 条件表达式可以返回和消费 VARIANT 值。 |
| 临时 `ARRAY`、`MAP` 或 `STRUCT` 表达式中包含 VARIANT | 支持 | 这不表示持久化表结构可以使用这些嵌套类型。 |
| `EXPLODE_VARIANT_ARRAY`、对 `ARRAY<VARIANT>` 使用 `EXPLODE`/`EXPLODE_OUTER` | 支持 | 输出 VARIANT 元素，并保留 SQL `NULL` 与 Variant/JSON `null` 的区别。 |
| `=`、`!=`、`<=>`、`<`、`<=`、`>`、`>=` | 不支持 | 请在两侧提取可比较的子路径，并 CAST 为具体类型。 |
| Join Key | 不支持 | 请把两侧所需子路径 CAST 为相同的具体类型。 |
| `ORDER BY`、Sort/TopN Key | 不支持 | 排序前请先 CAST 所需子路径。 |
| 窗口分区键或排序键 | 不支持 | 整个 VARIANT 值不能作为窗口 Key。 |
| `MIN(variant)`、`MAX(variant)` | 不支持 | 聚合前请先 CAST 标量子路径。 |

如需比较、过滤、计算或排序，请提取所需子路径，再显式或隐式 CAST 为具体类型：

```sql
-- 显式 CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- 隐式 CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

## 宽列

当导入数据包含大量不同的 JSON key 时，通过子列列式提取（Subcolumnization）生成的子列会迅速增多；当规模达到一定程度，可能出现元数据膨胀、写入/合并开销增大、查询性能下降等问题。为应对“宽列”（子列过多），VARIANT 提供两种机制：**稀疏列** 与 **DOC 编码**。

如果你要决定什么时候选 Sparse、什么时候选 DOC mode，请先看 [VARIANT 使用与配置指南](./variant-workload-guide)。本节只说明机制本身及其相关属性。

注意：这两种机制**互斥**——启用 DOC 编码后将无法使用稀疏列机制，反之亦然。

### 稀疏列机制

**机制说明**

- 系统会按“非空比例/稀疏度”对路径排序：高频（不稀疏）路径优先执行子列列式提取（Subcolumnization），并存为独立子列；可执行 Subcolumnization 的最大子列数量由 `variant_max_subcolumns_count` 指定，其余低频（稀疏）路径会被合并存放到稀疏列中。
- 如果对子列指定了预定义 Schema，默认情况下该子列不会被放入稀疏列中；可通过 `variant_enable_typed_paths_to_sparse` 允许“指定了类型”的子列进入稀疏列。
- 稀疏列支持 sharding：通过将稀疏子路径分散到多个稀疏列中，降低单列读取负担、提升读取效率；可通过 `variant_sparse_hash_shard_count` 指定稀疏列的实际存储个数。

**参考说明**

- JSON key 总量大，但各个 JSON key 的“非空比例/稀疏度”都比较接近、缺乏区分度：这种情况下很难区分哪些列是真正稀疏的，稀疏列机制的效果会被降低。
- `variant_max_subcolumns_count` 默认就是 `2048`，已经足够覆盖大多数 workload。不要为了预留更多自动提取子列而激进调大；如果场景确实需要大规模子列列式提取（Subcolumnization），优先参考 <a href="./variant-workload-guide#doc-mode-template">DOC mode</a>。实践上仍建议不超过 **10000**。
- `variant_sparse_hash_shard_count` 的设置可按“进入稀疏列的总列数 / 128”粗略估算。例如：VARIANT 中所有 JSON key 为 1 万，设置 `variant_max_subcolumns_count = 2000`，进入稀疏列的总列数约为 8000，则 `variant_sparse_hash_shard_count` 可参考 `8000/128`。

### DOC 编码机制

**机制说明**

- 子路径仍可执行子列列式提取（Subcolumnization）用于按路径查询，同时会额外保存一份“原始 JSON”作为存储字段，以便更快返回整条 JSON 文档。
- DOC 编码支持 sharding：原始 JSON 会被拆分到多个列中存储，读取整条 JSON 时再组装这些分片；可通过 `variant_doc_hash_shard_count` 指定 DOC 编码的实际分片数。
- 小批量写入时可以暂不执行子列列式提取（Subcolumnization），后续合并时再触发：该行为由 `variant_doc_materialization_min_rows` 决定。例如 `variant_doc_materialization_min_rows = 10000`，当写入行数低于 1 万时，该批次只写入原始 JSON，不会触发 Subcolumnization。
- 对超宽列 workload，DOC mode 也是更稳定的选择，尤其是在 Subcolumnization 规模接近万列时。相比默认的即时 Subcolumnization，compaction 内存可下降约 2/3，在稀疏宽列导入场景下导入性能可提升约 5~10 倍。
- 当 `VARIANT` 列非常宽、查询又经常读取整条文档时，DOC mode 相比从大量子列重组文档，`SELECT variant_col` 的效率可获得数量级提升。

**参考说明**

- 需开启 `variant_enable_doc_mode`。
- 使用 DOC 编码机制时，指定了预定义 Schema 的子列类型只能是数值类型、字符串类型、array 类型。
- `variant_doc_hash_shard_count` 的设置可按 “JSON key 的总个数 / 128” 粗略估算。

两种机制的详细使用见下方“配置”章节。

## 限制

- **大宽表优化**：对于会通过子列列式提取（Subcolumnization）生成大量独立子列的宽表场景（例如超过 2000 列），强烈建议开启 **V3 存储格式**。通过在建表 `PROPERTIES` 中指定 `"storage_format" = "V3"`，可以将列元数据与 Segment Footer 解耦，加快文件打开速度并降低内存占用。
- JSON key 长度 ≤ 255。
- 不支持作为主键或排序键。
- 持久化表结构不能把 VARIANT 嵌套在其他类型中（如 `ARRAY<VARIANT>`、`STRUCT<VARIANT>`）；临时表达式结果可以使用上表列出的嵌套容器能力。
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

## 配置

在 3.1+ 支持在 VARIANT 类型上声明列级别属性：

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

<table>
<tr><td>稀疏列属性</td><td>描述</td></tr>
<tr><td>`variant_max_subcolumns_count`</td><td>控制可参与子列列式提取（Subcolumnization）的路径数上限；超过后新增路径可能存放于共享数据结构。默认 2048（推荐），已经覆盖大多数 workload；避免设置得过大。若场景确实需要大规模自动提取子列，优先参考 <a href="./variant-workload-guide#doc-mode-template">DOC mode</a>。0 表示不限制；不推荐超过 10000。</td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`</td><td>默认指定了 Path 类型后，该 Path 一定会参与子列列式提取（Subcolumnization），且不计入 `variant_max_subcolumns_count`。设置为 `true` 后也会计入阈值，可能被收敛到共享结构。</td></tr>
<tr><td>`variant_sparse_hash_shard_count`</td><td>控制稀疏列的分片数量。将稀疏子列分散存储到多个稀疏列中，以提升查询性能。默认值为 1，建议根据稀疏子列数量适当调整。</td></tr>
</table>

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

<table>
<tr><td>DOC 编码属性</td><td>描述</td></tr>
<tr><td>`variant_enable_doc_mode`</td><td>是否启用 DOC 编码模式。设置为 `true` 时，原始 JSON 会作为存储字段保存，用于快速返回整个 JSON 文档；启用后将无法使用稀疏列机制。默认值为 `false`。</td></tr>
<tr><td>`variant_doc_materialization_min_rows`</td><td>DOC 编码模式下触发子列列式提取（Subcolumnization）的最小行数阈值。当写入行数低于该值时，仅存储原始 JSON；当文件合并后行数达到该阈值时，才执行 Subcolumnization，用于减少小批量写入时的开销。</td></tr>
<tr><td>`variant_doc_hash_shard_count`</td><td>控制 DOC 编码的分片数量。原始 JSON 会被拆散存储到指定数量的列中，查询整个 JSON 时再组装这些分片。默认值为 64，可根据 JSON 大小和并发需求调整。</td></tr>
</table>

达到上限后的行为与调优建议：

1. 超过上限后，新路径写入共享结构；Rowset 合并后也可能触发部分路径回收为共享结构。
2. 系统会优先让非空比例高、访问频率高的路径保留在子列列式提取（Subcolumnization）中。
3. 若参与子列列式提取（Subcolumnization）的路径接近 10000，对硬件要求较高（建议单机 ≥128G 内存、≥32C）。如果 workload 已经接近这个规模，建议优先评估 DOC mode。
4. 写入侧调优：适度增大客户端 batch_size，或使用 Group Commit（按需增大 `group_commit_interval_ms`/`group_commit_data_bytes`）。
5. 若无分桶裁剪需求，建议采用 RANDOM 分桶，并开启 single tablet 导入以降低 compaction 写放大。
6. BE 配置可按导入压力调整 `max_cumu_compaction_threads`（建议 ≥8）、`vertical_compaction_num_columns_per_group=500`（提升纵向合并效率，增加内存占用）、`segment_cache_memory_percentage=20`（提升元数据缓存命中）。
7. 关注 Compaction Score；若持续上升说明 Compaction 跟不动，需要降低导入压力。
8. 避免大范围 `SELECT *` 或直接扫描 VARIANT；尽量使用具体路径投影 `SELECT v['path']`。

另：当出现 Stream Load 报错 `[DATA_QUALITY_ERROR]Reached max column size limit 2048` 时（只有 2.1.x 和 3.0.x 版本会出现该报错），说明合并后的 Tablet Schema 达到列数上限。可按需调整 BE 配置 `variant_max_merged_tablet_schema_size`（不建议超过 4096，需较高配置机器）。

## 查看列数、列类型

方案一：使用 `variant_type` 查看行级 Schema（开销更大但更精确）：

```sql
SELECT variant_type(v) FROM variant_tbl;
```

方案二：扩展 `DESC` 展示已完成子列列式提取（Subcolumnization）的子路径：

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

两种方式可结合使用：方案一精确、方案二高效。

## 对比 JSON 类型

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

## FAQ

1. VARIANT 中的 `null` 与 SQL `NULL` 有区别吗？
   - 没有区别，两者等价。
2. 为什么我的查询/索引没有生效？
   - 请检查是否对路径做了正确的 CAST、是否因为类型冲突被提升为 JSONB、或是否误以为给 VARIANT“整体”建的索引可用于子列。
3. 为什么 DECIMAL 写入 VARIANT 列时出现小数位/精度丢失？
   - 写入 VARIANT 列时，在推断子列类型时不会推断为 DECIMAL，数值会以 DOUBLE 存储，因而可能丢失末位小数。即使通过 Schema Template 将子路径显式声明为 DECIMAL（例如 `pm25 VARIANT<'xxx': DECIMAL(6, 2)>`），写入路径也会先解析为 DOUBLE 再转换为 DECIMAL，仍不能完全保证精度。如果在 JSON 中将该字段写成字符串形式（例如 `'{"num": "12.345"}'`），并配合 Schema Template 声明为对应的 DECIMAL（例如 `DECIMAL(9, 3)`），写入时会直接由字符串解析为 DECIMAL，可以保证精度。
