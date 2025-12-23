---
{
    "title": "SORT_JSON_OBJECT_KEYS",
    "language": "zh-CN",
    "description": "SORTJSONOBJECTKEYS 函数对 JSON 对象的键进行排序。该函数接受一个 JSON 对象作为输入，并返回一个新的 JSON 对象，其中键按字典顺序排序。"
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

`SORT_JSON_OBJECT_KEYS` 函数对 JSON 对象的键进行排序。该函数接受一个 JSON 对象作为输入，并返回一个新的 JSON 对象，其中键按字典顺序排序。

需要注意的是，根据 JSON 标准，JSON 对象是无序的集合。然而，此函数可以在需要确保键顺序一致时使用，例如在比较两个 JSON 对象是否包含相同内容时。

## 语法

```sql
SORT_JSON_OBJECT_KEYS(json_value)
```

## 别名

SORT_JSONB_OBJECT_KEYS

## 参数

**json_value** - 需要对键进行排序的 JSON 值。必须是 JSON 类型。

## 返回值

返回一个新的 JSON 对象，其中键按字典顺序排序。返回类型与输入的 JSON 类型相同。

当输入为 NULL 时，函数返回 NULL。

## 示例

### 基本键排序

```sql
SELECT sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json));
```

```text
+------------------------------------------------------------------+
| sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json)) |
+------------------------------------------------------------------+
| {"a":789,"b":123}                                                |
+------------------------------------------------------------------+
```

### 处理嵌套 JSON 数组

```sql
SELECT sort_json_object_keys(cast('[{"b":123,"b":456,"a":789},{"b":123},{"b":456},{"a":789}]' as json));
```

```text
+----------------------------------------------------------------------------------------------------+
| sort_json_object_keys(cast('[{"b":123,"b":456,"a":789} ,{"b":123},{"b":456},{"a":789} ]' as json)) |
+----------------------------------------------------------------------------------------------------+
| [{"a":789,"b":123},{"b":123},{"b":456},{"a":789}]                                                  |
+----------------------------------------------------------------------------------------------------+
```

### 处理 NULL 值

```sql
SELECT sort_json_object_keys(null);
```

```text
+-----------------------------+
| sort_json_object_keys(null) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

## 注意事项

1. `SORT_JSON_OBJECT_KEYS` 函数有一个别名 `SORT_JSONB_OBJECT_KEYS`，两者功能完全相同。

2. 此函数仅排序对象的键，而不会修改键对应的值。

3. 只会排序对象而不会排序数组，因为标准规定数组是一个有序的集合。

4. JSON 对象中的重复键会在转换为 Doris 的 JSON 类型时进行合并，仅保留第一个键值对。

5. 此函数主要用于确保 JSON 对象的键以一致的顺序呈现，便于比较或调试，因为默认情况下 Doris 的 JSON 类型不保证键的顺序。
