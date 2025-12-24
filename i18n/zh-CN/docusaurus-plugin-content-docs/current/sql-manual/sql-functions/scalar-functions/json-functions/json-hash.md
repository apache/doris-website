---
{
    "title": "JSON_HASH",
    "language": "zh-CN",
    "description": "JSONHASH 函数用于计算一个 JSON 对象的哈希值。该函数接受一个 JSON 类型的参数，并返回一个 BIGINT 类型的哈希值。"
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

`JSON_HASH` 函数用于计算一个 JSON 对象的哈希值。该函数接受一个 JSON 类型的参数，并返回一个 BIGINT 类型的哈希值。

在计算 JSON 对象的哈希值时，函数会对 JSON 对象的键进行排序后再计算哈希值，这样可以确保相同内容但键顺序不同的 JSON 对象会产生相同的哈希值。

## 语法

```sql
JSON_HASH(json_value)
```

## 别名

`JSONB_HASH`

## 参数

**json_value** - 需要计算哈希值的 JSON 值。必须是 JSON 类型。

## 返回值

返回一个 BIGINT 类型的哈希值。

当输入为 NULL 时，函数返回 NULL。

## 用途

由于 JSON 标准规定 JSON 对象的键值对是无序的，为了确保不同系统间传递 JSON 值时能够一致地识别相同内容的 JSON 对象，`JSON_HASH` 函数会在计算哈希值前对 JSON 对象的键值对进行排序，类似于调用 `SORT_JSON_OBJECT_KEYS` 函数。

此外，对于 JSON 对象中的重复键，尽管 Doris 允许这种情况存在，但计算哈希值时会只考虑第一个出现的键值对，与实际应用场景更加匹配。

## 示例

1. 基本哈希值计算
```sql
SELECT json_hash(cast('123' as json));
```
```text
+--------------------------------+
| json_hash(cast('123' as json)) |
+--------------------------------+
|            5279066513252500087 |
+--------------------------------+
```

2. 验证别名函数
```sql
SELECT json_hash(cast('123' as json)), jsonb_hash(cast('123' as json));
```
```text
+--------------------------------+---------------------------------+
| json_hash(cast('123' as json)) | jsonb_hash(cast('123' as json)) |
+--------------------------------+---------------------------------+
|            5279066513252500087 |             5279066513252500087 |
+--------------------------------+---------------------------------+
```
可以看到 `json_hash` 和 `jsonb_hash` 两个函数对相同输入产生相同的哈希值，它们是完全等价的别名函数。

3. 键排序验证
```sql
SELECT 
    json_hash(cast('{"a":123, "b":456}' as json)), 
    json_hash(cast('{"b":456, "a":123}' as json));
```
```text
+-----------------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123, "b":456}' as json)) | json_hash(cast('{"b":456, "a":123}' as json)) |
+-----------------------------------------------+-----------------------------------------------+
|                             82454694884268544 |                             82454694884268544 |
+-----------------------------------------------+-----------------------------------------------+
```
`json_hash` 函数都会生成相同的哈希值。这是因为函数在计算哈希值前会先对键进行排序。

4. 处理重复键
```sql
SELECT 
    json_hash(cast('{"a":123}' as json)), 
    json_hash(cast('{"a":456}' as json)), 
    json_hash(cast('{"a":123, "a":456}' as json));
```
```text
+--------------------------------------+--------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123}' as json)) | json_hash(cast('{"a":456}' as json)) | json_hash(cast('{"a":123, "a":456}' as json)) |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
|                 -7416836614234106918 |                 -3126362109586887012 |                          -7416836614234106918 |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
```
当 JSON 对象包含重复键时（`{"a":123, "a":456}`），`json_hash` 函数只考虑第一个出现的键值对进行哈希计算。可以看到含重复键的 JSON 对象的哈希值与只包含第一个键值对 `{"a":123}` 的哈希值相同。

5. 不同数值类型的处理
```sql
SELECT 
    json_hash(to_json(cast('123' as int))), 
    json_hash(to_json(cast('123' as tinyint)));
```
```text
+----------------------------------------+--------------------------------------------+
| json_hash(to_json(cast('123' as int))) | json_hash(to_json(cast('123' as tinyint))) |
+----------------------------------------+--------------------------------------------+
|                    7882559133986259892 |                        5279066513252500087 |
+----------------------------------------+--------------------------------------------+
```
相同的数值 123，当以不同类型（int 和 tinyint）存储在 JSON 中时，会产生不同的哈希值。这是因为 Doris 的 JSON 实现保留了数据类型信息，而哈希计算会考虑这些类型差异。

6. 使用 normalize_json_numbers_to_double 统一数值类型
```sql
SELECT 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))), 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint))));
```
```text
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
| json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))) | json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint)))) |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
|                                                      4028523408277343359 |                                                          4028523408277343359 |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
```
这个例子演示了如何解决上述问题：使用 `normalize_json_numbers_to_double` 函数先将所有数值转换为双精度浮点数类型，然后再计算哈希值。这样，不管原始数值是什么类型，转换后都会得到相同的哈希值，确保了一致性。

7. 处理 NULL 值
```sql
SELECT json_hash(null);
```
```text
+-----------------+
| json_hash(null) |
+-----------------+
|            NULL |
+-----------------+
```

## 注意事项

1. `JSON_HASH` 函数有一个别名 `JSONB_HASH`，两者功能完全相同。

2. 此函数在计算哈希值前会对 JSON 对象的键进行排序，类似于调用 `SORT_JSON_OBJECT_KEYS` 函数。

3. 对于 JSON 对象中的重复键，函数只会考虑第一个出现的键值对进行哈希值计算。

4. 由于 Doris 的 JSON 中的数值可能以不同的存储类型（如 int、tinyint、bigint、float、double、decimal）存在，相同数值但不同类型可能会产生不同的哈希值。如果需要确保一致性，可以使用 `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 函数将所有数值转换为统一类型后再计算哈希值。

5. 当通过文本解析方式（如使用 `CAST` 将字符串转为 JSON）创建 JSON 对象时，Doris 会自动选择合适的数值类型存储，通常情况下不需要担心数值类型不一致的问题。

6. 需要注意的是，如果不是手动通过 `cast/to_json` 的方式转换成 JSON 对象，而是使用文本转换（从字符串解析 JSON 对象），那么 Doris 只会把 "123" 存储为一个 tinyint 类型的 JSON 对象，不会出现 "123" 既存储为 int 类型，又存储为 tinyint 类型的情况。
