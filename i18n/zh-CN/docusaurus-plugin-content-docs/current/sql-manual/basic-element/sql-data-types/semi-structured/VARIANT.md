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

VARIANT 值可以从 JSON 文本或带确定类型的 SQL 表达式创建：

- 如果字符串中包含需要解析的 JSON 文本，请使用 [PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant)。
- 如果要将 SQL 值转换为带类型的 Variant 值，请使用 `CAST(expression AS VARIANT)`。字符串 CAST 不会把字符串按 JSON 解析。

### 解析 JSON 文本

```sql
SELECT PARSE_TO_VARIANT('{\"user\": {\"id\": 42}, \"active\": true}');
SELECT PARSE_TO_VARIANT('[10, 20, 30]');
```

如果非法 JSON 应该返回 SQL `NULL` 而不是使查询失败，请使用 [PARSE_TO_VARIANT_ERROR_TO_NULL](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant-error-to-null)。

### 访问对象和数组

对象字段可以使用字符串 key 访问。对于 `ColumnVariantV2`，VARIANT 数组的非负索引从 0 开始，并支持从数组末尾倒数的负数索引。提取出的值仍是 `VARIANT`，如需按确定类型比较或聚合，请先 CAST。

```sql
SET enable_variant_v2 = true;

SELECT CAST(PARSE_TO_VARIANT('{\"user\": {\"id\": 42}}')['user']['id'] AS BIGINT);
SELECT ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), 0);  -- 10
SELECT ELEMENT_AT(PARSE_TO_VARIANT('[10, 20, 30]'), -1); -- 30
```

对象和数组访问的详细说明请参见 [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at)。
## CAST 语义

`CAST` 会保留 SQL 字符串和 JSON 文本之间的区别：

- `CAST(string AS VARIANT)` 创建根值为“带类型的 Variant 字符串”的 Variant，**不会**解析 JSON。因此，`'{"id": 1}'` 会保持为一个字符串值，非法 JSON 文本对这个 CAST 仍然是合法输入。
- `PARSE_TO_VARIANT(string)` 才会把字符串按 JSON 解析；解析为对象或数组后，才能继续使用路径访问或 `ELEMENT_AT`。如果非法 JSON 需要返回 SQL `NULL`，请使用 `PARSE_TO_VARIANT_ERROR_TO_NULL`。
- `CAST(PARSE_TO_VARIANT(...) AS scalar)` 会在值形状和范围兼容时，把已经解析的 Variant 转换为确定的 SQL 标量类型。这个 CAST 不是 JSON 解析器，形状或范围不兼容时可能失败。
- `CAST(typed_expression AS VARIANT)` 会把受支持的带类型 SQL 值转换为 Variant。开启 `enable_variant_v2` 只会改变当前 session 的执行表示，不会改变磁盘上的 Variant 存储、reader、writer 或 compaction。

```sql
SET enable_variant_v2 = true;

SELECT CAST('{"id": 1}' AS VARIANT) AS typed_string,
       PARSE_TO_VARIANT('{"id": 1}') AS parsed_object;
-- typed_string：字面量字符串 {"id": 1}
-- parsed_object：{"id": 1}

SELECT ELEMENT_AT(CAST('{"id": 1}' AS VARIANT), 'id') AS from_string,
       ELEMENT_AT(PARSE_TO_VARIANT('{"id": 1}'), 'id') AS from_json;
-- from_string：NULL；from_json：1

SELECT CAST(PARSE_TO_VARIANT('42') AS BIGINT) AS id;
-- id：42

SELECT CAST('{invalid json' AS VARIANT) AS still_a_string;
-- 成功，因为 CAST 不会把输入按 JSON 解析
```

不要使用 `CAST(string AS VARIANT)` 做 JSON 校验。需要严格解析时使用 `PARSE_TO_VARIANT`；需要把格式错误转换为 SQL `NULL` 时使用 `PARSE_TO_VARIANT_ERROR_TO_NULL`。

## Equality 语义

对于 `ColumnVariantV2`，规范化哈希和序列化使用逻辑值而不是物理编码字节判断相等性：

