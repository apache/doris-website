---
{
    "title": "VARIANT",
    "language": "en-US",
    "description": "VARIANT stores semi-structured JSON. Reference for writing and parsing, CAST, NULL semantics, comparison and ordering, Schema Template, ALTER, and properties."
}
---

## Overview

The VARIANT type stores semi-structured JSON data: objects, arrays, strings, numbers, booleans, and `null`. On write, Doris infers the type of each JSON path and performs Subcolumnization on frequent paths, storing them as independent columnar subcolumns. A query on such a path reads only the subcolumn it needs.

:::tip Why VARIANT
`VARIANT` is a good fit when document shape changes over time but queries still focus on a small set of hot paths.

- Hot paths participate in Subcolumnization, so they benefit from columnar performance, file pruning, and vectorized execution.
- Key paths can use path-level indexes, full-text search, and still benefit from Doris sparse-index pruning.
- Wide-column optimizations keep automatic Subcolumnization practical at 10k-scale subcolumns. When paths participating in Subcolumnization approach 10,000, hardware requirements rise quickly, so DOC mode is usually the safer starting point.

If you still need to choose between default behavior, sparse columns, DOC mode, and Schema Template, start with [Variant Workload Guide](./variant-workload-guide). This page is the reference for syntax, type rules, indexes, limits, and configuration.
:::

:::info Version
This page describes VARIANT in Doris 5.0.0 and later. The differences from Doris 4.x that are most likely to affect existing SQL:

- `INSERT` stores a string as a VARIANT string instead of parsing it as JSON. Use `PARSE_TO_VARIANT` to write JSON text with `INSERT`. Load jobs such as Stream Load still parse JSON.
- Whole VARIANT values support `=`, `!=`, `<=>`, equality joins, `ORDER BY`, and window keys.
- `v['path']` stays `VARIANT` even when the path is declared in a Schema Template. CAST it explicitly.

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
WHERE v['score'] > 5;
```

```text
+------+-------+-----------+
| id   | name  | first_tag |
+------+-------+-----------+
|    1 | alice | doris     |
+------+-------+-----------+
```

- `v['user']['name']` and `v['tags'][1]` return `VARIANT` values. Array indexes start from 1.
- In `v['score'] > 5`, the sub-path is cast to a concrete type chosen from the other operand, here `DECIMAL(38, 9)`. See [Implicit conversion](#implicit-conversion).
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

### How input becomes a VARIANT value

| Write path | Result |
| --- | --- |
| `INSERT ... VALUES` or `INSERT ... SELECT` with a `CHAR`, `VARCHAR`, or `STRING` expression | A VARIANT **string**. The text is not parsed, even if it looks like JSON. Group commit INSERT behaves the same way. |
| `INSERT` with `PARSE_TO_VARIANT(expr)` or `TRY_PARSE_TO_VARIANT(expr)` | The parsed JSON value. See [Parse errors](#parse-errors). |
| `INSERT` with a `JSON`/`JSONB` expression | The same structure, converted directly. |
| `INSERT` with another typed expression | A typed value. See [CAST to VARIANT](#cast-to-variant). |
| Load jobs (Stream Load, Broker Load, Routine Load) in CSV format | The field text is parsed as JSON. `\N` loads SQL `NULL`. |
| Load jobs in JSON format | The JSON value of the field. If the value is a JSON string, its content is parsed again as JSON text: `"123"` loads the number `123`, `"{\"a\": 1}"` loads an object, and `"hello"` stays the string `hello`. A JSON `null` or a missing field loads SQL `NULL`. |

```sql
CREATE TABLE variant_tbl (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_tbl VALUES
    (1, '{"a": 1}'),                     -- stored as a string
    (2, PARSE_TO_VARIANT('{"a": 1}'));   -- stored as an object

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

A string root is returned without quotes, so a stored string can look like JSON. Use `VARIANT_TYPE` to tell them apart. To turn such strings into structured values, write them again through `PARSE_TO_VARIANT(CAST(v AS STRING))`.

For step-by-step load examples, see [Load VARIANT data](../../../../data-operate/import/complex-types/variant).

### Parse errors

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant), [TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant), and load jobs use the same JSON parser. Load jobs handle errors like `TRY_PARSE_TO_VARIANT`:

