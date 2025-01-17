---
{
    "title": "NOT_NULL_OR_EMPTY",
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

`not_null_or_empty` 函数用于判断给定的值是否为非 NULL 且非空。如果输入值不为 NULL 且不为空，则返回 true，否则返回 false。

## 语法

`NOT_NULL_OR_EMPTY (<str>)`

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 字符串类型 |

## 返回值

如果字符串为空字符串或者NULL，返回false。否则，返回true。

## 举例

```sql
select not_null_or_empty(null);
```

```text
+-------------------------+
| not_null_or_empty(NULL) |
+-------------------------+
|                       0 |
+-------------------------+
```

```sql
select not_null_or_empty("");
```

```text
+-----------------------+
| not_null_or_empty('') |
+-----------------------+
|                     0 |
+-----------------------+
```

```
select not_null_or_empty("a");
```

```text
+------------------------+
| not_null_or_empty('a') |
+------------------------+
|                      1 |
+------------------------+
```