- 等价的整数数值表示会归一为同一个值。
- Decimal 尾随零不影响值。
- `+0`、`-0` 与整数零会归一为同一个值。
- 对象 key 的顺序不影响相等性，但数组元素顺序会影响相等性。
- Variant/JSON `null` 与 SQL `NULL` 不同。

这些规则用于支持的基于哈希的操作，例如 `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`INTERSECT`、`EXCEPT` 和 `UNION DISTINCT`。这并不意味着根 Variant 比较谓词已经可用：直接执行 `VARIANT = VARIANT` 或排序比较仍不支持。

```sql
SET enable_variant_v2 = true;

-- 1 和 1.0 归一后只有一个 distinct 值。
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
    SELECT PARSE_TO_VARIANT('{\"a\": 1, \"b\": 2}') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('{\"b\": 2, \"a\": 1}') AS value
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

## 支持的运算与 CAST 规则

默认执行路径保持现有 VARIANT 使用约束：

- VARIANT 本身不支持与其他类型直接比较/运算；在默认路径上，两个 VARIANT 之间也不支持直接比较。
- 如需比较、过滤、聚合、排序，请对子路径显式或隐式 CAST 到确定类型。

```sql
-- 显式 CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- 隐式 CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- 在默认路径上，不应将整个 VARIANT 直接用于 `ORDER BY`、`GROUP BY`、`JOIN KEY` 或聚合参数；请先对子路径 CAST。
- 字符串类型可隐式转换为 VARIANT。

下面的实验性计算路径新增了面向分组和集合运算的规范化哈希与序列化，但不会因此开放根 VARIANT 比较谓词或 VARIANT JOIN KEY。

| VARIANT         | Castable | Coercible |
| --------------- | -------- | --------- |
| `ARRAY`         | ✔        | ❌         |
| `BOOLEAN`       | ✔        | ✔         |
| `DATE/DATETIME` | ✔        | ✔         |
| `FLOAT`         | ✔        | ✔         |
| `IPV4/IPV6`     | ✔        | ✔         |
| `DECIMAL`       | ✔        | ✔         |
| `MAP`           | ❌        | ❌         |
| `TIMESTAMP`     | ✔        | ✔         |
| `VARCHAR`       | ✔        | ✔         |
| `JSON`          | ✔        | ✔         |

## 实验性计算路径：ColumnVariantV2

`ColumnVariantV2` 是实验性的、仅用于计算的执行路径。默认关闭，通过当前 FE session 的 session variable `enable_variant_v2` 选择：

```sql
SET enable_variant_v2 = true;
```

该 session variable 只改变 FE/BE 执行类型标记，不增加 V2 表创建、导入、Segment 存储、读写器、统计信息或 Compaction 支持；同时也没有提供 V1/V2 混部滚动升级兼容能力。

### 内存编码与组织方式

`ColumnVariantV2` 在执行期间使用紧凑的自描述表示：

- 嵌套值或异构值使用 arena 中的编码字节保存；编码中携带类型、长度等信息，使表达式可以定位子值，而不要求每一行都使用固定的 SQL 类型。
- 简单标量可以使用带类型的标量列；独立的 Variant-null map 用来记录 JSON/Variant `null`，而 SQL `NULL` 仍由 SQL null bitmap 表示。
- `E` 和 `T` 是整列级别的物理状态：`E` 表示 encoded，`T` 表示 typed scalar；同一列不会在行级别混用 `E` 和 `T`。

#### Typed scalar 物化为 encoded

当算子需要把 typed scalar 列（`T`）物化为 encoded 值（`E`）时，`with_typed_scalar()` 会逐行选择物理 Variant primitive 和 payload 宽度。下表描述的是物理编码映射；canonical equality 在另一层单独处理。

**Decimal 类型**

| Doris 类型 | 从列中读取的 unscaled 值 | 编码调用 | Variant primitive |
| --- | --- | --- | --- |
| `DECIMALV2` | `DecimalV2Value::value()` 返回的 `__int128` | `decimal(value, scale, 16)` | `DECIMAL16` |
| `DECIMAL32` | `Decimal32::value` 中的 `int32_t` | `decimal(value, scale, 4)` | `DECIMAL4` |
| `DECIMAL64` | `Decimal64::value` 中的 `int64_t` | `decimal(value, scale, 8)` | `DECIMAL8` |
| `DECIMAL128I` | `Decimal128V3::value` 中的 `__int128` | `decimal(value, scale, 16)` | `DECIMAL16` |

Decimal 的 encoded 布局是 `[primitive header][scale][小端有符号 unscaled value]`，所以 `DECIMAL4`、`DECIMAL8`、`DECIMAL16` 的总长度分别是 6、10、18 字节。

Decimal 限制与不变量：

- Variant Decimal 的 scale 必须在 `[0, 38]` 内。`DECIMAL4`、`DECIMAL8`、`DECIMAL16` 的 unscaled 绝对值上限分别是 `10^9 - 1`、`10^18 - 1`、`10^38 - 1`。
- Doris 源类型自身的限制仍然生效：`DECIMALV2` 最大 precision 为 27、最大 scale 为 9；`DECIMAL32`、`DECIMAL64`、`DECIMAL128I` 的最大 precision 分别为 9、18、38。
- typed column 的物理 scale 必须与 data type 元数据中的 scale 完全一致；不一致会被视为不变量破坏，物化时不会自动 rescale。
- encoded 宽度由源类型决定。该路径不会因为数值较小，就把 `DECIMALV2` 或 `DECIMAL128I` 缩窄为 `DECIMAL4` 或 `DECIMAL8`。
- `DECIMAL256` 不是 `ColumnVariantV2` 支持的 typed identity。它的 precision 最高可达 76，超过 Variant Decimal 的 38 位上限，因此不能走这条 typed-to-encoded 路径。
- 物理宽度和 scale 不决定 canonical equality。例如 `1.20` 与 `1.2` 可以拥有不同物理编码，但在哈希和分组时会归一为同一个 canonical 数值。

**日期和时间类型**

转换会先计算：

```text
days = daynr(value) - daynr(1970-01-01)
micros = (days * 86400 + hour * 3600 + minute * 60 + second) * 1000000
         + microsecond
