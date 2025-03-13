---
{
    "title": "WEEK_CEIL",
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

将日期时间值向上舍入到最接近的指定周间隔。如果提供了起始时间（origin），则使用该时间作为计算间隔的参考点。

## 语法

```sql
WEEK_CEIL(<datetime>)
WEEK_CEIL(<datetime>, <origin>)
WEEK_CEIL(<datetime>, <period>)
WEEK_CEIL(<datetime>, <period>, <origin>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<datetime>` | 要向上舍入的日期时间值，类型为 DATETIME 或 DATETIMEV2 |
| `<period>` | 周间隔值，类型为 INT，表示每个间隔的周数 |
| `<origin>` | 间隔的起始点，类型为 DATETIME 或 DATETIMEV2；默认为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，表示向上舍入后的日期时间值。结果的时间部分将被设置为 00:00:00。

**注意：**
- 如果未指定周期，则默认为 1 周间隔。
- 周期必须是正整数。
- 结果总是向上舍入到未来的时间。
- 返回值的时间部分始终设置为 00:00:00。

## 举例

```sql
SELECT WEEK_CEIL('2023-07-13 22:28:18', 2);
```

```text
+-----------------------------------------------------------+
| week_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 2) |
+-----------------------------------------------------------+
| 2023-07-17 00:00:00                                       |
+-----------------------------------------------------------+
```
