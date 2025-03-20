---
{
    "title": "WEEKDAY",
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

返回日期的工作日索引值，即星期一为 0，星期二为 1，星期日为 6

## 语法

```sql
WEEKDAY (<date>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<date>` | 对应日期值，为 Date 或者 Datetime 类型或者可以 cast 为 Date 或者 Datetime 类型的数字 |

## 返回值

日期的工作日索引值，即星期一为 0，星期二为 1，星期日为 6

## 举例

```sql
SELECT WEEKDAY('2019-06-25'),WEEKDAY(cast(20190625 as date));
```

```text
+----------------------------------------------+-----------------------------------+
| weekday(cast('2019-06-25' as DATETIMEV2(0))) | weekday(cast(20190625 as DATEV2)) |
+----------------------------------------------+-----------------------------------+
|                                            1 |                                 1 |
+----------------------------------------------+-----------------------------------+
```

## 注意事项

注意 WEEKDAY 和 DAYOFWEEK 的区别：

```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```
