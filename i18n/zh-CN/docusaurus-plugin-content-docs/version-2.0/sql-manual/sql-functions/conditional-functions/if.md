---
{
    "title": "IF",
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

如果表达式 `<condition>` 成立，则返回 `<value_true>`；否则返回 `<value_false_or_null>`。  
返回类型：`<value_true>` 表达式的结果类型。

## 语法

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```

## 参数

| 参数                     | 说明                              |
|-------------------------|----------------------------------|
| `<condition>`           | 用于判断的布尔表达式。             |
| `<value_true>`          | 当 `<condition>` 为真时返回的值。    |
| `<value_false_or_null>` | 当 `<condition>` 为假时返回的值。    |

## 举例

```sql
SELECT user_id, IF(user_id = 1, "true", "false") AS test_if FROM test;
```

```text
+---------+---------+
| user_id | test_if |
+---------+---------+
| 1       | true    |
| 2       | false   |
+---------+---------+
```