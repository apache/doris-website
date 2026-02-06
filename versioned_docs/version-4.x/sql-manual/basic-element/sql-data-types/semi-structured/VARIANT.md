---
{
    "title": "VARIANT",
    "language": "en-US",
    "description": "The VARIANT type stores semi-structured JSON data. It can contain different primitive types (integers, strings, booleans, etc.),"
}
---

## VARIANT

## Overview

The VARIANT type stores semi-structured JSON data. It can contain different primitive types (integers, strings, booleans, etc.), one-dimensional arrays, and nested objects. On write, Doris infers the structure and type of sub-paths based on JSON paths and materializes frequent paths as independent subcolumns, leveraging columnar storage and vectorized execution for both flexibility and performance.

## Using VARIANT

### Create table syntax

Declare a VARIANT column when creating a table:

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```

Constrain certain paths with a Schema Template (see “Extended types”):

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT <
        'id' : INT,            -- restrict path id to INT
        'message*' : STRING,   -- restrict message* prefix to STRING
        'tags*' : ARRAY<TEXT>  -- restrict tags* prefix to ARRAY<TEXT>
    >
)
PROPERTIES("replication_num" = "1");
```

### Query syntax

```sql
-- Access nested fields (returns VARIANT; explicit or implicit CAST is required for aggregation/comparison)
SELECT v['properties']['title'] FROM ${table_name};

-- CAST to a concrete type before aggregation
SELECT CAST(v['properties']['title'] AS STRING) AS title
FROM ${table_name}
GROUP BY title;

-- Query arrays
SELECT *
FROM ${table_name}
WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
```

In VARIANT queries, JSON Path can be expressed in the following forms; any other form is undefined:

1. `v['properties']['title']`
2. `v['properties.title']`
3. `v.properties.title`

## Primitive types

VARIANT infers subcolumn types automatically. Supported types include:

<table>
<tr><td>Supported types<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL (equivalent to JSON null)<br/></td></tr>
<tr><td>BigInt (64 bit)<br/>Double<br/></td></tr>
<tr><td>String (Text)<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant (nested object)<br/></td></tr>
<tr><td>Array&lt;T&gt; (one-dimensional only)<br/></td></tr>
</table>

Simple INSERT example:

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

Tip: Non-standard JSON types such as date/time will be stored as strings unless a Schema Template is provided. For better computation efficiency, consider extracting them to static columns or declaring their types via a Schema Template.

## Extended types (Schema Template)

Besides primitive types, VARIANT supports the following extended types via Schema Template:

- Number (extended)
  - Decimal: Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt; (T can be any of the above, one-dimensional only)

Note: Predefined Schema can only be specified at table creation. ALTER is currently not supported (future versions may support adding new subcolumn definitions, but changing an existing subcolumn type is not supported).

Example:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");

INSERT INTO test_var_schema VALUES (1, '{
    "large_int_val" : "123222222222222222222222",
    "string_val" : "Hello World",
    "decimal_val" : 1.11111111,
    "datetime_val" : "2025-05-16 11:11:11",
    "ip_val" : "127.0.0.1"
}');

SELECT variant_type(v1) FROM test_var_schema;

+----------------------------------------------------------------------------------------------------------------------------+
| variant_type(v1)                                                                                                           |
+----------------------------------------------------------------------------------------------------------------------------+
| {"datetime_val":"datetimev2","decimal_val":"decimal128i","ip_val":"ipv4","large_int_val":"largeint","string_val":"string"} |
+----------------------------------------------------------------------------------------------------------------------------+
```

`{"date": 2020-01-01}` and `{"ip": 127.0.0.1}` are invalid JSON texts; the correct format is `{"date": "2020-01-01"}` and `{"ip": "127.0.0.1"}`.

Once a Schema Template is specified, if a JSON value conflicts with the declared type and cannot be converted, it will be stored as NULL. For example:

```sql
INSERT INTO test_var_schema VALUES (1, '{
  "decimal_val" : "1.11111111",
  "ip_val" : "127.xxxxxx.xxxx",
  "large_int_val" : "aaabbccc"
}');

-- Only decimal_val remains
SELECT * FROM test_var_schema;

+------+-----------------------------+
| id   | v1                          |
+------+-----------------------------+
|    1 | {"decimal_val":1.111111110} |
+------+-----------------------------+
```

Schema only guides the persisted storage type. During query execution, the effective type depends on actual data at runtime:

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```

### Wildcard matching and order

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