```

| Doris 类型 | 归一化 payload | 编码调用 | Variant primitive |
| --- | --- | --- | --- |
| `DATE` | `int32_t days` | `date(days)` | `DATE` |
| `DATEV2` | `int32_t days` | `date(days)` | `DATE` |
| `DATETIME` | `int64_t micros` | `timestamp_micros(micros, false)` | `TIMESTAMP_NTZ_MICROS` |
| `DATETIMEV2` | `int64_t micros` | `timestamp_micros(micros, false)` | `TIMESTAMP_NTZ_MICROS` |
| `TIMESTAMPTZ` | `int64_t micros` | `timestamp_micros(micros, true)` | `TIMESTAMP_MICROS` |

`DATE` 使用 4 字节 payload 加 1 字节 header；每个 timestamp 使用 8 字节 payload 加 1 字节 header。`utc_adjusted` 参数由 primitive ID 表达：`false` 选择无时区（NTZ）primitive，`true` 选择 UTC-adjusted primitive。

日期和时间限制与不变量：

- 所有源值都必须通过 Doris 的日期合法性检查。非法的 `DATE`、`DATEV2`、`DATETIME`、`DATETIMEV2` 或 `TIMESTAMPTZ` 会抛出 `INVALID_ARGUMENT`；该路径不会静默修复，也不会转为 `NULL`。
- `DATE` 和 `DATEV2` 只保留相对 `1970-01-01` 的有符号天数，不携带日内时间或时区调整信息。
- `DATETIME` 和 `DATETIMEV2` 编码为 wall-clock、无时区的 timestamp；这条物化路径不会应用 session time zone。只有 `TIMESTAMPTZ` 会选择 UTC-adjusted timestamp primitive。
- typed materialization 只生成微秒 primitive。`DATETIMEV2` 和 `TIMESTAMPTZ` 最多保留其支持的 6 位小数；Variant 编码虽然定义了 `TIMESTAMP_NANOS` 和 `TIMESTAMP_NTZ_NANOS`，但该映射不会生成它们。
- `TIMEV2` 不是支持的 typed identity。Variant 编码虽然定义了 `TIME_NTZ_MICROS`，但这条 typed-to-encoded 路径不会生成它。

这只是内存中的执行组织方式，不是新的 Variant 持久化文件格式。组织方式可参考官方 [Apache Parquet File Format](https://parquet.apache.org/docs/file-format/)、[Parquet Variant Shredding](https://parquet.apache.org/docs/file-format/types/variantshredding/) 和 [Parquet Nested Encoding](https://parquet.apache.org/docs/file-format/nestedencoding/)。Parquet 以 `metadata` 和 `value` 组织 Variant，并可为同质路径增加 `typed_value`，从而支持列投影和数据跳过。这里是组织方式参考，并不表示 `ColumnVariantV2` 在磁盘上使用 Parquet 格式。

### 开启 V2 后的行为变化

- **规范化值语义**：等价的整数类型会归一为同一值；Decimal 尾随零会被归一；`+0`、`-0` 与整数零使用同一规范值；对象 key 顺序不影响值；数组顺序仍然保留。非法编码或违反内部不变量时会报错，而不是静默接受。
- **哈希与序列化**：规范化哈希和 arena 序列化为支持的 Variant 值提供 `GROUP BY`、`DISTINCT`、`COUNT(DISTINCT ...)`、`INTERSECT`、`EXCEPT`、`UNION DISTINCT` 以及聚合分组键能力。
- **显式解析语义**：`parse_to_variant(json_string)` 将 JSON 字符串解析为 Variant；`parse_to_variant_error_to_null(json_string)` 在校验失败时返回 SQL `NULL`；`CAST(string AS VARIANT)` 创建的是带类型的 Variant 字符串，不会把字符串按 JSON 解析。函数语法和示例请参见 [PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant) 与 [PARSE_TO_VARIANT_ERROR_TO_NULL](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant-error-to-null)。
- **表达式与嵌套值**：条件表达式、嵌套容器以及支持 Variant 的 `explode` 可以基于规范化表示执行。
- **NULL 与物理状态**：SQL `NULL` 仍与 Variant/JSON `null` 不同。`ColumnVariantV2` 列使用整列级物理状态：编码状态（`E`）或带 Variant-null map 的类型化标量状态（`T`），不会在行级混用 E/T。

### 示例

以下示例均在开启 V2 的当前 FE session 中执行：

```sql
SET enable_variant_v2 = true;

