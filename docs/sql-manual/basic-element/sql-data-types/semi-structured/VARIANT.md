---
{
    "title": "VARIANT",
    "language": "en-US",
    "description": "VARIANT stores semi-structured JSON. Covers write and parse rules, CAST, NULL semantics, ordering, Schema Template, ALTER, properties, indexes, and limits."
}
---

## Overview

The VARIANT type stores semi-structured JSON data: objects, arrays, strings, numbers, booleans, and `null`. On write, Doris infers the type of each JSON path and performs Subcolumnization on frequent paths, storing them as independent columnar subcolumns. A query on such a path reads only the subcolumn it needs.

:::tip Why VARIANT
`VARIANT` is a good fit when document shape changes over time but queries still focus on a small set of hot paths.

- Hot paths participate in Subcolumnization, so they benefit from columnar performance, file pruning, and vectorized execution.
- Key paths can use path-level indexes, full-text search, and still benefit from Doris sparse-index pruning.
- Wide-column optimizations keep automatic Subcolumnization practical at 10k-scale subcolumns. When paths participating in Subcolumnization approach 10,000, hardware requirements rise quickly, so DOC mode is usually the safer starting point.

If you still need to choose between default behavior, sparse columns, DOC mode, and Schema Template, start with [Variant Workload Guide](./variant-workload-guide.md). This page is the reference for writing and parsing, type rules, CAST, NULL and comparison semantics, ALTER, indexes, limits, and configuration.
:::

:::info Version
This page describes VARIANT in Doris 5.0.0 and later. The differences from Doris 4.x that are most likely to affect existing SQL:

- `INSERT` stores a string as a VARIANT string instead of parsing it as JSON. This includes `INSERT INTO ... SELECT` from table functions such as `s3()` and `hdfs()`. Use `PARSE_TO_VARIANT` to write JSON text with `INSERT`. Load jobs such as Stream Load still parse JSON.
- Whole VARIANT values support `GROUP BY`, `DISTINCT`, and set operations. Two VARIANT values can be compared with `=`, `!=`, and `<=>`, and can be used as join keys, `ORDER BY` keys, and window keys.
- `VARIANT_TYPE` returns one type name, such as `object`, instead of a map from paths to types.
- VARIANT arrays can be indexed with integers, starting from 1.

For Doris 4.x, see the 4.x version of this page.
:::

## Quick start

```sql
CREATE TABLE events (
    id BIGINT,
    v  VARIANT
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- INSERT keeps a string literal as a VARIANT string, so parse JSON text explicitly.
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

- `v['user']['name']` and `v['tags'][1]` return `VARIANT` values. Array indexes start from 1.
- CAST a path to a concrete type before comparing or computing with it.
- Load jobs such as Stream Load parse JSON text automatically. See [Write data](#write-data).

## Define a VARIANT column

```sql
column_name VARIANT
column_name VARIANT< field_definition [, field_definition ...] >
column_name VARIANT< properties('key' = 'value' [, ...]) >
column_name VARIANT< field_definition [, ...], properties('key' = 'value' [, ...]) >

field_definition:
    [MATCH_NAME | MATCH_NAME_GLOB] 'path_or_pattern' : data_type [COMMENT 'comment']
```

- The `field_definition` list is the [Schema Template](#schema-template). It fixes the storage type of selected paths.
- `properties(...)` sets column-level storage properties. See [Column properties](#column-properties).
- A VARIANT column can be `NULL` or `NOT NULL`. Its only allowed default value is `NULL`.

```sql
CREATE TABLE IF NOT EXISTS example_tbl (
    k BIGINT,
    v VARIANT<
        'id' : INT,             -- path id is stored as INT
        'message*' : STRING,    -- paths matching message* are stored as STRING
        'tags*' : ARRAY<TEXT>,  -- paths matching tags* are stored as ARRAY<TEXT>
        properties('variant_max_subcolumns_count' = '2048')
    > NULL
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

Where a VARIANT column can be used in a table:

| Usage | Supported | Notes |
| --- | --- | --- |
| Value column of Duplicate Key, Unique Key, and Aggregate Key tables | Yes | In an Aggregate Key table, the aggregation type must be `REPLACE` or `REPLACE_IF_NOT_NULL`. |
| Key column, partition column, bucketing column | No | |
| Nested in another type in a table schema (`ARRAY<VARIANT>`, `MAP`, `STRUCT`) | No | A query result can still be `ARRAY<VARIANT>`, for example from `COLLECT_LIST(v)`. |
| Default value | `NULL` only | `DEFAULT '{}'` and other non-NULL defaults are rejected. |

## Write data

`INSERT` and `CAST` keep a string as a VARIANT string. `PARSE_TO_VARIANT`, `TRY_PARSE_TO_VARIANT`, and load jobs such as Stream Load parse JSON text. For load examples, see [Load VARIANT data](../../../../data-operate/import/complex-types/variant.md).

### Parse errors

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md), [TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md), and load jobs use the same JSON parser. Load jobs handle errors like `TRY_PARSE_TO_VARIANT`:

