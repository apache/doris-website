---
{
    "title": "JSON_ARRAY",
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

## Feature
Generates a JSON array containing the specified elements. Returns an empty array if no arguments are provided.
## Syntax
```sql
JSON_ARRAY([<expression>, ...]) 
```
## Arguments
### Variable arguments: 
- `<expression>`: Elements to be included in the JSON array can be of a single type or multiple types, including NULL.
## Returns
[`Nullable(JSON)`](../../../basic-element/sql-data-types/semi-structured/JSON.md): Returns a JSON array containing the specified values. If no values are specified, an empty JSON array is returned.

## Usage notes
- Supports 0 to N parameters. When no parameters are provided, returns an empty JSON array.
- `<expression>` Supported Doris data type: 
    * Null
    * Boolean
    * String(char/varchar/string)
    * Numeric(tinyint, smallint, bigint, largeint, float, double, decimal)
    * Date/Time
    * Struct/Array/Map/JSON
- `<expression>` Limited support for semi-structured types. The semi-structured types must be convertible to JSON objects; otherwise, an error will be thrown.
- `LARGEINT` Limitation: If a LARGEINT type value falls outside the range `[-9223372036854775808, 18446744073709551615]`, 
  it will be forcibly converted to the double type, which may result in precision loss.
- `Decimal` will be converted to double, which may result in precision loss.
- `Date/Time` will be converted to string.

## Examples
1. Single par
    ```sql
    select json_array('item1');
    ```
    ```
    +---------------------+
    | json_array('item1') |
    +---------------------+
    | ["item1"]           |
    +---------------------+
    ```
2. NULL argument
    ```sql
    select json_array(null);
    ```
    ```
    +------------------+
    | json_array(null) |
    +------------------+
    | [null]           |
    +------------------+
    ```
3. Multiple arguments
    ```sql
    select json_array('item1', null, {"key": "map value"}, 123.3333, now(), 'duplicated', 'duplicated');
    ```
    ```
    +----------------------------------------------------------------------------------------------+
    | json_array('item1', null, {"key": "map value"}, 123.3333, now(), 'duplicated', 'duplicated') |
    +----------------------------------------------------------------------------------------------+
    | ["item1",null,{"key":"map value"},123.3333,"2025-06-03 15:39:09","duplicated","duplicated"]  |
    +----------------------------------------------------------------------------------------------+
    ```
    > The parameter supports any type and allows duplicate values.
4. No arguments
    ```sql
    select json_array();
    ```
    ```
    +--------------+
    | json_array() |
    +--------------+
    | []           |
    +--------------+
    ```
5. Semi-structured data types that cannot be converted to JSON
    ```sql
    select json_array('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = cannot cast MAP<TINYINT,VARCHAR(3)> to JSON
    ```
6. Cases of precision loss
    ```sql
    select json_array(18446744073709551615, 18446744073709551616, -9223372036854775808, -9223372036854775809);
    ```
    ```
    +----------------------------------------------------------------------------------------------------+
    | json_array(18446744073709551615, 18446744073709551616, -9223372036854775808, -9223372036854775809) |
    +----------------------------------------------------------------------------------------------------+
    | [18446744073709551615,1.84467440737096E19,-9223372036854775808,-9.22337203685478E18]               |
    +----------------------------------------------------------------------------------------------------+
    ```
    > 18446744073709551615 和 -9223372036854775808 刚好在限制范围内，所以没有丢失精度，18446744073709551616 和 -9223372036854775809 在限制范围外，精度丢失。
7. 日期被转换为字符串
    ```sql
    select json_array(cast('2025-06-10 16:47:44' as datetime), cast('2025-06-10 16:47:44' as date));
    ```
    ```
    +------------------------------------------------------------------------------------------+
    | json_array(cast('2025-06-10 16:47:44' as datetime), cast('2025-06-10 16:47:44' as date)) |
    +------------------------------------------------------------------------------------------+
    | ["2025-06-10 16:47:44","2025-06-10"]                                                     |
    +------------------------------------------------------------------------------------------+
    ```