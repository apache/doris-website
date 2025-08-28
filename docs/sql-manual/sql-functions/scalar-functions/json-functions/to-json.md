---
{
    "title": "TO_JSON",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Converts Doris internal data types to JSONB type. This function allows for converting compatible Doris data types into JSON representation without precision loss.

## Syntax

```sql
TO_JSON(value)
```

## Parameters

**value** - The value to be converted to JSONB type. The following Doris data types are supported:
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- Boolean type: BOOLEAN
- String type: STRING, VARCHAR, CHAR
- Complex types: ARRAY, STRUCT

Types not listed above (like DATE, DATETIME, etc.) are not supported directly and must be first converted to supported types (typically STRING).

## Return Value

Returns a value of JSONB type.

When the input `value` is SQL NULL, the function returns SQL NULL (not a JSON null value). When NULL values appear within arrays or structs, they are converted to JSON null values.

## Examples

### Basic scalar values

```sql
SELECT to_json(1), to_json(3.14), to_json("12345");
```

```text
+------------+---------------+------------------+
| to_json(1) | to_json(3.14) | to_json("12345") |
+------------+---------------+------------------+
| 1          | 3.14          | "12345"          |
+------------+---------------+------------------+
```

### Array conversion

```sql
SELECT to_json(array(array(1,2,3),array(4,5,6)));
```

```text
+-------------------------------------------+
| to_json(array(array(1,2,3),array(4,5,6))) |
+-------------------------------------------+
| [[1,2,3],[4,5,6]]                         |
+-------------------------------------------+
```

```sql
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### Accessing array elements in resulting JSON

```sql
SELECT json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]');
```

```text
+----------------------------------------------------------------------+
| json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]') |
+----------------------------------------------------------------------+
| 6                                                                    |
+----------------------------------------------------------------------+
```

### Struct conversion

```sql
SELECT to_json(struct(123,array(4,5,6),"789"));
```

```text
+------------------------------------------+
| to_json(struct(123,array(4,5,6),"789"))  |
+------------------------------------------+
| {"col1":123,"col2":[4,5,6],"col3":"789"} |
+------------------------------------------+
```

### Accessing object properties in resulting JSON

```sql
SELECT json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2");
```

```text
+----------------------------------------------------------------+
| json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2") |
+----------------------------------------------------------------+
| [4,5,6]                                                        |
+----------------------------------------------------------------+
```

### Handling NULL values

```sql
-- SQL NULL as input returns SQL NULL
SELECT to_json(null);
```

```text
+---------------+
| to_json(null) |
+---------------+
| NULL          |
+---------------+
```

```sql
-- NULL values within arrays become JSON null values
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### Unsupported Doris Types

```sql
SELECT to_json(makedate(2025,5));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(DATE)
```

```sql
-- Convert to string first and then apply to_json
SELECT to_json(cast(makedate(2025,5) as string));
```

```text
+-------------------------------------------+
| to_json(cast(makedate(2025,5) as string)) |
+-------------------------------------------+
| "2025-01-05"                              |
+-------------------------------------------+
```

## Notes

1. Some types do not have direct JSON mapping (like DATE). For these types, you need to convert them to STRING first, then use `TO_JSON`.

2. When converting Doris internal types to JSONB using `TO_JSON`, there is no precision loss, unlike when converting through text representation.

3. JSONB objects in Doris have a size limitation of 1,048,576 bytes (1 MB) by default, which can be adjusted through the BE configuration `string_type_length_soft_limit_bytes` up to 2,147,483,643 bytes (approximately 2 GB).

4. In Doris JSON objects, keys cannot exceed 255 bytes in length.
