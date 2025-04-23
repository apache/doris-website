---
{
  "title": "MONTH_CEIL",
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

将日期时间值向上取整到最近的指定月份周期。如果指定了起始时间（origin），则以该时间为基准计算周期。

## 语法

```sql
MONTH_CEIL(<datetime>)
MONTH_CEIL(<datetime>, <origin>)
MONTH_CEIL(<datetime>, <period>)
MONTH_CEIL(<datetime>, <period>, <origin>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<datetime>` | 需要向上取整的日期时间值，类型为 DATETIME 或 DATETIMEV2 |
| `<period>` | 月份周期值，类型为 INT，表示每个周期包含的月数 |
| `<origin>` | 周期的起始时间点，类型为 DATETIME 或 DATETIMEV2，默认值为 0001-01-01 00:00:00 |

## 返回值

返回类型为 DATETIME，表示向上取整后的日期时间值。结果的时间部分将被设置为 00:00:00。

## 举例

```sql
SELECT MONTH_CEIL("2023-07-13 22:28:18", 5);
```

```text
+-------------------------------------------------------------+
| month_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+-------------------------------------------------------------+
| 2023-10-01 00:00:00                                         |
+-------------------------------------------------------------+
```

注意：
- 不指定 period 时，默认以 1 个月为周期
- period 必须为正整数
- 结果总是向未来时间取整
- 返回值的时间部分总是 00:00:00

## 最佳实践

还可参阅 [date_ceil](./date-ceil)
