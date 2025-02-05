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

如果表达式 condition 成立，则返回结果 valueTrue；否则返回结果 valueFalseOrNull。  
返回类型：valueTrue 表达式结果的类型。

## 语法

```sql
IF(boolean condition, type valueTrue, type valueFalseOrNull)
```

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