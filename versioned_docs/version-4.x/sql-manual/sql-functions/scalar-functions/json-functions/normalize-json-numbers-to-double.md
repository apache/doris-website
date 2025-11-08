---
{
    "title": "NORMALIZE_JSON_NUMBERS_TO_DOUBLE",
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

The `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` function converts all numeric values in a JSON to double-precision floating-point type. This function takes a JSON value as input and returns a new JSON value with all numeric types converted to double-precision values.

## Syntax

```sql
NORMALIZE_JSON_NUMBERS_TO_DOUBLE(json_value)
```

## Alias

`NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`

## Parameters

**json_value** - The JSON value to be processed. Must be of JSON type.

## Return Value

Returns a new JSON value with all numeric types converted to double-precision floating-point (double) type.

When the input is NULL, the function returns NULL.

## Purpose

Since the JSON standard does not specify the underlying type for Number, most systems implement Number type based on IEEE 754-2008 binary 64-bit (double-precision) floating-point numbers (such as the double type in C++).
To ensure data accuracy, Doris has extended the Number type with more refined types, supporting more precise types like Int128 and DECIMAL.
However, this can lead to differences when compared to other systems.

For example, for the following JSON string:
```text
'{"abc": 18446744073709551616}'
```

In systems that use Double as the underlying type for JSON Numbers, such as MySQL, you would get:
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc": 1.8446744073709552e19}                |
+-----------------------------------------------+
```

But since Doris's JSON Number has types with higher precision, it would return:
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc":18446744073709551616}                  |
+-----------------------------------------------+
```

To be compatible with other systems, you can use `NORMALIZE_JSON_NUMBERS_TO_DOUBLE`:
```text
+---------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"abc": 18446744073709551616}' as json)) |
+---------------------------------------------------------------------------------+
| {"abc":1.8446744073709552e+19}                                                  |
+---------------------------------------------------------------------------------+
```

## Examples

### Basic Number Conversion

```sql
SELECT normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json));
```

```text
+---------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json)) |
+---------------------------------------------------------------------------------------------+
| {"b":1.2345678901234568e+18,"b":456,"a":789}                                                |
+---------------------------------------------------------------------------------------------+
```

### Processing Nested JSON

```sql
SELECT normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json));
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json)) |
+-----------------------------------------------------------------------------------------------------------------------------+
| {"object":{"int":123,"bigint":1.2345678901234568e+18},"array":[123,456,789]}                                                |
+-----------------------------------------------------------------------------------------------------------------------------+
```

### Processing NULL Values

```sql
SELECT normalize_json_numbers_to_double(null);
```

```text
+----------------------------------------+
| normalize_json_numbers_to_double(null) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```

## Notes

1. The `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` function has an alias `NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`, both functions have identical functionality.

2. This function converts all numeric types in JSON (including integers, floating-point numbers, and DECIMALs) to double-precision floating-point representation.

3. For particularly large integers, conversion to double-precision floating-point may result in precision loss, as shown in the example where 1234567890123456789 is converted to 1.2345678901234568e+18.

4. This function does not alter the structure of JSON, it only modifies the numeric representations within it.
