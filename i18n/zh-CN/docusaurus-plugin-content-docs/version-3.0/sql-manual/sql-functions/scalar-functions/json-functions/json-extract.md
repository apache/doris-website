---
{
    "title": "JSON_EXTRACT",
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

## 描述
JSON_EXTRACT 是一系列函数，从 JSON 类型的数据中提取 json_path 指定的字段，根据要提取的字段类型不同提供不同的系列函数。
* JSON_EXTRACT 对 VARCHAR 类型的 json string 返回 VARCHAR 类型
* JSON_EXTRACT_NO_QUOTES 对 VARCHAR 类型的 json string 返回 VARCHAR 类型, 如果 json 字段值为 string，则将去掉双引号。
* JSON_EXTRACT_ISNULL 返回是否为 json null 的 BOOLEAN 类型
* JSON_EXTRACT_BOOL 返回 BOOLEAN 类型
* JSON_EXTRACT_INT 返回 INT 类型
* JSON_EXTRACT_BIGINT 返回 BIGINT 类型
* JSON_EXTRACT_LARGEINT 返回 LARGEINT 类型
* JSON_EXTRACT_DOUBLE 返回 DOUBLE 类型
* JSON_EXTRACT_STRING 返回 STRING 类型

:::tip
提示
JSON_EXTRACT_NO_QUOTES 函数自 3.0.6 版本开始支持.
:::

## 别名
* JSONB_EXTRACT 同 `JSON_EXTRACT`
* JSON_EXTRACT_NO_QUOTES 同 `JSON_EXTRACT_NO_QUOTES`
* JSONB_EXTRACT_ISNULL 同 `JSON_EXTRACT_ISNULL`
* JSONB_EXTRACT_BOOL 同 `JSON_EXTRACT_BOOL`
* JSONB_EXTRACT_INT 同 `JSON_EXTRACT_INT`
* JSONB_EXTRACT_BIGINT 同 `JSON_EXTRACT_BIGINT`
* JSONB_EXTRACT_LARGEINT 同 `JSON_EXTRACT_LARGEINT`
* JSONB_EXTRACT_DOUBLE 同 `JSON_EXTRACT_DOUBLE`
* JSONB_EXTRACT_STRING 同 `JSON_EXTRACT_STRING`

## 语法
```sql
JSON_EXTRACT (<json_str>, <path>[, path] ...)
```
```sql
JSON_EXTRACT_NO_QUOTES (<json_str>, <path>[, path] ...)
```
```sql
JSON_EXTRACT_ISNULL (<json_str>, <path>)
```
```sql
JSON_EXTRACT_BOOL (<json_str>, <path>)
```
```sql
JSON_EXTRACT_INT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_BIGINT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_LARGEINT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_DOUBLE (<json_str>, <path>)
```
```sql
JSON_EXTRACT_STRING (<json_str>, <path>)
```
别名函数除函数名称之外，语法和用法与上述函数保持一致。

## 参数
| 参数           | 描述                          |
|--------------|-----------------------------|
| `<json_str>` | 要提取的 JSON 类型的参数或者字段         |
| `<path>`     | 要从目标 JSON 中提取目标元素的 JSON 路径。 |

`json_path` 的语法如下
* '$' 代表 json root
* '.k1' 代表 json object 中 key 为'k1'的元素
  - 如果 key 列值包含 ".", json_path 中需要用双引号，例如 `SELECT json_extract('{"k1.a":"abc","k2":300}', '$."k1.a"');`
* '[i]' 代表 json array 中下标为 i 的元素
  - 获取 json_array 的最后一个元素可以用'$[last]'，倒数第二个元素可以用'$[last-1]'，以此类推。

## 返回值
根据要提取的字段类型不同，返回目标 JSON 中 指定 JSON_PATH 的数据类型。特殊情况处理如下：
* 如果 json_path 指定的字段在 JSON 中不存在，返回 NULL
* 如果 json_path 指定的字段在 JSON 中的实际类型和 json_extract_t 指定的类型不一致，如果能无损转换成指定类型返回指定类型 t，如果不能则返回 NULL


## 示例

```sql
SELECT json_extract('{"id": 123, "name": "doris"}', '$.id');
```

```text
+------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.id') |
+------------------------------------------------------+
| 123                                                  |
+------------------------------------------------------+
```
```sql
SELECT json_extract('[1, 2, 3]', '$.[1]');
```
```text
+------------------------------------+
| json_extract('[1, 2, 3]', '$.[1]') |
+------------------------------------+
| 2                                  |
+------------------------------------+
```
```sql
SELECT json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]');
```
```text
+-------------------------------------------------------------------------------------------------------------------+
| json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]') |
+-------------------------------------------------------------------------------------------------------------------+
| ["v1",6.6,[1,2],2]                                                                                                |
+-------------------------------------------------------------------------------------------------------------------+
```
```sql
SELECT json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name');
```
```text
+-----------------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name') |
+-----------------------------------------------------------------+
| [null,"doris"]                                                  |
+-----------------------------------------------------------------+
```
```sql
SELECT json_extract_no_quotes('{"id": 123, "name": "doris"}', '$.name');
```
```text
+------------------------------------------------------------------+
| json_extract_no_quotes('{"id": 123, "name": "doris"}', '$.name') |
+------------------------------------------------------------------+
| doris                                                            |
+------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_ISNULL('{"id": 123, "name": "doris"}', '$.id');
```
```text
+----------------------------------------------------------------------------+
| jsonb_extract_isnull(cast('{"id": 123, "name": "doris"}' as JSON), '$.id') |
+----------------------------------------------------------------------------+
|                                                                          0 |
+----------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_BOOL('{"id": 123, "name": "NULL"}', '$.id');
```
```text
+-------------------------------------------------------------------------+
| jsonb_extract_bool(cast('{"id": 123, "name": "NULL"}' as JSON), '$.id') |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_INT('{"id": 123, "name": "NULL"}', '$.id');
```
```text
+------------------------------------------------------------------------+
| jsonb_extract_int(cast('{"id": 123, "name": "NULL"}' as JSON), '$.id') |
+------------------------------------------------------------------------+
|                                                                    123 |
+------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_INT('{"id": 123, "name": "doris"}', '$.name');
```
```text
+---------------------------------------------------------------------------+
| jsonb_extract_int(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+---------------------------------------------------------------------------+
|                                                                      NULL |
+---------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_STRING('{"id": 123, "name": "doris"}', '$.name');
```
```text
+------------------------------------------------------------------------------+
| jsonb_extract_string(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+------------------------------------------------------------------------------+
| doris                                                                        |
+------------------------------------------------------------------------------+
```

