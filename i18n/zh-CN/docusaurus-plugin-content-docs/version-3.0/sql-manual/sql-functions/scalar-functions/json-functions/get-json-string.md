---
{
    "title": "GET_JSON_STRING",
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

函数用于从 JSON 文档中提取一个字段的值，并将其转换为 `STRING` 类型。该函数返回指定路径上的字段值，如果该值无法转换为字符串，或者路径指向的字段不存在，则返回 `NULL`。

## 语法

` GET_JSON_STRING( <json_str>, <json_path>)`


## 必选参数

| 参数 | 描述 |
|------|------|
| `<json_str>` | 需要从中提取数据的 JSON 字符串。 |
| `<json_path>` | JSON 路径，指定字段的位置。路径可以使用点号表示法。 |


## 返回值
返回路径指向字段的 STRING 值。
如果指定路径没有找到对应的字段，或者字段值无法转换为 STRING 类型，返回 NULL。

## 注意事项

解析并获取 json 字符串内指定路径的字符串内容。
其中 `<json_path>` 必须以 $ 符号作为开头，使用 . 作为路径分割符。如果路径中包含 . ，则可以使用双引号包围。
使用 [ ] 表示数组下标，从 0 开始。
path 的内容不能包含 ", [ 和 ]。
如果 `<json_str>` 格式不对，或 `<json_path>` 格式不对，或无法找到匹配项，则返回 NULL。

另外，推荐使用jsonb类型和jsonb_extract_XXX函数实现同样的功能。

特殊情况处理如下：
- 如果 `<json_path>` 指定的字段在JSON中不存在，返回NULL
- 如果 `<json_path>` 指定的字段在JSON中的实际类型和json_extract_t指定的类型不一致，如果能无损转换成指定类型返回指定类型t，如果不能则返回NULL

## 示例

1. 获取 key 为 "k1" 的 value

```sql

SELECT get_json_string('{"k1":"v1", "k2":"v2"}', "$.k1");

```

```sql

+---------------------------------------------------+
| get_json_string('{"k1":"v1", "k2":"v2"}', '$.k1') |
+---------------------------------------------------+
| v1                                                |
+---------------------------------------------------+
```

2. 获取 key 为 "my.key" 的数组中第二个元素

```sql
SELECT get_json_string('{"k1":"v1", "my.key":["e1", "e2", "e3"]}', '$."my.key"[1]');
```
```sql
+------------------------------------------------------------------------------+
| get_json_string('{"k1":"v1", "my.key":["e1", "e2", "e3"]}', '$."my.key"[1]') |
+------------------------------------------------------------------------------+
| e2                                                                           |
+------------------------------------------------------------------------------+
```

3. 获取二级路径为 k1.key -> k2 的数组中，第一个元素
```sql
 SELECT get_json_string('{"k1.key":{"k2":["v1", "v2"]}}', '$."k1.key".k2[0]');
 ```

 ```sql

+-----------------------------------------------------------------------+
| get_json_string('{"k1.key":{"k2":["v1", "v2"]}}', '$."k1.key".k2[0]') |
+-----------------------------------------------------------------------+
| v1                                                                    |
+-----------------------------------------------------------------------+
```

4. 获取数组中，key 为 "k1" 的所有 value
```sql
SELECT get_json_string('[{"k1":"v1"}, {"k2":"v2"}, {"k1":"v3"}, {"k1":"v4"}]', '$.k1');
```

```sql

+---------------------------------------------------------------------------------+
| get_json_string('[{"k1":"v1"}, {"k2":"v2"}, {"k1":"v3"}, {"k1":"v4"}]', '$.k1') |
+---------------------------------------------------------------------------------+
| ["v1","v3","v4"]                                                                |
+---------------------------------------------------------------------------------+
```
