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

## 描述

生成一个包含制定元素的 json 数组，未指定时返回空数组

## 语法

```sql
JSON_ARRAY(<a>, ...)   
```

## 参数

| 参数 | 描述                                                         |
|------|------------------------------------------------------------|
| `<a>, ...` | 要包含在 JSON 数组中的元素。可以是单个或者多个任意类型的值，包括`NULL`。如果没有指定元素，则返回一个空数组。 |

## 返回值

返回一个包含指定元素的 JSON 数组。特殊情况：
* 如果指定的元素为`NULL`，则返回`NULL`。

## 示例

```sql
select json_array();
```

```text
+--------------+
| json_array() |
+--------------+
| []           |
+--------------+
```

```sql
select json_array(null);
```

```text
+--------------------+
| json_array('NULL') |
+--------------------+
| [NULL]             |
+--------------------+
```

```sql
SELECT json_array(1, "abc", NULL, TRUE, CURTIME());
```

```text
+-----------------------------------------------+
| json_array(1, 'abc', 'NULL', TRUE, curtime()) |
+-----------------------------------------------+
| [1, "abc", NULL, TRUE, "10:41:15"]            |
+-----------------------------------------------+
```

```sql
select json_array("a", null, "c");
```

```text
+------------------------------+
| json_array('a', 'NULL', 'c') |
+------------------------------+
| ["a", NULL, "c"]             |
+------------------------------+
```
