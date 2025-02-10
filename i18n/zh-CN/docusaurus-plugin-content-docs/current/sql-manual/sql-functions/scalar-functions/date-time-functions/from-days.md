---
{
    "title": "FROM_DAYS",
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

给定一个天数，返回一个 DATE。

- 注意，为了和 mysql 保持一致的行为，不存在 0000-02-29 这个日期。

## 语法

```sql
FROM_DAYS(<dt>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<dt>` | 天数 |

## 返回值

返回对应天数的日期。

## 举例

```sql
select from_days(730669),from_days(5),from_days(59), from_days(60);
```

```text
+-------------------+--------------+---------------+---------------+
| from_days(730669) | from_days(5) | from_days(59) | from_days(60) |
+-------------------+--------------+---------------+---------------+
| 2000-07-03        | 0000-01-05   | 0000-02-28    | 0000-03-01    |
+-------------------+--------------+---------------+---------------+
```