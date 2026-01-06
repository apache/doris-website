---
{
    "title": "VARIANT",
    "language": "zh-CN",
    "description": "VARIANT 类型用于存储半结构化 JSON 数据，可包含不同基础类型（整数、字符串、布尔等）以及一层数组与嵌套对象。写入时会自动基于 JSON Path 推断子列结构与类型，并将高频路径物化为独立子列，充分利用列式存储和向量化执行，兼顾灵活性与性能。"
}
---

## VARIANT

## 描述

VARIANT 类型用于存储半结构化 JSON 数据，可包含不同基础类型（整数、字符串、布尔等）以及一层数组与嵌套对象。写入时会自动基于 JSON Path 推断子列结构与类型，并将高频路径物化为独立子列，充分利用列式存储和向量化执行，兼顾灵活性与性能。

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

匹配成功的子路径默认会展开为独立列。若匹配子列过多导致列数暴增，建议开启 `variant_enable_typed_paths_to_sparse`（见“配置”）。

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

## 支持的运算与 CAST 规则

- VARIANT 本身不支持与其他类型直接比较/运算，两个 VARIANT 之间也不支持直接比较。
- 如需比较、过滤、聚合、排序，请对子列显式或隐式 CAST 到确定类型。

```sql
-- 显式 CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- 隐式 CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- VARIANT 本身不可直接用于 ORDER BY、GROUP BY、JOIN KEY 或聚合参数；对子列 CAST 后可正常使用。
- 字符串类型可隐式转换为 VARIANT。

| VARIANT         | Castable | Coercible |
| --------------- | -------- | --------- |
| `ARRAY`         | ✔        | ❌        |
| `BOOLEAN`       | ✔        | ✔         |
| `DATE/DATETIME` | ✔        | ✔         |
| `FLOAT`         | ✔        | ✔         |
| `IPV4/IPV6`     | ✔        | ✔         |
| `DECIMAL`       | ✔        | ✔         |
| `MAP`           | ❌        | ❌        |
| `TIMESTAMP`     | ✔        | ✔         |
| `VARCHAR`       | ✔        | ✔         |
| `JSON`          | ✔        | ✔         |

## 限制

- `variant_max_subcolumns_count`：默认 0（不限制 Path 物化列数）。建议在生产设置为 2048（Tablet 级别）以控制列数。超过阈值后，低频/稀疏路径会被收敛到共享数据结构，从该结构查询可能带来性能下降（详见“配置”）。
- 若 Schema Template 指定了 Path 类型，则该 Path 会被强制提取；当 `variant_enable_typed_paths_to_sparse = true` 时，它也会计入阈值，可能被收敛到共享结构。
- JSON key 长度 ≤ 255。
- 不支持作为主键或排序键。
- 不支持与其他类型嵌套（如 `Array<Variant>`、`Struct<Variant>`）。
- 读取整个 VARIANT 列会扫描所有子字段。若列包含大量子字段，建议额外存储原始 JSON 的 STRING/JSONB 列，以优化如 `LIKE` 等整体匹配：

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
          'variant_enable_typed_paths_to_sparse' = 'true'
      )
  >
);
```

<table>
<tr><td>属性<br/></td><td>描述<br/></td></tr>
<tr><td>`variant_max_subcolumns_count`<br/></td><td>控制 Path 物化列数的上限；超过后新增路径可能存放于共享数据结构。默认 0 表示不限，建议设置为 2048；不推荐超过 10000。<br/></td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`<br/></td><td>默认指定了 Path 类型后，该 Path 一定会被提取（不计入 `variant_max_subcolumns_count`）。设置为 `true` 后也会计入阈值，可能被收敛到共享结构。<br/></td></tr>
</table>

达到上限后的行为与调优建议：

1. 超过上限后，新路径写入共享结构；Rowset 合并后也可能触发部分路径回收为共享结构。
2. 系统会优先保留非空比例高、访问频率高的路径为物化列。
3. 若接近 10000 物化列，对硬件要求较高（建议单机 ≥128G 内存、≥32C）。
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

方案二：扩展 `DESC` 展示已物化的子列（仅展示被提取的路径）：

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

两种方式可结合使用：方案一精确、方案二高效。

## 对比 JSON 类型

- 存储：JSON 类型以 JSONB（行存）写入；VARIANT 写入时类型推断并列存化，压缩率更高、存储更小。
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