---
{
    "title": "YEARS_ADD",
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

对指定日期时间增加指定的年数，并返回计算后的新日期时间

## 语法

```sql
YEARS_ADD(<datetime/date>, <nums>)
```

## 参数

| 参数                | 说明            |
|-------------------|---------------|
| `<datetime/date>` | 需要被计算的日期时间值，类型为 `DATETIME` 或 `DATE` |
| `<nums>`          | 需要增加的年数 |

## 返回值

返回计算后的新日期

返回值与输入的 <datetime/date> 类型一致。

特殊情况：

- <datetime/date> 输入为 NULL 时，返回 NULL
- 如果计算结果越界，SQL 执行将会报错。在 `where` 条件中使用，避免报错可以改写为作差形式： [`TIMESTAMPDIFF`](./timestampdiff)

## 举例

```sql
select years_add('2010-11-30 23:59:59', 2);
```

```text
+-------------------------------------+
| years_add('2010-11-30 23:59:59', 2) |
+-------------------------------------+
| 2012-11-30 23:59:59                 |
+-------------------------------------+
```

```sql
select years_add('9999-12-31 23:59:59', 2);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [E-218] Operation years_add of 9999-12-31 23:59:59, 2 out of range
```
