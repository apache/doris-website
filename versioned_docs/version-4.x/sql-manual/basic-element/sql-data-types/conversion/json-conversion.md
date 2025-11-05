---
{
    "title": "Cast to/from JSON",
    "language": "en"
}
---

The JSON type in Doris uses binary encoding for storage rather than text storage, providing more efficient processing and storage. There is a one-to-one mapping between JSON types and Doris internal types.

## Cast to JSON

### FROM String

When casting a string to JSON, the string content must conform to valid JSON syntax as defined in [RFC7159](https://datatracker.ietf.org/doc/html/rfc7159). The parser will validate the string and convert it to the corresponding JSON binary format.

#### String Parsing Rules

- If the string contains a valid JSON structure (object, array, number, boolean, or null), it will be parsed as that JSON type:
  ```sql
  mysql> SELECT CAST('[1,2,3,4]' AS JSON); -- Output: [1,2,3,4] (parsed as JSON array)
  +---------------------------+
  | CAST('[1,2,3,4]' AS JSON) |
  +---------------------------+
  | [1,2,3,4]                 |
  +---------------------------+
  ```

- To create a JSON string value (where the string itself is treated as a JSON string value rather than being parsed), use the `TO_JSON` function:
  ```sql
  mysql> SELECT TO_JSON('[1,2,3,4]'); -- Output: "[1,2,3,4]" (a JSON string with quotes)
  +----------------------+
  | TO_JSON('[1,2,3,4]') |
  +----------------------+
  | "[1,2,3,4]"          |
  +----------------------+
  ```

#### Numeric Parsing Rules

When parsing numeric values from a JSON string:

- If a number contains a decimal point, it will be converted to a JSON Double type:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key');
  +------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key')   |
  +------------------------------------------------------+
  | double                                               |
  +------------------------------------------------------+
  ```

- If a number is an integer, it will be stored as the smallest compatible integer type:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key');
  +---------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key')   |
  +---------------------------------------------------------+
  | int                                                     |
  +---------------------------------------------------------+
  ```

  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key');
  +-------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key')   |
  +-------------------------------------------------------------+
  | bigint                                                      |
  +-------------------------------------------------------------+
  ```

- If an integer exceeds the Int128 range, it will be stored as a double, which may result in precision loss:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key');
  +--------------------------------------------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key')   |
  +--------------------------------------------------------------------------------------------------+
  | double                                                                                           |
  +--------------------------------------------------------------------------------------------------+
  ```

#### Error Handling

When parsing a string to JSON:
- In strict mode (default), invalid JSON syntax will cause an error
- In non-strict mode, invalid JSON syntax will return NULL

```sql
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
+-----------------------------+
| CAST('{"invalid JSON' AS JSON) |
+-----------------------------+
| NULL                        |
+-----------------------------+

mysql> SET enable_strict_cast = true;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Failed to parse json string: {"invalid JSON, ...
```

### FROM Other Doris Types

The following Doris types can be directly cast to JSON without loss of precision:

| Doris Type | JSON Type |
|------------|-----------|
| BOOLEAN | Bool |
| TINYINT | Int8 |
| SMALLINT | Int16 |
| INT | Int32 |
| BIGINT | Int64 |
| LARGEINT | Int128 |
| FLOAT | Float |
| DOUBLE | Double |
| DECIMAL | Decimal |
| STRING | String |
| ARRAY | Array |
| STRUCT | Object |

#### Examples

```sql
-- Integer array to JSON
mysql> SELECT CAST(ARRAY(123,456,789) AS JSON);
+----------------------------------+
| CAST(ARRAY(123,456,789) AS JSON) |
+----------------------------------+
| [123,456,789]                    |
+----------------------------------+

-- Decimal array to JSON (preserves precision)
mysql> SELECT CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON);
+--------------------------------------------------------------------------+
| CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON)  |
+--------------------------------------------------------------------------+
| [12345678.123456780000000000,0.000000010000000000,12.000000000000000001] |
+--------------------------------------------------------------------------+
```

#### Types Not Directly Supported

Types not in the table above cannot be directly cast to JSON:

```sql
mysql> SELECT CAST(MAKEDATE(2021, 1) AS JSON);
ERROR 1105 (HY000): CAST AS JSONB can only be performed between JSONB, String, Number, Boolean, Array, Struct types. Got Date to JSONB
```

Solution: First cast to a compatible type, then to JSON:

```sql
mysql> SELECT CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON);
+---------------------------------------------------+
| CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON)   |
+---------------------------------------------------+
| 20210101                                          |
+---------------------------------------------------+
```

## Cast from JSON

:::caution Behavior Change
Before version 4.0, Doris had more relaxed requirements for JSON CAST behavior and didn't handle overflow situations properly.

Starting from version 4.0, overflow in JSON CAST will result in an error in strict mode or return null in non-strict mode.
:::

### TO Boolean

JSON Bool, Number, and String types can be cast to BOOLEAN:

```sql
-- From JSON Bool
mysql> SELECT CAST(CAST('true' AS JSON) AS BOOLEAN);
+---------------------------------------+
| CAST(CAST('true' AS JSON) AS BOOLEAN) |
+---------------------------------------+
|                                     1 |
+---------------------------------------+

-- From JSON Number
mysql> SELECT CAST(CAST('123' AS JSON) AS BOOLEAN);
+--------------------------------------+
| CAST(CAST('123' AS JSON) AS BOOLEAN) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+

-- From JSON String (must contain valid boolean representation)
mysql> SELECT CAST(TO_JSON('true') AS BOOLEAN);
+----------------------------------+
| CAST(TO_JSON('true') AS BOOLEAN) |
+----------------------------------+
|                                1 |
+----------------------------------+
```

### TO Numeric Types

JSON Bool, Number, and String types can be cast to numeric types (TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL):

```sql
-- From JSON Number to INT
mysql> SELECT CAST(CAST('123' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('123' AS JSON) AS INT) |
+----------------------------------+
|                              123 |
+----------------------------------+

-- From JSON Bool to numeric types
mysql> SELECT CAST(CAST('true' AS JSON) AS INT), CAST(CAST('false' AS JSON) AS DOUBLE);
+-----------------------------------+--------------------------------------+
| CAST(CAST('true' AS JSON) AS INT) | CAST(CAST('false' AS JSON) AS DOUBLE) |
+-----------------------------------+--------------------------------------+
|                                 1 |                                    0 |
+-----------------------------------+--------------------------------------+
```

Numeric overflow rules apply when casting to smaller types:

```sql
-- In strict mode, overflow causes error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
ERROR 1105 (HY000): Cannot cast from jsonb value type 12312312312312311 to doris type INT

-- In non-strict mode, overflow returns NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
+-----------------------------------------+
| CAST(TO_JSON(12312312312312311) AS INT) |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

### TO String

Any JSON type can be cast to STRING, which produces the JSON text representation:

```sql
mysql> SELECT CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING);
+----------------------------------------------------------+
| CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING) |
+----------------------------------------------------------+
| {"key1":"value1","key2":123}                             |
+----------------------------------------------------------+