-- 解析 JSON 文本；CAST(string AS VARIANT) 则保留为带类型的 Variant 字符串。
SELECT PARSE_TO_VARIANT('{\"id\": 1, \"items\": [10, 20]}') AS parsed_value,
       CAST('{\"id\": 1, \"items\": [10, 20]}' AS VARIANT) AS typed_string;

-- 规范化哈希将 1 和 1.0 视为一个 distinct 值。
SELECT COUNT(DISTINCT value) AS distinct_count
FROM (
    SELECT PARSE_TO_VARIANT('1') AS value
    UNION ALL
    SELECT PARSE_TO_VARIANT('1.0') AS value
) AS numeric_values;
-- distinct_count: 1

-- 使用容错解析函数时，非法 JSON 转换为 SQL NULL。
SELECT PARSE_TO_VARIANT_ERROR_TO_NULL('{\"id\":') AS invalid_value;
-- invalid_value: NULL

-- 嵌套访问显式 CAST 后可以作为条件表达式输入。
SELECT CASE
           WHEN CAST(PARSE_TO_VARIANT('{\"enabled\": true}')['enabled'] AS BOOLEAN)
           THEN 'on'
           ELSE 'off'
       END AS status;
-- status: on
```

### 使用边界

- 根 Variant 比较谓词（`=`、`!=`、`<=>` 以及排序比较）仍不支持。请在两侧提取相同语义的子路径并 CAST 到可比较类型：

```sql
SELECT *
FROM tbl
WHERE CAST(v['id'] AS BIGINT) = CAST(other_v['id'] AS BIGINT);
```

- 不支持将 Variant 表达式作为 JOIN KEY；根 Variant 也不能作为 Sort/TopN 键、窗口分区键或窗口排序键，也不能作为 `MIN`/`MAX` 参数。
- V2 相关回归测试仍标记为 `nonConcurrent`；功能选择本身是 session-scoped，不会改变原生 Variant 的存储或 Compaction。
- 开启 V2 前请先验证目标 workload；它是实验性计算路径，不改变存储兼容性契约。

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
- 不支持与其他类型嵌套（如 `Array<Variant>`、`Struct<Variant>`）。
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