| Input | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` and load jobs |
| --- | --- | --- |
| Valid JSON | The parsed value | The parsed value |
| Text that is not valid JSON, such as `hello` or `{"id":` | Kept as a VARIANT string | Kept as a VARIANT string |
| JSON that contains an integer outside [-2^63, 2^64 - 1] or a number outside the `DOUBLE` range, such as `{"a": 1, "n": 100000000000000000000}` | The whole text is kept as a VARIANT string, so `v['a']` returns `NULL` | The whole text is kept as a VARIANT string |
| Empty string | An empty object `{}` | An empty object `{}` |
| Nesting deeper than 128 levels | Error | SQL `NULL` |
| An object key longer than `variant_max_json_key_length` bytes (BE configuration, default 255) | Error | SQL `NULL` |
| Duplicate keys in one object | Error | SQL `NULL` |
| A string that is not valid UTF-8 | Error | SQL `NULL` |

A document nested so deeply that the JSON parser itself rejects it (about 1,000 levels) is invalid JSON, so it is kept as a string.

Two BE configurations change these rules:

- `variant_throw_exeception_on_invalid_json` (default `false`): when `true`, text that the parser rejects, including JSON with out-of-range numbers, is an error for `PARSE_TO_VARIANT` and SQL `NULL` for `TRY_PARSE_TO_VARIANT` and load jobs, instead of a VARIANT string.
- `variant_enable_duplicate_json_path_check` (default `false`): when `true`, a key that repeats in an object keeps its first value instead of causing an error. It also keeps a write from failing when a key with a dot repeats a nested path; only one of the values is stored.

To keep a document with out-of-range integers structured, convert it through JSON: `CAST(CAST(text AS JSON) AS VARIANT)`. Integers with up to 38 digits stay exact numbers, larger integers within the `LARGEINT` range become strings, and larger ones become `DOUBLE`. `PARSE_TO_VARIANT(CAST(text AS JSON))` does not help, because it parses the JSON text again.

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"id": 1}')) AS valid_json,    -- object
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS invalid_json,  -- string
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT))  AS string_cast;   -- string
```

### What storage keeps

Writing a value into a table normalizes it. The value read back can differ from the value computed before the write:

| Before the write | Read back from the table |
| --- | --- |
| An object member whose value is JSON `null`, such as `{"a": null, "b": 1}` | The member is removed: `{"b":1}`. `v['a']` returns SQL `NULL`. |
| An object member whose value is an empty object or array, or an object that these rules leave empty, such as `{"a": {}, "b": [], "c": {"d": null}}` | Removed: `{}` |
| An object member whose array contains only `null`, such as `{"p": [null, null], "q": 1}` | Can be removed: `{"q":1}` |
| Values inside arrays, such as `{"arr": [{"a": null}, {}, [], null]}` | Kept as they are. `v['arr'][1]['a']` is a VARIANT `null`. |
| A root JSON `null`, such as `PARSE_TO_VARIANT('null')` | An empty object `{}` |
| A root empty array `[]` or empty object `{}` | Kept |
| `DATE` and `DATETIME` values in the root value, such as `CAST(date_col AS VARIANT)`, or on a path that also holds values of other types | Stored as their text, so they read back as strings. On an object path that holds only dates, they keep their type. |
| Booleans and numbers mixed on one path | Booleans can read back as `1` or `0`, depending on the order of values within a write and on compaction |
| A key that contains a dot, such as `{"a.b": 1}` | Stored as a nested path: `{"a":{"b":1}}`. Both `v['a.b']` and `v['a']['b']` return `1`. A document that has both a key `a.b` and a key `b` inside `a` makes the whole INSERT or load job fail, unless `variant_enable_duplicate_json_path_check` is `true`. |
| Object keys | Returned in byte order |

These rules depend on the other rows written together and on DOC mode, so do not rely on `null` values or empty containers surviving storage. Paths declared in a Schema Template are converted to the declared type instead; see [Schema Template](#schema-template).

## Type inference and type conflicts

Without a Schema Template, Doris infers a type for each value when it parses JSON. `VARIANT_TYPE` returns this type:

| JSON value | Type |
| --- | --- |
| Integer within the `BIGINT` range | `tinyint`, `smallint`, `int`, or `bigint`, the smallest that fits |
| Integer above the `BIGINT` range, up to 18446744073709551615 | `decimal` |
| Number with a fraction or an exponent | `double` |
| Integer outside [-2^63, 2^64 - 1], or a number outside the `DOUBLE` range | Not a number: the whole text is invalid JSON (see [Parse errors](#parse-errors)) |
| String | `string` |
| `true`, `false` | `bool` |
| `null` | `null` |
| Array, object | `array`, `object` |

When data is stored, each path gets one storage type:

- Integers are stored as `BIGINT`, or as `LARGEINT` when a value needs it. Floating-point numbers are stored as `DOUBLE`, decimals as `DECIMAL`, strings as `STRING`, booleans as `BOOLEAN`, and arrays of scalars as `ARRAY<T>`.
- Arrays of objects, nested arrays, and paths whose values have different types, such as integers and floating-point numbers, numbers and strings, or scalars and arrays, are stored as `JSONB` (shown as `json` by `DESC`). Arrays with conflicting element types become `ARRAY<JSONB>`.

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a is stored as JSONB
```

A `JSONB` path keeps every value, but it loses typed storage: indexes and typed pruning no longer apply to that path. Booleans are a special case: when the first value on a path is a boolean and later values are numbers, the path can be stored as a number, and the booleans read back as `1` or `0`. If a path needs a stable type, declare it in a Schema Template.

`VARIANT_TYPE` reports the type of each value, so an integer read from a `BIGINT` path can still be `tinyint`. To see the storage type of each path, run `SET describe_extend_variant_column = true;` and then `DESC table_name;`. See [Inspect subcolumns and types](#inspect-subcolumns-and-types).

## Access paths and output

- `v['key']` and `v['a']['b']` read object members. `v['arr'][1]` reads an array element: indexes start from 1, and `-1` is the last element. [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md) is equivalent.
- The result is a `VARIANT` value. A missing key, index `0`, an out-of-range index, a string key on an array, an integer index on an object, and a key on a scalar value all return SQL `NULL`.
- In a computed value, a key that contains a dot is a single key: `v['a.b']` reads the key `a.b`, while `v['a']['b']` reads `b` inside `a`. Storage does not keep this distinction; see [What storage keeps](#what-storage-keeps).
- A path does not map over arrays. For `{"a": [{"b": 1}]}`, `v['a']['b']` returns `NULL`; use `v['a'][1]['b']`.

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

Common patterns CAST a path to the type the query needs:

```sql
SELECT * FROM tbl WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';
SELECT * FROM tbl WHERE v['bool'];                -- implicit CAST to BOOLEAN
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';   -- uses an inverted index on the path
```

Reading a whole VARIANT value returns JSON text. Object keys are returned in byte order and without whitespace, so the text is not byte-for-byte identical to the input. A string root is returned without quotes.

```sql
CREATE TABLE variant_tbl (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_tbl VALUES (1, PARSE_TO_VARIANT('{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }'));

SELECT v FROM variant_tbl WHERE k = 1;
-- {"a":1,"b":2,"c":{"x":10,"y":20}}
```

## CAST

### CAST to VARIANT

| Source type | Result |
| --- | --- |
| `CHAR`, `VARCHAR`, `STRING` | A VARIANT string. JSON text is not parsed. The string must be valid UTF-8; otherwise the CAST fails. |
| `BOOLEAN` | A boolean. |
| `TINYINT`, `SMALLINT`, `INT`, `BIGINT` | An integer. |
| `LARGEINT` | A decimal. A value whose magnitude exceeds 10^38 - 1 becomes a string. |
| `FLOAT`, `DOUBLE` | A floating-point number. |
| `DECIMALV2`, `DECIMAL(p, s)` with `p <= 38` | A decimal. |
| `DATE`, `DATETIME(p)`, `TIMESTAMP_NS` | A date, or a timestamp without time zone. |
| `IPV4`, `IPV6` | A string with the text form of the value. |
| `JSON` / `JSONB` | The same structure. A value that VARIANT cannot hold, such as a `DECIMAL256` number, or duplicate keys in an object make the CAST fail. |
| `ARRAY<T>` | An array; each element is converted. `T` must be `VARIANT` or a type in this table. |
| `MAP`, `STRUCT`, `TIME`, `TIMESTAMPTZ`, `VARBINARY`, and other types | Not supported. The statement fails. |

The source value must also be valid for its own type; an invalid value is rejected, not repaired. A string is never parsed by CAST: `CAST('{"id": 1}' AS VARIANT)` is the string `{"id": 1}`. Use `PARSE_TO_VARIANT` to parse JSON text.

### CAST from VARIANT

| Target type | Result |
| --- | --- |
| `BOOLEAN` | Booleans as they are. Numbers are `true` when not zero. Strings are converted as by `CAST(string AS BOOLEAN)`. |
| `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT` | Integers. The fraction of a decimal or floating-point value is truncated (`1.5` becomes `1`). Booleans become `1` or `0`. Numeric strings such as `"123"` are converted. |
| `FLOAT`, `DOUBLE`, `DECIMAL(p, s)` | Numbers and numeric strings. `DECIMAL` rounds to scale `s`. A value too large for `FLOAT` becomes `Infinity`. |
| `DATE`, `DATETIME(p)`, `TIMESTAMP_NS` | Date and time values, strings in a date or time format, and numbers such as `20240102`. |
| `TIMESTAMPTZ(p)` | Date and time values, and strings in a date or time format. |
| `IPV4`, `IPV6` | Strings in IP address format. |
| `CHAR`, `VARCHAR`, `STRING` | A string root is returned as is, without quotes. Objects and arrays are returned as JSON text. Other scalars are formatted like the same SQL type: a boolean root becomes `1` or `0`, a `DATETIME` value has six fractional digits, and a `TIMESTAMP_NS` value has nine. A VARIANT `null` becomes the string `null`. |
| `JSON` / `JSONB` | The same structure. Values without a JSON counterpart, such as dates and timestamps, become JSON strings; a timestamp with time zone is formatted in the session time zone. |
| `ARRAY<T>` | An array, converted element by element; an element that cannot be converted becomes `NULL`. A string that holds a JSON array, such as `"[1, 2]"`, is converted too. Other values return `NULL`. |
| `MAP`, `STRUCT`, `TIME`, and other types | Not supported. The statement fails. |

A value that cannot be converted to the target type returns SQL `NULL`, also when `enable_strict_cast` is on. The exception is a value whose type has no conversion to the target type at all, such as a number to `TIMESTAMPTZ`, `IPV4`, or `IPV6`, or a date or timestamp to `BOOLEAN`: then the statement fails.

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

### Decimal and date/time values

When these types are converted to VARIANT:

| Doris type | Behavior |
| --- | --- |
| Legacy `DECIMALV2` | Precision up to 27 and scale up to 9 are preserved exactly. |
| `DECIMAL(p, s)` | `1 <= p <= 38` and `0 <= s <= p` are preserved exactly. Decimals with precision greater than 38 are not supported. |
| `DATE` | A calendar date with no time or time zone. |
| `DATETIME(p)` | `0 <= p <= 6`, without time-zone adjustment. |
| `TIMESTAMP_NS` | Nanosecond precision without time-zone adjustment; values must be within the TIMESTAMP_NS range. |
| `TIMESTAMPTZ(p)` | Not supported, neither by CAST nor as a Schema Template path. |
| `TIME` | Not supported. |

## NULL semantics

VARIANT has two kinds of null:

- **SQL `NULL`** means that there is no value. It comes from a `NULL` column value, a missing path such as `v['no_such_key']`, or a CAST that fails.
- **VARIANT `null`** is a value: the JSON literal `null`, such as `PARSE_TO_VARIANT('null')` or a `null` array element. `VARIANT_TYPE` returns `null` for it.

| Operation | SQL `NULL` | VARIANT `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| `COALESCE(v, x)`, `IFNULL(v, x)` with a VARIANT `x` | Returns `x` | Returns the VARIANT `null` |
| `COUNT(v)` | Not counted | Counted |
| `GROUP BY v`, `DISTINCT` | All SQL `NULL` values form one group | All VARIANT `null` values form another group |
| `v = x`, equality join | Never matches | Matches another VARIANT `null` |
| `ORDER BY v` | Placed by `NULLS FIRST` or `NULLS LAST` | In ascending order, before every other non-NULL value |
| `CAST(v AS STRING)` | SQL `NULL` | The string `null` |

After a value is stored, a `null` member of an object outside arrays is removed, so reading it returns SQL `NULL`, and a root `null` reads back as `{}` (see [What storage keeps](#what-storage-keeps)). On stored data, `v['a'] IS NULL` therefore cannot tell a missing member from a `null` member.

## Comparison, grouping, and ordering

VARIANT values are compared by their logical value, not by their text or physical encoding. Equality, hashing (`GROUP BY`, `DISTINCT`, joins), and ordering (`ORDER BY`, window keys) use the same rules, so equal values always fall into the same group and are ties when sorted.

### Supported operations

| Operation on VARIANT values | Support | Notes |
| --- | --- | --- |
| `=`, `!=`, `<=>` between two VARIANT values, or with a `NULL` literal | Supported | Includes subpaths, such as `v['a'] = w['a']`. |
| Equality join, semi and anti join, `IN` and `NOT IN` subqueries | Supported | Runtime filters are not generated for VARIANT join keys. |
| `GROUP BY`, `DISTINCT`, `COUNT(DISTINCT ...)`, `UNION`, `INTERSECT`, `EXCEPT` | Supported | |
| `ORDER BY`, `ORDER BY ... LIMIT` | Supported | |
| Window `PARTITION BY` and `ORDER BY` | Supported | |
| `COUNT(v)`, `COLLECT_LIST(v)`, `ARRAY_AGG(v)` | Supported | |
| `IF`, `CASE`, `IFNULL`, `COALESCE` | Supported | Mixing VARIANT with another type converts the VARIANT values to the other type (`DECIMAL(38, 9)` when it is an integer); values that cannot be converted become `NULL`. |
| `CAST(v AS ARRAY<VARIANT>)`, `EXPLODE_VARIANT_ARRAY`, `EXPLODE` and `EXPLODE_OUTER` on `ARRAY<VARIANT>` | Supported | |
| `<`, `<=`, `>`, `>=`, `BETWEEN` between VARIANT values | Not supported | CAST to a concrete type first. |
| A whole VARIANT value compared with a non-VARIANT value, such as `v = 1` | Not supported | A subpath is converted implicitly: `v['a'] = 1` works. |
| `IN` list that contains VARIANT values, such as `v IN (PARSE_TO_VARIANT('1'))` | Not supported | `v IN ('a', 'b')` with non-VARIANT values works through implicit conversion. |
| `MIN`, `MAX` | Not supported | CAST a subpath first. |
| `ARRAY(...)`, `MAP(...)`, `NAMED_STRUCT(...)` with VARIANT arguments | Not supported | |

### Equality

- **Numbers.** An integer, a decimal whose fraction is zero, and a floating-point number with an integral value are equal: `1`, `1.0`, and `1.00` are one value. Trailing zeros of a decimal do not matter, and `-0.0` equals `0`. A decimal and a floating-point number that have a fraction are never equal: `DECIMAL 1.5` does not equal `DOUBLE 1.5`. JSON numbers with a fraction are parsed as `DOUBLE`; decimals come from CAST, Schema Template paths, and integers too large for `BIGINT`.
- **Values of different kinds are never equal.** The number `1`, the string `"1"`, and `true` are three values. A `DATE` does not equal the string `"2024-01-01"`, and a timestamp without time zone does not equal a timestamp with time zone.
- **Strings** are equal only when their bytes are equal. The comparison is case-sensitive.
- **Objects** are equal when they have the same keys with equal values. Key order does not matter.
- **Arrays** are equal when they have the same length and equal elements in the same order.
- A VARIANT `null` equals another VARIANT `null`. SQL `NULL` follows the SQL rules.

```sql
SELECT PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('1.0')                             AS int_double,  -- 1
       PARSE_TO_VARIANT('1.5') = CAST(CAST(1.5 AS DECIMAL(10, 2)) AS VARIANT)       AS dbl_dec,     -- 0
       PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('"1"')                             AS num_str,     -- 0
       PARSE_TO_VARIANT('{"a": 1, "b": 2}') = PARSE_TO_VARIANT('{"b": 2, "a": 1}') AS obj,         -- 1
       PARSE_TO_VARIANT('[1, 2]') = PARSE_TO_VARIANT('[2, 1]')                     AS arr;         -- 0
```

### Ordering

`ORDER BY` on VARIANT values uses one total order. Values of different kinds are ordered by kind first:

```text
null < boolean < number < string < binary < date < timestamp with time zone
     < timestamp without time zone < time < UUID < object < array
```

Binary, time, and UUID values cannot be produced by JSON parsing or by CAST in Doris; they can only come from VARIANT data written by other systems, such as Parquet files with VARIANT columns.

Within a kind:

- **Booleans:** `false` before `true`.
- **Numbers:** by numeric value, across integers, decimals, and floating-point numbers. When a decimal and a floating-point number have the same non-integral value, the decimal sorts first. Negative infinity is the smallest number; positive infinity and then NaN are the largest.
- **Strings:** by UTF-8 bytes. Uppercase letters sort before lowercase letters, and `"10"` sorts before `"9"`.
- **Dates and timestamps:** in time order. Every date sorts before every timestamp.
- **Objects:** entry by entry in key order: the smallest keys are compared first, then their values, then the next keys. An object whose entries are a prefix of another's sorts first, so `{"a":1}` < `{"a":1,"b":2}` < `{"b":0}`.
- **Arrays:** element by element; a prefix sorts first, so `[]` < `[null]` < `[1]` < `[1,2]`.

SQL `NULL` is placed by `NULLS FIRST` or `NULLS LAST`.

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

### Typed comparison and VARIANT comparison

The operands decide whether a comparison uses the VARIANT rules or the rules of a concrete type. Take a path `a` whose values are `1`, `1.0`, and `"1"`:

| Expression | Compared as | Result |
| --- | --- | --- |
| `v['a'] = 1` | `DECIMAL(38, 9)`, through implicit CAST of `v['a']` | Matches all three values |
| `v['a'] = CAST(1 AS VARIANT)`, `v['a'] = w['a']` | VARIANT | Matches `1` and `1.0`, not `"1"` |
| `GROUP BY v['a']` | VARIANT | `1` and `1.0` form one group, `"1"` another |
| `GROUP BY CAST(v['a'] AS STRING)` | `STRING` | One group, `1` |
| `ORDER BY v['a']` | VARIANT | Numbers first, then strings |
| `ORDER BY CAST(v['a'] AS INT)` | `INT` | Numeric order; values that cannot be converted become `NULL` |

### Notes

- **Cost.** VARIANT keys are hashed and compared by their logical value. In a benchmark on 44 million rows, `GROUP BY`, sorting, and joins on a VARIANT key took 1.2 to 3.7 times as long as the same operations on `CAST(v['path'] AS <type>)`. When a path has one known type, CAST it.
- **Results follow the stored values.** The normalizations in [What storage keeps](#what-storage-keeps) happen before comparison: a member that was `null` is missing, a `DATE` in the root value compares as a string, and booleans mixed with numbers on one path can read back as `1` or `0`. Declare paths whose type matters in a Schema Template.
- **Mixed types sort by kind, not by value.** If a path holds both numbers and numeric strings, `ORDER BY v['a']` puts every number before every string, and orders the strings by bytes. CAST to one type for numeric or lexical order.
- **Values that look the same can differ.** In a `GROUP BY` result, the number `1` and the string `"1"` are displayed the same way but form two groups. Use `VARIANT_TYPE` to see the difference.
- The order across kinds is defined by Doris so that results are deterministic. It is not part of the JSON standard and can differ from other systems.
- The internal hash of a VARIANT value is an implementation detail, not a stable user-facing checksum.

## Schema Template

A Schema Template declares the storage type of selected paths. Declare only the key paths that need a stable type or a path-specific index; the rest of the document stays dynamic.

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
```

A template field can use these types:

- Numbers: `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, and `DECIMAL(p, s)` with `p <= 38`
- `STRING` (or `TEXT`)
- `BOOLEAN`
- `DATE`, `DATETIME(p)`, `TIMESTAMP_NS`
- `IPV4`, `IPV6`
- `ARRAY<T>`, where `T` is one of the types above (one dimension only)

### Writing to template paths

On a declared path, each value is converted to the declared type with non-strict CAST rules. A value that cannot be converted is stored as `NULL`, so the path is missing when read back; the rest of the row is still written. The conversion can change a value:

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

- `"123"` becomes `123`, `1.7` is truncated to `1`, `9.999` is rounded to `10.00`, and the timestamp keeps the declared precision (milliseconds); its text form always shows six fractional digits.
- `"abc"`, `"x"`, and `"not a time"` cannot be converted, so they are dropped.
- A JSON number with a fraction is parsed as `DOUBLE` before the conversion, so a `DECIMAL` path can lose precision. Write such values as JSON strings to keep every digit (see the [FAQ](#faq)).
- Date and IP values must be JSON strings: `{"date": 2020-01-01}` and `{"ip": 127.0.0.1}` are not valid JSON; write `{"date": "2020-01-01"}` and `{"ip": "127.0.0.1"}`.

:::caution
A value is only converted when its JSON type has a conversion to the declared type. A JSON number on an `IPV4` or `IPV6` path makes the whole write fail. If one write mixes JSON strings and numbers on a `DATE`, `DATETIME`, `IPV4`, or `IPV6` path, even the valid values on that path can be dropped. Write the values of such paths as JSON strings.
:::

### Reading template paths

`v['path']` keeps the `VARIANT` type even for a declared path; Doris does not cast it to the declared type automatically. CAST explicitly when you need the declared type, and CAST to the declared type in filters so that the query can use zone maps and indexes on the path:

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE CAST(v['id'] AS INT) = 123;
```

The Schema Template only decides how values are stored. The same JSON computed in a query keeps its parsed type:

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"price": 9.999}')['price']);  -- double
```

### Pattern matching

A field name is a glob pattern by default (`MATCH_NAME_GLOB`): `*` matches any sequence of characters, including the `.` between nested keys, and `?` matches one character. For example, `'m*'` matches `m1` and also `m2.x`. When a path matches several fields, the first field in definition order is used:

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

-- enumString1 matches both enumString* and enum*; the first one (STRING) is used.
```

To match a name that contains `*` literally, use `MATCH_NAME`:

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

Matched paths participate in Subcolumnization by default. If too many paths match and generate too many subcolumns, consider `variant_enable_typed_paths_to_sparse` (see [Column properties](#column-properties)).

The Schema Template cannot be changed after the column is created. See [ALTER TABLE](#alter-table).

## ALTER TABLE

`ALTER TABLE` supports:

- `ADD COLUMN` of a nullable VARIANT column, with or without a Schema Template and properties.
- `DROP COLUMN`, `RENAME COLUMN`, and `MODIFY COLUMN ... COMMENT '...'`.
- `ADD INDEX` and `DROP INDEX`. An index with `field_pattern` can only be defined in `CREATE TABLE`.
- On a column without a Schema Template: changing `NOT NULL` to `NULL`, and changing `variant_doc_materialization_min_rows`. `MODIFY COLUMN` takes the complete column definition; a property it omits takes the value of the matching `default_variant_*` session variable, so restate every property whose value differs.

Not supported:

- `ADD COLUMN ... VARIANT NOT NULL`: a `NOT NULL` column added by `ALTER` needs a default value, and VARIANT only allows `DEFAULT NULL`. Define `NOT NULL` VARIANT columns in `CREATE TABLE`.
- Adding a Schema Template to an existing column. On a column that has a Schema Template, `MODIFY COLUMN` can only change the comment; any other change fails, even one that restates the same template.
- Changing any property other than `variant_doc_materialization_min_rows`, changing `NULL` to `NOT NULL`, and converting between VARIANT and other types.
- `BUILD INDEX` on a VARIANT column.

For these changes, create a table with the new definition and copy the data with `INSERT INTO ... SELECT`; wrap a `STRING` source column in `PARSE_TO_VARIANT`.

```sql
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

-- v is a VARIANT column without a Schema Template.
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates
```

## Column properties

Column properties are set in `properties(...)` inside the VARIANT type:

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

| Property | Default | ALTER | Description |
| --- | --- | --- | --- |
| `variant_max_subcolumns_count` | `2048` | No | Maximum number of dynamic paths that go through Subcolumnization in one data file; paths with more non-null values are chosen first, and the other paths are stored in sparse columns. `0` means no limit. Range 0 to 100000; stay at or below 10000. The default is enough for most workloads; if the workload truly needs a much larger number of subcolumns, prefer [DOC mode](./variant-workload-guide.md#doc-mode-template). |
| `variant_enable_typed_paths_to_sparse` | `false` | No | By default, Schema Template paths always go through Subcolumnization and do not count toward `variant_max_subcolumns_count`. When `true`, they count toward the limit and can be stored in sparse columns. |
| `variant_sparse_hash_shard_count` | `1` | No | Number of physical sparse columns that sparse paths are distributed to by hash. Range 0 to 1024; `0` is treated as `1`. |
| `variant_max_sparse_column_statistics_size` | `10000` | No | Maximum number of sparse paths in one data file whose statistics are recorded. Beyond it, a query on a path that has no statistics cannot skip the sparse columns. Range 1 to 50000. |
| `variant_enable_doc_mode` | `false` | No | Enables DOC mode. It cannot be set together with `variant_max_subcolumns_count`, `variant_enable_typed_paths_to_sparse`, `variant_max_sparse_column_statistics_size`, or `variant_sparse_hash_shard_count`. |
| `variant_doc_materialization_min_rows` | `0` | Only without a Schema Template | DOC mode only. A write with fewer rows stores only the document; Subcolumnization happens once compaction merges files up to the threshold. `0` performs Subcolumnization at write time. Range 0 to 1000000000. |
| `variant_doc_hash_shard_count` | `64` | No | DOC mode only. Number of columns that the stored document is split into. Range 0 to 1024; `0` is treated as `1`. |

The **ALTER** column tells whether `ALTER TABLE ... MODIFY COLUMN` can change the property; see [ALTER TABLE](#alter-table). See [Wide columns](#wide-columns) for how to use the sparse and DOC mode properties.

### Session variables

| Variable | Default | Description |
| --- | --- | --- |
| `default_variant_max_subcolumns_count` | `2048` | Value of `variant_max_subcolumns_count` for a VARIANT column defined without it. |
| `default_variant_enable_typed_paths_to_sparse` | `false` | Value of `variant_enable_typed_paths_to_sparse` for a column defined without it. |
| `default_variant_sparse_hash_shard_count` | `0` | Value of `variant_sparse_hash_shard_count` for a column defined without it; `0` is treated as `1`. |
| `default_variant_max_sparse_column_statistics_size` | `10000` | Value of `variant_max_sparse_column_statistics_size` for a column defined without it. |
| `default_variant_enable_doc_mode` | `false` | Value of `variant_enable_doc_mode` for a column defined without it. |
| `default_variant_doc_materialization_min_rows` | `0` | Value of `variant_doc_materialization_min_rows` for a column defined without it. |
| `default_variant_doc_hash_shard_count` | `64` | Value of `variant_doc_hash_shard_count` for a column defined without it. |
| `describe_extend_variant_column` | `false` | When `true`, `DESC` also lists the subcolumns of VARIANT columns. |

The `default_variant_*` variables apply when a column is defined, by `CREATE TABLE` or by `ALTER TABLE`. Changing them does not affect existing columns, but it does affect a later `MODIFY COLUMN` that omits the property.

### BE configuration

| Configuration | Default | Description |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | Maximum length in bytes of a JSON object key. A longer key is a parse error. Range 1 to 65535. |
| `variant_throw_exeception_on_invalid_json` | `false` | When `false`, text that the JSON parser rejects is kept as a VARIANT string. When `true`, it is a parse error. |
| `variant_enable_duplicate_json_path_check` | `false` | When `false`, a key that repeats in an object is a parse error. When `true`, the first value is kept and the repeats are ignored. |

All three can be changed at runtime. See [Parse errors](#parse-errors) for how a parse error is reported.

## Variant indexes

### Choosing indexes

VARIANT supports BloomFilter and Inverted Index on subpaths.
- High-cardinality equality/IN filters: prefer BloomFilter (sparser index, better write performance).
- Tokenization/phrase/range search: use Inverted Index and set proper `parser`/`analyzer` properties.

A filter can use an index or a BloomFilter only when it compares the path with its stored type. CAST numeric paths explicitly; a string path compared with a string literal needs no CAST.

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 12345678;
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) IN (1, 2, 3);
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

You can specify index properties for certain VARIANT subpaths, and even configure both tokenized and non-tokenized inverted indexes for the same path. Path-specific indexes require the path type to be declared via Schema Template.

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

### When indexes don’t work

1. Type changes cause index loss: if a subpath changes to an incompatible type (e.g., INT → JSONB), the index is lost. Fix by pinning types and indexes via Schema Template.
2. The filter does not compare the path with its stored type:
   ```sql
   -- An implicit numeric comparison is evaluated row by row and uses no index
   SELECT * FROM tbl WHERE v['id'] = 123456;

   -- CAST to the stored type instead
   SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 123456;
   ```
   If `v['id']` is stored as a string, compare it with a string: `v['id'] = '123456'`.
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

## Wide columns

When ingested data contains many distinct JSON keys, the number of subcolumns produced by Subcolumnization can grow rapidly; at scale this may cause metadata bloat, higher write/merge cost, and query slowdowns. To address “wide columns” (too many subcolumns), VARIANT provides two mechanisms: **Sparse columns** and **DOC encoding**.

For workload selection guidance, see [Variant Workload Guide](./variant-workload-guide.md). This section only explains the mechanisms and their related properties.

Note: these two mechanisms are mutually exclusive—enabling DOC encoding disables sparse columns, and vice versa.

### Sparse columns

**How it works**

- The system ranks paths by non-null ratio / sparsity: high-frequency (less-sparse) paths go through Subcolumnization and are stored as independent subcolumns; remaining low-frequency (sparse) paths are merged and stored in sparse columns. The maximum number of extracted subcolumns is controlled by `variant_max_subcolumns_count`.
- If a path is declared in a Schema Template, by default it will not be moved into sparse columns; set `variant_enable_typed_paths_to_sparse` to allow typed paths to be moved into sparse columns.
- Sparse columns support sharding: distribute sparse subpaths across multiple sparse columns to reduce per-column read overhead and improve read efficiency. Use `variant_sparse_hash_shard_count` to specify how many sparse columns are physically stored.

**Reference notes**

- If most keys have similar non-null ratios (little sparsity contrast), it’s hard to identify truly sparse paths and the benefit of sparse columns is reduced.
- `variant_max_subcolumns_count` defaults to `2048`, which is already enough for most workloads. Avoid raising it aggressively just to pre-allocate more extracted subcolumns; if the workload truly needs large-scale Subcolumnization, prefer [DOC mode](./variant-workload-guide.md#doc-mode-template). The practical upper bound is still recommended to stay ≤ `10000`.
- `variant_sparse_hash_shard_count` can be roughly estimated as “number of sparse paths / 128”. Example: total JSON keys ≈ 10,000, `variant_max_subcolumns_count = 2000`, then sparse paths ≈ 8000, so `variant_sparse_hash_shard_count` can start around `8000/128`.

### DOC encoding (DOC mode)

**How it works**

- Paths can still go through Subcolumnization for path-based queries, and the original JSON is additionally stored as a stored field to return the full JSON document efficiently.
- DOC encoding supports sharding: the original JSON is split into multiple columns for storage and reassembled when querying the full JSON. Use `variant_doc_hash_shard_count` to specify the number of DOC shards.
- For small-batch writes, Subcolumnization can be skipped and deferred to later merges. This is controlled by `variant_doc_materialization_min_rows`. For example, if `variant_doc_materialization_min_rows = 10000`, writes below 10,000 rows will only store the original JSON and won’t trigger Subcolumnization for that batch.
- For ultra-wide workloads, DOC mode is also the more stable choice when Subcolumnization scale approaches ten-thousand subcolumns. Compared with default eager Subcolumnization, compaction memory can drop by about two-thirds, and sparse wide-column ingest throughput can improve by about 5-10x.
- When a `VARIANT` column is very wide and queries often read the whole document, DOC mode can improve `SELECT variant_col` performance by orders of magnitude compared with reconstructing the document from many subcolumns.

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

**Reference notes**

- DOC mode requires `variant_enable_doc_mode = true`.
- In DOC mode, Schema Template fields are limited to strings, integers, `FLOAT`, `DOUBLE`, `BOOLEAN`, and arrays of these types.
- `variant_doc_hash_shard_count` can be roughly estimated as “total JSON keys / 128”.

### Behavior at limits and tuning suggestions

1. After exceeding the threshold, new paths are written into sparse columns; Rowset merges may also move some paths into sparse columns.
2. The system prefers to keep paths with higher non-null ratios and higher access frequencies in Subcolumnization.
3. Close to 10,000 paths in Subcolumnization requires strong hardware (≥128G RAM, ≥32C per node recommended). If the workload is already near this range, prefer evaluating DOC mode first.
4. Ingestion tuning: increase client `batch_size` appropriately, or use Group Commit (increase `group_commit_interval_ms`/`group_commit_data_bytes` as needed).
5. If bucket pruning is not needed, consider RANDOM bucketing and enabling single-tablet loading to reduce compaction write amplification.
6. BE tuning knobs: `max_cumu_compaction_threads` (≥8), `vertical_compaction_num_columns_per_group=500` (improves vertical compaction but increases memory), `segment_cache_memory_percentage=20` (improves metadata cache efficiency).
7. Watch Compaction Score; if it keeps rising, compaction is lagging—reduce ingestion pressure.
8. Avoid large `SELECT *` on VARIANT; prefer specific projections like `SELECT v['path']`.

## Inspect subcolumns and types

Approach 1: use [VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type.md) to get the type of a value or of one path, row by row. It reads every row it checks:

```sql
SELECT VARIANT_TYPE(v), VARIANT_TYPE(v['a']) FROM variant_tbl LIMIT 10;
```

Approach 2: extended `DESC` to show the subpaths extracted through Subcolumnization and their storage types:

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

Approach 1 shows the type of each value; Approach 2 shows how each path is stored.

## Limitations

- **Wide tables optimization**: For wide tables with a large number of dynamic sub-columns (e.g., more than 2000 columns) generated by the `VARIANT` type, it is highly recommended to enable **Storage Format V3** by specifying `"storage_format" = "V3"` in the table `PROPERTIES`. This decouples column metadata from the Segment Footer, speeding up file opening and reducing memory overhead.
- A JSON key can be at most 255 bytes long by default (`variant_max_json_key_length`).
- A VARIANT column cannot be a key, partition, or bucketing column, and it cannot be nested in another type in a table schema (see [Define a VARIANT column](#define-a-variant-column)).
- Outside DOC mode, reading the entire VARIANT column scans all subpaths. For very wide columns, direct `SELECT variant_col` is generally not recommended unless DOC mode is enabled. If a column has many subpaths, consider storing the original JSON string in an extra STRING/JSONB column for whole-object searches like `LIKE`:

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

## Compared with JSON type

- Storage: JSON is stored as JSONB (row-oriented). VARIANT uses Subcolumnization on write (higher compression, smaller size).
- Query: JSON requires parsing. VARIANT scans columns directly and is usually much faster.

A modified ClickBench (43 queries):
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

1. Are `null` in VARIANT and SQL `NULL` the same?
   - No. A JSON `null` computed in a query is a VARIANT `null` value, while a missing path is SQL `NULL`. After the value is stored, `null` members of objects outside arrays are removed and read back as SQL `NULL`. See [NULL semantics](#null-semantics).
2. Why does `v['a']` return `NULL` after `INSERT INTO t VALUES (1, '{"a": 1}')`?
   - `INSERT` stores a string as a VARIANT string without parsing it, and so does `INSERT INTO ... SELECT` from `s3()`, `hdfs()`, or another string column. Use `PARSE_TO_VARIANT('{"a": 1}')`, or load the data with a load job such as Stream Load. See [Write data](#write-data).
3. Why is a whole JSON document stored as a string, although it is valid JSON?
   - The document probably contains an integer outside [-2^63, 2^64 - 1] or a number outside the `DOUBLE` range. The parser rejects such a document, and by default it is kept as a string. See [Parse errors](#parse-errors).
4. Why doesn’t my query/index work?
   - Check whether you CAST paths to their stored types (implicit numeric comparisons cannot use indexes), whether the type was promoted to JSONB due to conflicts, and whether you mistakenly expect an index on the whole VARIANT instead of on subpaths.
5. Why does `ORDER BY v['a']` put `"10"` after `9`, or `GROUP BY v['a']` separate `1` and `"1"`?
   - VARIANT ordering and equality first look at the kind of the value: numbers sort before strings, and a number never equals a string. CAST the path to one type when you need numeric or lexical semantics. See [Comparison, grouping, and ordering](#comparison-grouping-and-ordering).
6. Why does `COALESCE(v['a'], 0)` return `0.000000000` when `v['a']` is a string, and `IF(..., v['a'], 1)` return `NULL`?
   - Mixing VARIANT with another type converts the VARIANT values to the other type, which is `DECIMAL(38, 9)` for an integer. A string such as `"abc"` cannot be converted and becomes `NULL`, so `COALESCE` returns `0` as `0.000000000`. Write `COALESCE(v['a'], CAST(0 AS VARIANT))` to keep a VARIANT result, or CAST `v['a']` to the type you want.
7. Why does DECIMAL lose precision when written into a VARIANT column?
   - JSON numbers with a fraction are inferred as `DOUBLE`, not `DECIMAL`, so trailing digits can be lost. Declaring the path as `DECIMAL` in a Schema Template, for example `v VARIANT<'num': DECIMAL(9, 3)>`, does not fully help, because the value is parsed as `DOUBLE` first. Write the value as a JSON string inside the document, for example `PARSE_TO_VARIANT('{"num": "12.345"}')`; it is then converted directly to `DECIMAL(9, 3)` without loss.
