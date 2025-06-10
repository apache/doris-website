---
{
    "title": "JSON_ARRAY",
    "language": "zh-CN"
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
# JSON_ARRAY
## 功能
生成一个包含指定元素的 json 数组，未传入参数时返回空数组。
## 语法
```sql
JSON_ARRAY([<expression>, ...]) 
```
## 参数
### 可变参数：
- `<expression>`: 要包含在 JSON 数组中的元素。可以是单个或者多种类型的值，包括NULL。
## 返回值
[`Nullable(JSON)`](../../../basic-element/sql-data-types/semi-structured/JSON.md)： 返回由参数列表组成的 JSON 数组。

## 使用说明
- 支持 0-N 个参数，当没有提供参数时，返回一个空的 JSON 数组。
- `<expression>` 支持的类型：
    * Null
    * Boolean
    * String(char/varchar/string)
    * Numeric(tinyint, smallint, bigint, largeint, float, double, decimal)
    * Date/Time
    * Struct/Array/Map/JSON
- `<expression>` 对半结构化类型的支持有限，需要半结构化类型的值能够转换成 JSON 对象，否则会报错。
- `LARGEINT` 限制：如果 `LARGEINT` 类型值不在 `[-9223372036854775808, 18446744073709551615]` 范围内，会被强制转换为 `double` 类型，可能会出现精度丢失的情况。
- `Decimal` 类型会被转换为 double，有可能导致精度丢失。
- `Date/Time` 会被转换成字符串。

## 示例
1. 单个参数
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
2. NULL 参数
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
3. 多个参数
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
    > 参数支持任意类型，支持重复的值。
4. 没有参数
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
5. 无法转换成 JSON 的半结构化类型数据
    ```sql
    select json_array('item1', map(123, 'abc'));
    ```
    ```
    ERROR 1105 (HY000): errCode = 2, detailMessage = cannot cast MAP<TINYINT,VARCHAR(3)> to JSON
    ```
6. 精度丢失的情况
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