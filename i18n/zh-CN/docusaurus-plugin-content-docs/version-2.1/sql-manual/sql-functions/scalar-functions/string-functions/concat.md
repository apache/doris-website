---
{
    "title": "CONCAT",
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

将多个字符串连接起来。特殊情况：

- 如果参数中任意一个值是 NULL，那么返回的结果就是 NULL


## 语法

```sql
CONCAT ( <expr> [ , <expr> ... ] )
```

## 参数

| 参数       | 说明           |
|----------|--------------|
| `<expr>` | 需要被连接到一起的字符串 |

## 返回值

参数列表 `<expr>` 连接到一起的字符串。特殊情况：

- 如果参数中任意一个值是 NULL，那么返回的结果就是 NULL

## 举例

```sql
SELECT  CONCAT("a", "b"),CONCAT("a", "b", "c"),CONCAT("a", null, "c")
```

```text
+------------------+-----------------------+------------------------+
| concat('a', 'b') | concat('a', 'b', 'c') | concat('a', NULL, 'c') |
+------------------+-----------------------+------------------------+
| ab               | abc                   | NULL                   |
+------------------+-----------------------+------------------------+
```