| Input | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` and load jobs |
| --- | --- | --- |
| Valid JSON | The parsed value | The parsed value |
| Text that is not valid JSON, such as `hello` or `{"id":` | Kept as a VARIANT string | Kept as a VARIANT string |
| Empty string | An empty object `{}` | An empty object `{}` |
| An object key longer than `variant_max_json_key_length` bytes (BE configuration, default 255) | Error | SQL `NULL` |
| Duplicate keys in one object | Error | SQL `NULL` |

Invalid JSON is kept as a string because the BE configuration `variant_throw_exeception_on_invalid_json` defaults to `false`. When it is `true`, invalid JSON is handled like the last two rows.

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
| A root JSON `null`, such as `PARSE_TO_VARIANT('null')` | An empty object `{}` |
| `null` elements of an array, such as `[1, null]` | Kept: `[1,null]`. The element reads back as a VARIANT `null`. |
| A root empty array `[]` or empty object `{}` | Kept |
| `DATE` and `DATETIME` values outside a Schema Template path, such as `CAST(date_col AS VARIANT)` | Stored as their text, so they read back as strings |
| Booleans and numbers mixed on one path | Booleans can read back as `1` or `0`, depending on the order of values within a write and on compaction |
| A key that contains a dot, such as `{"a.b": 1}` | Stored as a nested path: `{"a":{"b":1}}`. Both `v['a.b']` and `v['a']['b']` return `1`. A document that has both a key `a.b` and a key `b` inside `a` fails to be written. |
| Object keys | Returned in byte order |

Paths declared in a Schema Template are converted to the declared type instead. See [Schema Template](#schema-template). The storage type of each path is described in [Type inference and type conflicts](#type-inference-and-type-conflicts).

## Access paths and output

- `v['key']` and `v['a']['b']` read object members. `v['arr'][1]` reads an array element: indexes start from 1, and `-1` is the last element. [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at) is equivalent.
- The result is a `VARIANT` value. A missing key, index `0`, an out-of-range index, a string key on an array, and an integer index on an object all return SQL `NULL`.
- In a computed value, a key that contains a dot is a single key: `v['a.b']` reads the key `a.b`, while `v['a']['b']` reads `b` inside `a`. Storage does not keep this distinction; see [What storage keeps](#what-storage-keeps).
- A path does not map over arrays. For `{"a": [{"b": 1}]}`, `v['a']['b']` returns `NULL`; use `v['a'][1]['b']`.

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

Reading a whole VARIANT value returns JSON text. Object keys are returned in byte order and without whitespace, so the text is not byte-for-byte identical to the input:

```sql
INSERT INTO variant_tbl VALUES (3, PARSE_TO_VARIANT('{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }'));

SELECT v FROM variant_tbl WHERE k = 3;
-- {"a":1,"b":2,"c":{"x":10,"y":20}}
```

## CAST and implicit conversion

### CAST to VARIANT

| Source type | Result |
| --- | --- |
| `CHAR`, `VARCHAR`, `STRING` | A VARIANT string. JSON text is not parsed. The string must be valid UTF-8; otherwise the CAST fails. |
| `BOOLEAN` | A boolean. |
| `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT` | An integer. A `LARGEINT` value whose magnitude exceeds 10^38 - 1 becomes a string. |
| `FLOAT`, `DOUBLE` | A floating-point number. |
| `DECIMALV2`, `DECIMAL(p, s)` with `p <= 38` | A decimal. |
| `DATE`, `DATETIME(p)`, `TIMESTAMP_NS` | A date, or a timestamp without time zone. |
| `IPV4`, `IPV6`, `UUID` | A string with the text form of the value. |
| `JSON` / `JSONB` | The same structure. |
| `ARRAY<T>` | An array; each element is converted. `T` must be `VARIANT` or a type in this table. |
| `MAP`, `STRUCT`, `TIME`, `TIMESTAMPTZ`, `VARBINARY`, and other types | Not supported. The statement fails. |

The source value must also be valid for its own type; an invalid value is rejected, not repaired. A string is never parsed by CAST: `CAST('{"id": 1}' AS VARIANT)` is the string `{"id": 1}`. Use `PARSE_TO_VARIANT` to parse JSON text.

### CAST from VARIANT

| Target type | Result |
| --- | --- |
| `BOOLEAN` | Booleans as they are. Numbers are `true` when not zero. Strings are converted as by `CAST(string AS BOOLEAN)`. |
| `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT` | Integers. The fraction of a decimal or floating-point value is truncated (`1.5` becomes `1`). Booleans become `1` or `0`. Numeric strings such as `"123"` are converted. |
| `FLOAT`, `DOUBLE`, `DECIMAL(p, s)` | Numbers and numeric strings. `DECIMAL` rounds to scale `s`. |
| `DATE`, `DATETIME(p)`, `TIMESTAMP_NS`, `TIMESTAMPTZ(p)` | Date and time values, and strings in a date or time format. |
| `IPV4`, `IPV6` | Strings in IP address format. |
| `CHAR`, `VARCHAR`, `STRING` | A string root is returned as is, without quotes. Objects and arrays are returned as JSON text. Other scalars are formatted like the same SQL type: a boolean root becomes `1` or `0`, and a timestamp has six fractional digits. A VARIANT `null` becomes the string `null`. |
| `JSON` / `JSONB` | The same structure. Values without a JSON counterpart, such as dates and timestamps, become JSON strings; a timestamp with time zone is formatted in the session time zone. |
| `ARRAY<T>` | An array, converted element by element; an element that cannot be converted becomes `NULL`. A string that holds a JSON array, such as `"[1, 2]"`, is converted too. Other values return `NULL`. |
| `MAP`, `STRUCT`, `TIME`, and other types | Not supported. The statement fails. |

A value that cannot be converted to the target type returns SQL `NULL`. This does not depend on `enable_strict_cast`: a CAST from VARIANT does not fail because of a value, even in strict mode.

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

### Decimal and date/time limits

| Doris type | Behavior with VARIANT |
| --- | --- |
| Legacy `DECIMALV2` | Precision up to 27 and scale up to 9 are preserved exactly. |
| `DECIMAL(p, s)` | `1 <= p <= 38` and `0 <= s <= p` are preserved exactly. Decimals with precision greater than 38 are not supported. |
| `DATE` | A calendar date with no time or time zone. |
| `DATETIME(p)` | `0 <= p <= 6`, without time-zone adjustment. |
| `TIMESTAMP_NS` | Nanosecond precision without time-zone adjustment; values must be within the TIMESTAMP_NS range. |
| `TIMESTAMPTZ(p)` | Not supported as a CAST source. A Schema Template path can be declared as `TIMESTAMPTZ`. |
| `TIME` | Not supported. |

### Implicit conversion

Doris converts VARIANT implicitly in these cases:

- **A sub-path compared with a non-VARIANT value.** In `v['a'] = 1`, `v['d'] > '2024-01-01'`, or `v['a'] IN (1, 2)`, the sub-path (`v['a']` or `ELEMENT_AT`) is cast to a type chosen from the other operand: integers and decimals are compared as `DECIMAL(38, 9)`, `FLOAT` and `DOUBLE` as `DOUBLE`, dates and datetimes as `DATETIME(6)`, strings as `STRING`, and booleans as `BOOLEAN`. The conversion follows the CAST rules above, so the string `"1"` equals `1`, and a value that cannot be converted makes the comparison `NULL`.
- **Function arguments.** A VARIANT argument is cast to the parameter type when the function takes a number, a string, or JSON, for example `ABS(v['n'])`, `LENGTH(v['s'])`, and `SUM(v['n'])`.
- **JSON functions.** Functions such as `JSON_EXTRACT`, `JSON_KEYS`, `JSON_CONTAINS`, and `TO_JSON` accept a VARIANT argument and convert it with `CAST(v AS JSON)`. Functions that also accept a string (`JSON_VALID`, `JSON_QUOTE`, `JSON_UNQUOTE`, `JSON_PARSE`) use the string form. A whole-document JSON function reads and assembles the entire VARIANT value, so `v['a']['b']` is much faster than `JSON_EXTRACT(v, '$.a.b')` for reading one path.

Doris does not convert implicitly in these cases; CAST explicitly:

- Arithmetic: `v['a'] + 1` fails. Write `CAST(v['a'] AS BIGINT) + 1`.
- A whole VARIANT column compared with a non-VARIANT value: `v = 1` and `v = 'x'` fail.
- `<`, `<=`, `>`, `>=` between two VARIANT values, including two sub-paths such as `v['a'] < v['b']`.
- `MIN` and `MAX` of VARIANT values.
- Paths declared in a Schema Template: `v['id']` stays `VARIANT` even if `id` is declared as `INT`.

## NULL semantics

### SQL NULL and VARIANT null

VARIANT has two kinds of null:

- **SQL `NULL`** means that there is no value. It comes from a `NULL` column value, a missing path such as `v['no_such_key']`, or a CAST that fails, and it follows the usual SQL rules.
- **VARIANT `null`** is a value: the JSON literal `null`, such as the result of `PARSE_TO_VARIANT('null')` or a `null` array element. `VARIANT_TYPE` returns `null` for it. It is not SQL `NULL`.

| Operation | SQL `NULL` | VARIANT `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| `COALESCE(v, x)`, `IFNULL(v, x)` | Returns `x` | Returns the VARIANT `null` |
| `COUNT(v)`, `COUNT(DISTINCT v)` | Not counted | Counted |
| `GROUP BY v`, `DISTINCT` | One group | A separate group |
| `ORDER BY v` | Placed by `NULLS FIRST` or `NULLS LAST`; by default first in ascending order and last in descending order | Sorts before every other non-NULL value |
| `v = x`, equality join | Never matches | Matches another VARIANT `null` |
| `v <=> x` | Matches SQL `NULL` | Matches another VARIANT `null` |
| `CAST(v AS STRING)` | SQL `NULL` | The string `null` |
| `CAST(v AS INT)` and other scalar types | SQL `NULL` | SQL `NULL` |
| `CAST(v AS JSON)` | SQL `NULL` | JSON `null` |

### Computed values and stored values

Whether a JSON `null` is a VARIANT `null` or SQL `NULL` depends on whether the value has been stored:

| Value | `null` object member (`{"a": null}`) | Root `null` | `null` array element |
| --- | --- | --- | --- |
| Computed in a query (`PARSE_TO_VARIANT`, CAST, functions) | `v['a']` is a VARIANT `null` | A VARIANT `null` | A VARIANT `null` |
| Read from a table | The member is removed, so `v['a']` is SQL `NULL` | Read back as `{}` | A VARIANT `null` |

Load jobs add one more rule: in JSON format, `"v": null` or a missing field loads SQL `NULL` into the column. In CSV format, `\N` loads SQL `NULL`, while the text `null` is parsed as a VARIANT `null` and is read back as `{}`.

```sql
-- Computed: the member exists and holds a VARIANT null.
SELECT PARSE_TO_VARIANT('{"a": null}')['a'] IS NULL                AS is_sql_null,  -- 0
       VARIANT_TYPE(PARSE_TO_VARIANT('{"a": null}')['a'])          AS type;         -- null

-- Stored: the member is removed, so reading it returns SQL NULL.
INSERT INTO variant_tbl VALUES (4, PARSE_TO_VARIANT('{"a": null, "b": 1}'));

SELECT v, v['a'] IS NULL AS is_sql_null FROM variant_tbl WHERE k = 4;
-- v: {"b":1}, is_sql_null: 1
```

Consequences:

- On stored data, `v['a'] IS NULL` is true both when `a` is missing and when it was `null`. The two cases cannot be told apart after the write.
- On computed values, `IS NULL` does not match a JSON `null`. When a JSON `null` should count as missing, also test the type: `x IS NULL OR VARIANT_TYPE(x) = 'null'`.
- A stored `{"a": null}`, a stored `{}`, and a stored root `null` all read back as `{}`, so they are one value in `GROUP BY`, `DISTINCT`, and joins.

## Comparison, grouping, and ordering

VARIANT values are compared by their logical value, not by their text or physical encoding. Equality, hashing (`GROUP BY`, `DISTINCT`, joins), and ordering (`ORDER BY`, window keys) use the same rules, so equal values always fall into the same group and are peers when sorted.

### Supported operations

| Operation on VARIANT values | Support | Notes |
| --- | --- | --- |
| `=`, `!=`, `<=>` between two VARIANT values, or with a bare `NULL` | Supported | Includes sub-paths, such as `v['a'] = w['a']`. |
| Equality join, semi and anti join, `IN` and `NOT IN` subqueries | Supported | Runtime filters are not generated for VARIANT join keys. |
| `GROUP BY`, `DISTINCT`, `COUNT(DISTINCT ...)`, `UNION`, `INTERSECT`, `EXCEPT` | Supported | |
| `ORDER BY`, `ORDER BY ... LIMIT` | Supported | |
| Window `PARTITION BY` and `ORDER BY` | Supported | |
| `COUNT(v)`, `COLLECT_LIST(v)`, `ARRAY_AGG(v)` | Supported | |
| `IF`, `CASE`, `IFNULL`, `COALESCE` | Supported | |
| `CAST(v AS ARRAY<VARIANT>)`, `EXPLODE_VARIANT_ARRAY`, `EXPLODE` and `EXPLODE_OUTER` on `ARRAY<VARIANT>` | Supported | |
| `<`, `<=`, `>`, `>=`, `BETWEEN` between VARIANT values | Not supported | CAST to a concrete type first. |
| A whole VARIANT value compared with a non-VARIANT value, such as `v = 1` | Not supported | A sub-path is converted implicitly: `v['a'] = 1` works. |
| `IN` with a value list on a whole VARIANT value, such as `v IN (...)` | Not supported | `v['a'] IN (1, 2)` works through implicit conversion. |
| `MIN`, `MAX` | Not supported | CAST a sub-path first. |
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

Within a kind:

- **Booleans:** `false` before `true`.
- **Numbers:** by numeric value, across integers, decimals, and floating-point numbers. A decimal sorts before a floating-point number with the same value. Negative infinity is the smallest number; positive infinity and then NaN are the largest.
- **Strings:** by UTF-8 bytes. Uppercase letters sort before lowercase letters, and `"10"` sorts before `"9"`.
- **Dates and timestamps:** in time order.
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
- **Results follow the stored values.** The normalizations in [What storage keeps](#what-storage-keeps) happen before comparison: a member that was `null` is missing, a `DATE` written without a Schema Template compares as a string, and booleans mixed with numbers on one path can read back as `1` or `0`. Declare paths whose type matters in a Schema Template.
- **Mixed types sort by kind, not by value.** If a path holds both numbers and numeric strings, `ORDER BY v['a']` puts every number before every string, and orders the strings by bytes. CAST to one type for numeric or lexical order.
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
        'tz_val': TIMESTAMPTZ,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");
```

A template field can use these types:

- Numbers: `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, and `DECIMAL(p, s)` with `p <= 38`
- `STRING` (or `TEXT`)
- `BOOLEAN`
- `DATE`, `DATETIME(p)`, `TIMESTAMPTZ(p)`, `TIMESTAMP_NS`
- `IPV4`, `IPV6`
- `ARRAY<T>`, where `T` is one of the types above (one dimension only)

`CHAR`, `VARCHAR`, `DECIMALV2`, `TIME`, `JSON`, `MAP`, `STRUCT`, and nested arrays cannot be used in a Schema Template.

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

- `"123"` becomes `123`, `1.7` is truncated to `1`, `9.999` is rounded to `10.00`, and the timestamp keeps the declared precision (milliseconds).
- `"abc"`, `"x"`, and `"not a time"` cannot be converted, so they are dropped.
- A JSON number with a fraction is parsed as `DOUBLE` before the conversion, so a `DECIMAL` path can lose precision. Write such values as JSON strings to keep every digit (see the [FAQ](#faq)).

### Reading template paths

`v['path']` keeps the `VARIANT` type even for a declared path; Doris does not cast it to the declared type automatically. CAST explicitly when you need the declared type:

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE k = 1;
```

The Schema Template only decides how values are stored. Expressions that are not written to a table keep their own types:

```sql
-- The quoted JSON member is a string.
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"a": "12345"}')['a']);  -- string
```

`{"date": 2020-01-01}` and `{"ip": 127.0.0.1}` are not valid JSON; write `{"date": "2020-01-01"}` and `{"ip": "127.0.0.1"}`.

### Pattern matching

A field name is a glob pattern by default (`MATCH_NAME_GLOB`): `*` matches any sequence of characters, including the `.` between nested keys, and `?` matches one character. For example, `'m*'` matches `m1` and also `m2.x`. When a path matches several fields, the first field in definition order is used:

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

-- enumString1 matches both enumString* and enum*; the first one (STRING) is used.
```

To match a name that contains `*` literally, use `MATCH_NAME`:

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

Matched paths participate in Subcolumnization by default. If too many paths match and generate too many subcolumns, consider `variant_enable_typed_paths_to_sparse` (see [Column properties](#column-properties)).

Restrictions:

- In DOC mode, template fields are limited to numeric, string, and array types.
- The Schema Template cannot be changed after the column is created. See [ALTER TABLE](#alter-table).

## Type inference and type conflicts

Without a Schema Template, Doris infers a type for each value when it parses JSON. `VARIANT_TYPE` returns this type:

| JSON value | Type |
| --- | --- |
| Integer within the `BIGINT` range | `tinyint`, `smallint`, `int`, or `bigint`, the smallest that fits |
| Integer beyond `BIGINT` with up to 38 digits | `decimal` |
| Number with a fraction or an exponent | `double` |
| Number that fits none of the above, such as `1e400` or a 42-digit integer | `string` |
| String | `string` |
| `true`, `false` | `bool` |
| `null` | `null` |
| Array, object | `array`, `object` |

When data is stored, each path gets one storage type:

- Integers are stored as `BIGINT`, or as `LARGEINT` when a value needs it. Floating-point numbers are stored as `DOUBLE`, decimals as `DECIMAL`, strings as `STRING`, booleans as `BOOLEAN`, and arrays as `ARRAY<T>`.
- When values of different kinds meet on one path, such as integers and floating-point numbers, numbers and strings, or scalars and arrays, the path is stored as `JSONB` (shown as `json` by `DESC`). Arrays with conflicting element types become `ARRAY<JSONB>`.

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a is stored as JSONB
```

A `JSONB` path keeps every value, but it loses typed storage: indexes and typed pruning no longer apply to that path. Booleans are a special case: when the first value on a path is a boolean and later values are numbers, the path can be stored as a number and the booleans read back as `1` or `0`. If a path needs a stable type, declare it in a Schema Template.

To see the storage type of each path, run `SET describe_extend_variant_column = true;` and then `DESC table_name;`. See [Inspect subcolumns and types](#inspect-subcolumns-and-types).

## ALTER TABLE

| Operation | Supported | Notes |
| --- | --- | --- |
| `ADD COLUMN ... VARIANT [NULL]` | Yes | The new column can have a Schema Template and properties. |
| `ADD COLUMN ... VARIANT NOT NULL` | No | A `NOT NULL` column added by `ALTER` needs a default value, and VARIANT only allows `DEFAULT NULL`. Define `NOT NULL` VARIANT columns in `CREATE TABLE`. |
| `DROP COLUMN`, `RENAME COLUMN`, change the column comment | Yes | |
| Change `NOT NULL` to `NULL` | Yes | |
| Change `NULL` to `NOT NULL` | No | |
| Add, remove, or change Schema Template fields, or add a template to a column without one | No | Fails with `Can not change variant schema templates`. |
| Change `variant_max_subcolumns_count`, `variant_enable_typed_paths_to_sparse`, `variant_max_sparse_column_statistics_size`, `variant_sparse_hash_shard_count`, `variant_enable_doc_mode`, or `variant_doc_hash_shard_count` | No | |
| Change `variant_doc_materialization_min_rows` | Yes | |
| Convert between VARIANT and another type, such as `STRING` to `VARIANT` | No | Create a table with a VARIANT column and copy the data with `INSERT INTO ... SELECT ..., PARSE_TO_VARIANT(str_col) FROM ...`. |
| `ADD INDEX`, `DROP INDEX` on a VARIANT column | Yes | An index with `field_pattern` can only be defined in `CREATE TABLE`. `BUILD INDEX` is not supported on VARIANT columns. |

`MODIFY COLUMN` takes the complete new column definition. Properties that it omits take the values of the `default_variant_*` session variables, so restate every property whose value differs from them; otherwise the statement fails as a property change.

```sql
-- Fails: a NOT NULL column added by ALTER needs a default value.
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL DEFAULT '{}';
-- ERROR: Json or Variant type column default value just support null

-- Works: a nullable column, optionally with a Schema Template and properties.
ALTER TABLE t ADD COLUMN v3 VARIANT<'id': BIGINT, properties('variant_max_subcolumns_count' = '16')> NULL;

-- Fails: the Schema Template cannot be changed.
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates

-- Works: on a DOC mode column, change only variant_doc_materialization_min_rows.
ALTER TABLE t MODIFY COLUMN vd VARIANT<
    properties('variant_enable_doc_mode' = 'true', 'variant_doc_materialization_min_rows' = '100')
>;
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
| `variant_max_subcolumns_count` | `2048` | No | Maximum number of dynamic paths that go through Subcolumnization in one data file; paths with more non-null values are chosen first, and the other paths are stored in sparse columns. `0` means no limit. Range 0 to 100000; stay at or below 10000. The default is enough for most workloads; if the workload truly needs a much larger number of subcolumns, prefer <a href="./variant-workload-guide#doc-mode-template">DOC mode</a>. |
| `variant_enable_typed_paths_to_sparse` | `false` | No | By default, Schema Template paths always go through Subcolumnization and do not count toward `variant_max_subcolumns_count`. When `true`, they count toward the limit and can be stored in sparse columns. |
| `variant_sparse_hash_shard_count` | `1` | No | Number of physical sparse columns that sparse paths are distributed to by hash. Range 0 to 1024; `0` is treated as `1`. |
| `variant_max_sparse_column_statistics_size` | `10000` | No | Maximum number of sparse paths in one data file whose statistics are recorded. Beyond it, a query on a path that has no statistics cannot skip the sparse columns. Range 1 to 50000. |
| `variant_enable_doc_mode` | `false` | No | Enables DOC mode. It cannot be set together with `variant_max_subcolumns_count`, `variant_enable_typed_paths_to_sparse`, `variant_max_sparse_column_statistics_size`, or `variant_sparse_hash_shard_count`. |
| `variant_doc_materialization_min_rows` | `0` | Yes | DOC mode only. A write with fewer rows stores only the document; Subcolumnization happens once compaction merges files up to the threshold. Range 0 to 1000000000. |
| `variant_doc_hash_shard_count` | `64` | No | DOC mode only. Number of columns that the stored document is split into. Range 0 to 1024. |

The **ALTER** column tells whether `ALTER TABLE ... MODIFY COLUMN` can change the property. See [Wide columns](#wide-columns) for how to use the sparse and DOC mode properties.

### Session variables

| Variable | Default | Description |
| --- | --- | --- |
| `default_variant_max_subcolumns_count` | `2048` | Value of `variant_max_subcolumns_count` for a VARIANT column defined without it. |
| `default_variant_enable_typed_paths_to_sparse` | `false` | Value of `variant_enable_typed_paths_to_sparse` for a column defined without it. |
| `default_variant_sparse_hash_shard_count` | `0` | Value of `variant_sparse_hash_shard_count` for a column defined without it. |
| `default_variant_max_sparse_column_statistics_size` | `10000` | Value of `variant_max_sparse_column_statistics_size` for a column defined without it. |
| `default_variant_enable_doc_mode` | `false` | Value of `variant_enable_doc_mode` for a column defined without it. |
| `default_variant_doc_materialization_min_rows` | `0` | Value of `variant_doc_materialization_min_rows` for a column defined without it. |
| `default_variant_doc_hash_shard_count` | `64` | Value of `variant_doc_hash_shard_count` for a column defined without it. |
| `describe_extend_variant_column` | `false` | When `true`, `DESC` also lists the subcolumns of VARIANT columns. |

The `default_variant_*` variables apply when a column is defined, by `CREATE TABLE` or by `ALTER TABLE`; changing them does not affect existing columns.

### BE configuration

| Configuration | Default | Description |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | Maximum length in bytes of a JSON object key. A longer key is a parse error. Range 1 to 65535. |
| `variant_throw_exeception_on_invalid_json` | `false` | When `false`, text that is not valid JSON is kept as a VARIANT string. When `true`, it is a parse error. |

Both can be changed at runtime. See [Parse errors](#parse-errors) for how a parse error is reported.

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

## Wide columns

When ingested data contains many distinct JSON keys, the number of subcolumns produced by Subcolumnization can grow rapidly; at scale this may cause metadata bloat, higher write/merge cost, and query slowdowns. To address “wide columns” (too many subcolumns), VARIANT provides two mechanisms: **Sparse columns** and **DOC encoding**.

For workload selection guidance, see [Variant Workload Guide](./variant-workload-guide). This section only explains the mechanisms and their related properties.

Note: these two mechanisms are mutually exclusive—enabling DOC encoding disables sparse columns, and vice versa.

### Sparse columns

**How it works**

- The system ranks paths by non-null ratio / sparsity: high-frequency (less-sparse) paths go through Subcolumnization and are stored as independent subcolumns; remaining low-frequency (sparse) paths are merged and stored in sparse columns. The maximum number of extracted subcolumns is controlled by `variant_max_subcolumns_count`.
- If a path is declared in a Schema Template, by default it will not be moved into sparse columns; set `variant_enable_typed_paths_to_sparse` to allow typed paths to be moved into sparse columns.
- Sparse columns support sharding: distribute sparse subpaths across multiple sparse columns to reduce per-column read overhead and improve read efficiency. Use `variant_sparse_hash_shard_count` to specify how many sparse columns are physically stored.

**Reference notes**

- If most keys have similar non-null ratios (little sparsity contrast), it’s hard to identify truly sparse paths and the benefit of sparse columns is reduced.
- `variant_max_subcolumns_count` defaults to `2048`, which is already enough for most workloads. Avoid raising it aggressively just to pre-allocate more extracted subcolumns; if the workload truly needs large-scale Subcolumnization, prefer <a href="./variant-workload-guide#doc-mode-template">DOC mode</a>. The practical upper bound is still recommended to stay ≤ `10000`.
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
- In DOC mode, typed paths declared via Schema Template are limited to numeric, string, and array types.
- `variant_doc_hash_shard_count` can be roughly estimated as “total JSON keys / 128”.

### Behavior at limits and tuning suggestions

1. After exceeding the threshold, new paths are written into the shared structure; Rowset merges may also recycle some paths into the shared structure.
2. The system prefers to keep paths with higher non-null ratios and higher access frequencies in Subcolumnization.
3. Close to 10,000 paths in Subcolumnization requires strong hardware (≥128G RAM, ≥32C per node recommended). If the workload is already near this range, prefer evaluating DOC mode first.
4. Ingestion tuning: increase client `batch_size` appropriately, or use Group Commit (increase `group_commit_interval_ms`/`group_commit_data_bytes` as needed).
5. If partition pruning is not needed, consider RANDOM bucketing and enabling single-tablet loading to reduce compaction write amplification.
6. BE tuning knobs: `max_cumu_compaction_threads` (≥8), `vertical_compaction_num_columns_per_group=500` (improves vertical compaction but increases memory), `segment_cache_memory_percentage=20` (improves metadata cache efficiency).
7. Watch Compaction Score; if it keeps rising, compaction is lagging—reduce ingestion pressure.
8. Avoid large `SELECT *` on VARIANT; prefer specific projections like `SELECT v['path']`.

Note: If you see Stream Load error `[DATA_QUALITY_ERROR]Reached max column size limit 2048` (only on 2.1.x and 3.0.x), it means the merged tablet schema reached its column limit. You may increase `variant_max_merged_tablet_schema_size` (not recommended beyond 4096; requires strong hardware).

## Inspect subcolumns and types

Approach 1: use [VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type) to get the type of a value or of one path, row by row (precise, but it reads every row):

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

Use both: Approach 1 is precise; Approach 2 is efficient.

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

1. Are `null` in VARIANT and SQL `NULL` the same?
   - No. A JSON `null` computed in a query is a VARIANT `null` value, while a missing path is SQL `NULL`. After the value is stored, `null` object members are removed and read back as SQL `NULL`. See [NULL semantics](#null-semantics).
2. Why does `v['a']` return `NULL` after `INSERT INTO t VALUES (1, '{"a": 1}')`?
   - `INSERT` stores a string as a VARIANT string without parsing it. Use `PARSE_TO_VARIANT('{"a": 1}')`, or load the data with a load job such as Stream Load. See [Write data](#write-data).
3. Why doesn’t my query/index work?
   - Check whether you CAST paths to the correct types; whether the type was promoted to JSONB due to conflicts; or whether you mistakenly expect an index on the whole VARIANT instead of on subpaths.
4. Why does `ORDER BY v['a']` put `"10"` after `9`, or `GROUP BY v['a']` separate `1` and `"1"`?
   - VARIANT ordering and equality first look at the kind of the value: numbers sort before strings, and a number never equals a string. CAST the path to one type when you need numeric or lexical semantics. See [Comparison, grouping, and ordering](#comparison-grouping-and-ordering).
5. Why does DECIMAL lose precision when written into a VARIANT column?
   - When writing to a VARIANT column, the subcolumn type is not inferred as DECIMAL — numeric values are stored as DOUBLE, which can drop trailing decimals. Even declaring the subpath as DECIMAL via the Schema Template (e.g. `pm25 VARIANT<'xxx': DECIMAL(6, 2)>`) does not fully guarantee precision, because the value is first parsed as DOUBLE and then converted to DECIMAL on the write path. If the JSON value is written as a string (e.g. `'{"num": "12.345"}'`) together with a matching Schema Template DECIMAL declaration (e.g. `DECIMAL(9, 3)`), the string is parsed directly into DECIMAL on write, preserving precision.
