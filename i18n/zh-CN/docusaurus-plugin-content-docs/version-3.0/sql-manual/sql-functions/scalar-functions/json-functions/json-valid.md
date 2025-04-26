---
{
    "title": "JSON_VALID",
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

JSON_VALID 函数返回 0 或 1 以表明是否为有效的 JSON, 如果参数是 NULL 则返回 NULL。

## 语法

```sql
JSON_VALID( <str> )
```

## 必选参数
| 参数 | 描述 |
|------|------|
| `<str>` | 需要解析的 JSON 格式的输入字符串。 |

## 别名

- JSONB_VALID

## 举例

1. 正常 JSON 字符串

```sql
SELECT json_valid('{"k1":"v31","k2":300}');
+-------------------------------------+
| json_valid('{"k1":"v31","k2":300}') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+
1 row in set (0.02 sec)
```

2. 无效的 JSON 字符串

```sql
SELECT json_valid('invalid json');
+----------------------------+
| json_valid('invalid json') |
+----------------------------+
|                          0 |
+----------------------------+

```

3. NULL 参数

```sql
SELECT json_valid(NULL);
+------------------+
| json_valid(NULL) |
+------------------+
|             NULL |
+------------------+

```