mysql> SELECT CAST(CAST('true' AS JSON) AS STRING);
+--------------------------------------+
| CAST(CAST('true' AS JSON) AS STRING) |
+--------------------------------------+
| true                                 |
+--------------------------------------+
```

### TO Array

JSON Array and String types can be cast to Doris ARRAY types:

```sql
mysql> SELECT CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>);
+-------------------------------------------+
| CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>) |
+-------------------------------------------+
| [1, 2, 3]                                 |
+-------------------------------------------+

-- Type conversion within array elements
mysql> SELECT CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>);
+-------------------------------------------------+
| CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>) |
+-------------------------------------------------+
| [1, 2, 3]                                       |
+-------------------------------------------------+

-- Convert string to array
mysql> SELECT CAST(TO_JSON("['123','456']") AS ARRAY<INT>);
+----------------------------------------------+
| CAST(TO_JSON("['123','456']") AS ARRAY<INT>) |
+----------------------------------------------+
| [123, 456]                                   |
+----------------------------------------------+
```

Elements in arrays are converted individually following the standard cast rules:

```sql
-- In non-strict mode, invalid elements become NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
+---------------------------------------------------+
| CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>) |
+---------------------------------------------------+
| [10, 20, null]                                    |
+---------------------------------------------------+

-- In strict mode, invalid elements cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
ERROR 1105 (HY000): Cannot cast from jsonb value type 200 to doris type TINYINT
```

### TO Struct

JSON Object and String types can be cast to Doris STRUCT types:

```sql
mysql> SELECT CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>);
+------------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>) |
+------------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                   |
+------------------------------------------------------------------------------+

mysql> SELECT CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>);
+----------------------------------------------------------------------------+
| CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>) |
+----------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                 |
+----------------------------------------------------------------------------+
```

Fields in the struct are converted individually according to the specified types:

```sql
mysql> SELECT CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>);
+--------------------------------------------------------------------------------------------------------------------------+
| CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>) |
+--------------------------------------------------------------------------------------------------------------------------+
| {"key1":[123.45, 678.9], "key2":[12312313]}                                                                              |
+--------------------------------------------------------------------------------------------------------------------------+
```

The field count and names must match between JSON and struct definition:

```sql
-- In non-strict mode, mismatched fields return NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
+-------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>) |
+-------------------------------------------------------------------------+
| NULL                                                                    |
+-------------------------------------------------------------------------+

-- In strict mode, mismatched fields cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
ERROR 1105 (HY000): jsonb_value field size 2 is not equal to struct size 1
```

### JSON Null Handling

JSON null is distinct from SQL NULL:

- When a JSON field contains a null value, casting it to any Doris type produces a SQL NULL:

```sql
mysql> SELECT CAST(CAST('null' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('null' AS JSON) AS INT) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

## Type Conversion Summary

| JSON Type | Can Be Cast To |
|-----------|---------------|
| Bool | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| Null | (Always converted to SQL NULL) |
| Number | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| String | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING, ARRAY, STRUCT |
| Array | STRING, ARRAY |
| Object | STRING, STRUCT |

### keywords
JSON, JSONB, CAST, conversion, to_json