-- If enumString1 matches both patterns, the first matching pattern in definition order (STRING) is used
```

If a column name contains `*` and you want to match it by its literal name (not as a prefix wildcard), use:

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

Matched subpaths are materialized as columns by default. If too many paths match and generate excessive columns, consider enabling `variant_enable_typed_paths_to_sparse` (see “Configuration”).

### Wildcard syntax

The Schema Template pattern-matching algorithm supports **only a restricted subset of glob syntax**.

#### Supported glob syntax

In SQL strings, we should write `\\\\` to express a literal `\` in glob patterns.

All examples below are matching examples.

| Syntax | Meaning | Example (pattern → JSON Path) | SQL literal |
|------|---------|------------------------------|-------------|
| `*` | Any-length string | `num_*` → `num_latency` | `'num_*'` |
| `?` | Any single character | `a?b` → `acb` | `'a?b'` |
| `[abc]` | Character class | `a[bc]d` → `abd` | `'a[bc]d'` |
| `[a-z]` | Character range | `int_[0-9]` → `int_3` | `'int_[0-9]'` |
| `[!abc]` | Negated character class | `int_[!0-9]` → `int_a` | `'int_[!0-9]'` |
| `[^abc]` | Negated character class | `int_[^0-9]` → `int_a` | `'int_[^0-9]'` |
| `\` | Escape the next character | `a\*b` → `a*b`<br/>`a\?b` → `a?b`<br/>`a\[b` → `a[b`<br/>`\` → `\` | `'a\\\\*b'`<br/>`'a\\\\?b'`<br/>`'a\\\\[b'`<br/>`'\\\\'` |

#### Escaping rules

- `\*` is a literal `*`
- `\?` is a literal `?`
- `\[` is a literal `[`
- A trailing standalone `\` is treated as a literal `\`

#### Unsupported syntax

The following are treated as ordinary characters or cause matching to fail; avoid them whenever possible:

| Syntax | Semantics in some glob implementations | Current behavior |
|------|----------------------------------------|------------------|
| `{a,b}` | Brace expansion | **Not supported** (treated as literal `{` `}`) |
| `**` | Recursive directory match | **No special semantics** (equivalent to `*` `*`) |

- Empty character patterns like `[]`, `[!]`, `[^]`, and `a[]b` are invalid and match no JSON Path.
- Unterminated character patterns like `int_[0-9` are invalid and match no JSON Path.

#### Typical examples

1. Normal match
- Pattern: `num_*`
  - √ `num_a`
  - √ `num_1`
  - × `number_a`

- Pattern: `a\*b`
  - SQL: `'a\\\\*b'`
  - √ `a*b`
  - × `axxb`

- Pattern: `\*`
  - SQL: `'\\\\*'`
  - √ `*`
  - × `a*`

- Pattern: `\`
  - SQL: `'\\\\'`
  - √ `\`
  - × `\\`

- Pattern: `int_[0-9]`
  - √ `int_1`
  - × `int_a`

2. Full match (not “contains” semantics)
- Pattern: `a*b`
  - √ `ab`
  - √ `axxxb`
  - × `xxaxxxbxx`

3. `.` and `/` are not special; they are ordinary characters
- Pattern: `int_*`
  - √ `int_nested.level1`
  - √ `int_nested/level1`

## Type conflicts and promotion rules

When incompatible types appear on the same path (e.g., the same field shows up as both integer and string), the type is promoted to JSONB to avoid information loss:

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```

Promotion rules:

| Source type    | Current type  | Final type   |
| -------------- | ------------- | ------------ |
| `TinyInt`      | `BigInt`      | `BigInt`     |
| `TinyInt`      | `Double`      | `Double`     |
| `TinyInt`      | `String`      | `JSONB`      |
| `TinyInt`      | `Array`       | `JSONB`      |
| `BigInt`       | `Double`      | `JSONB`      |
| `BigInt`       | `String`      | `JSONB`      |
| `BigInt`       | `Array`       | `JSONB`      |
| `Double`       | `String`      | `JSONB`      |
| `Double`       | `Array`       | `JSONB`      |
| `Array<Double>`| `Array<String>`| `Array<Jsonb>` |

If you need strict types (for stable indexing and storage), declare them via Schema Template.

## Variant indexes

### Choosing indexes

VARIANT supports BloomFilter and Inverted Index on subpaths.
- High-cardinality equality/IN filters: prefer BloomFilter (sparser index, better write performance).
- Tokenization/phrase/range search: use Inverted Index and set proper `parser`/`analyzer` properties.

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
```

Once an inverted index is created on a VARIANT column, all subpaths inherit the same index properties (e.g., parser):

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser" = "english")
);

-- All subpaths inherit the english parser
SELECT * FROM tbl WHERE v['id_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['id_2'] MATCH 'Apache';
```

### Index by subpath

In 3.1.x/4.0 and later, you can specify index properties for certain VARIANT subpaths, and even configure both tokenized and non-tokenized inverted indexes for the same path. Path-specific indexes require the path type to be declared via Schema Template.

```sql
-- Common properties: field_pattern (target path), analyzer, parser, support_phrase, etc.
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"),
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content")
);

-- v.content has both tokenized and non-tokenized inverted indexes
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```

Wildcard path indexing:

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'pattern_*' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "pattern_*"),
    INDEX idx_v(v) USING INVERTED -- global non-tokenized inverted index
);

SELECT * FROM tbl WHERE v['pattern_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['pattern_1'] = 'Doris';
```

Note: 2.1.7+ supports only InvertedIndex V2 properties (fewer files, lower write IOPS; suitable for disaggregated storage/compute). 2.1.8+ removes offline Build Index.

### When indexes don’t work

1. Type changes cause index loss: if a subpath changes to an incompatible type (e.g., INT → JSONB), the index is lost. Fix by pinning types and indexes via Schema Template.
2. Query type mismatch:
   ```sql
   -- v['id'] is actually STRING; using INT equality causes index not to be used
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
3. Misconfigured index: indexes apply to subpaths, not the entire VARIANT column.
   ```sql
   -- VARIANT itself cannot be indexed as a whole
   SELECT * FROM tbl WHERE v MATCH 'Doris';

   -- If whole-JSON search is needed, store a duplicate STRING column and index it
   CREATE TABLE IF NOT EXISTS tbl (
       k BIGINT,
       v VARIANT,
       v_str STRING,
       INDEX idx_v_str(v_str) USING INVERTED PROPERTIES("parser" = "english")
   );
   SELECT * FROM tbl WHERE v_str MATCH 'Doris';
   ```

## INSERT and load

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

-- v['a'] is a VARIANT
select v['a'] from variant_tbl;
+--------+
| v['a'] |
+--------+
| 123    |
+--------+

-- Accessing a non-existent key returns NULL
select v['a']['no_such_key'] from variant_tbl;;
+-----------------------+
| v['a']['no_such_key'] |
+-----------------------+
| NULL                  |
+-----------------------+

```

### Load (Stream Load)

```bash
# Line-delimited JSON (one JSON record per line)
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```

See also: `https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

After loading, verify with `SELECT count(*)` or sample with `SELECT * ... LIMIT 1`. For high-throughput ingestion, prefer RANDOM bucketing and enable Group Commit.

## Supported operations and CAST rules

- VARIANT cannot be compared/operated directly with other types; comparisons between two VARIANTs are not supported either.
- For comparison, filtering, aggregation, and ordering, CAST subpaths to concrete types (explicitly or implicitly).

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- VARIANT itself cannot be used directly in ORDER BY, GROUP BY, as a JOIN KEY, or as an aggregate argument; CAST subpaths instead.
- Strings can be implicitly converted to VARIANT.

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

### Schema Template based auto CAST

When a VARIANT column defines a Schema Template and `enable_variant_schema_auto_cast` is set to true, the analyzer automatically inserts CASTs to the declared types for subpaths that match the Schema Template, so you do not need to write CASTs manually.

- Applies to SELECT, WHERE, ORDER BY, GROUP BY, HAVING, JOIN keys, and aggregate arguments.
- To disable this behavior, set `enable_variant_schema_auto_cast` to false.

Example:
```sql
CREATE TABLE t (
  id BIGINT,
  data VARIANT<'num_*': BIGINT, 'str_*': STRING>
);

-- 1) FILTER + ORDER
SELECT id
FROM t
WHERE data['num_a'] > 10
ORDER BY data['num_a'];

-- 2) GROUP + AGGREGATE + ALIAS
SELECT data['str_name'] AS username, SUM(data['num_a']) AS total
FROM t
GROUP BY username
HAVING data['num_a'] > 100;

-- 3) JOIN ON
SELECT *
FROM t1 JOIN t2
ON t1.data['num_id'] = t2.data['num_id'];
```

**Note**: Auto CAST cannot determine whether a path is a leaf; it simply casts all paths that match the Schema Template.

Therefore, in cases like the following, to ensure correct results, set `enable_variant_schema_auto_cast` to false and add CASTs manually.

```sql
-- Schema Template: treat all int_* as INT
CREATE TABLE t (
  id INT,
  data VARIANT<'int_*': INT>
);

INSERT INTO t VALUES
(1, '{"int_1": 1, "int_nested": {"level1_num_1": 1011111, "level1_num_2": 102}}');

-- Auto CAST enabled
SET enable_variant_schema_auto_cast = true;

-- int_nested matches int_*, is incorrectly CAST to INT, and the query returns NULL
SELECT
  data['int_nested']
FROM t;

-- Auto CAST disabled
SET enable_variant_schema_auto_cast = false;

-- The query returns the correct result
SELECT
  data['int_nested']
FROM t;
```

## Limitations

- `variant_max_subcolumns_count`: default 0 (no limit). In production, set to 2048 (tablet level) to control the number of materialized paths. Above the threshold, low-frequency/sparse paths are moved to a shared data structure; reading from it may be slower (see “Configuration”).
- If a path type is specified via Schema Template, that path will be forced to be materialized; when `variant_enable_typed_paths_to_sparse = true`, it also counts toward the threshold and may be moved to the shared structure.
- JSON key length ≤ 255.
- Cannot be a primary key or sort key.
- Cannot be nested within other types (e.g., `Array<Variant>`, `Struct<Variant>`).
- Reading the entire VARIANT column scans all subpaths. If a column has many subpaths, consider storing the original JSON string in an extra STRING/JSONB column for whole-object searches like `LIKE`:

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- Better: keep the original JSON string for whole-object matching
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```

## Configuration

Starting from 3.1+, VARIANT supports type-level properties on columns:

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
<tr><td>Property<br/></td><td>Description<br/></td></tr>
<tr><td>`variant_max_subcolumns_count`<br/></td><td>Max number of materialized paths. Above the threshold, new paths may be stored in a shared data structure. Default 0 (unlimited). Recommended 2048; do not exceed 10000.<br/></td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`<br/></td><td>By default, typed paths are always materialized (and do not count against `variant_max_subcolumns_count`). When set to `true`, typed paths also count toward the threshold and may be moved to the shared structure.<br/></td></tr>
</table>

Behavior at limits and tuning suggestions:

1. After exceeding the threshold, new paths are written into the shared structure; Rowset merges may also recycle some paths into the shared structure.
2. The system prefers to keep paths with higher non-null ratios and higher access frequencies materialized.
3. Close to 10,000 materialized paths requires strong hardware (≥128G RAM, ≥32C per node recommended).
4. Ingestion tuning: increase client `batch_size` appropriately, or use Group Commit (increase `group_commit_interval_ms`/`group_commit_data_bytes` as needed).
5. If partition pruning is not needed, consider RANDOM bucketing and enabling single-tablet loading to reduce compaction write amplification.
6. BE tuning knobs: `max_cumu_compaction_threads` (≥8), `vertical_compaction_num_columns_per_group=500` (improves vertical compaction but increases memory), `segment_cache_memory_percentage=20` (improves metadata cache efficiency).
7. Watch Compaction Score; if it keeps rising, compaction is lagging—reduce ingestion pressure.
8. Avoid large `SELECT *` on VARIANT; prefer specific projections like `SELECT v['path']`.

Note: If you see Stream Load error `[DATA_QUALITY_ERROR]Reached max column size limit 2048` (only on 2.1.x and 3.0.x), it means the merged tablet schema reached its column limit. You may increase `variant_max_merged_tablet_schema_size` (not recommended beyond 4096; requires strong hardware).

## Inspect number of columns and types

Approach 1: use `variant_type` to inspect per-row schema (more precise, higher cost):

```sql
SELECT variant_type(v) FROM variant_tbl;
```

Approach 2: extended `DESC` to show materialized subpaths (only those extracted):

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

Use both: Approach 1 is precise; Approach 2 is efficient.

## Compared with JSON type

- Storage: JSON is stored as JSONB (row-oriented). VARIANT is inferred and materialized into columns on write (higher compression, smaller size).
- Query: JSON requires parsing. VARIANT scans columns directly and is usually much faster.

ClickBench (43 queries):
- Storage: VARIANT saves ~65% vs JSON.
- Query: VARIANT is 8x+ faster than JSON, close to predefined static columns.

**Storage space**

| Type                | Size       |
| ------------------- | ---------- |
| Predefined columns  | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**~65% space savings**

| Run             | Predefined | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| First (cold)    | 233.79s    | 248.66s | Most timed out  |
| Second (hot)    | 86.02s     | 94.82s  | 789.24s         |
| Third (hot)     | 83.03s     | 92.29s  | 743.69s         |

## FAQ

1. Are `null` in VARIANT and SQL `NULL` different?
   - No. They are equivalent.
2. Why doesn’t my query/index work?
   - Check whether you CAST paths to the correct types; whether the type was promoted to JSONB due to conflicts; or whether you mistakenly expect an index on the whole VARIANT instead of on subpaths.

