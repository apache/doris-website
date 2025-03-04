---
{
    "title": "MONTHS_DIFF",
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
`MONTHS_DIFF` 函数用于计算两个日期之间相差的月份数。该函数接受两个日期参数，返回第一个日期减去第二个日期后的相差月份数。

## 语法

```sql
MONTHS_DIFF(<enddate>, <startdate>)
```

## 参数

| 参数            | 说明                                                      |
|---------------|---------------------------------------------------------|
| `<enddate>`   | 结束日期，表示计算差值时的较晚日期。支持日期类型（如 `DATE`）或日期时间类型（如 `DATETIME`） |
| `<startdate>` | 开始日期，表示计算差值时的较早日期。支持日期类型（如 `DATE`）或日期时间类型（如 `DATETIME`） |

## 返回值

返回 `<enddate>` 减去 `<startdate>` 所得月份数
- 当`<enddate>`与`<startdate>`任意为 NULL，或者两者都为 NULL 时，返回 NULL


## 举例

```sql
select months_diff('2020-12-25','2020-10-25'),months_diff('2020-10-25 10:00:00','2020-12-25 11:00:00');
```

```text
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
| months_diff(cast('2020-12-25' as DATETIMEV2(0)), cast('2020-10-25' as DATETIMEV2(0))) | months_diff(cast('2020-10-25 10:00:00' as DATETIMEV2(0)), cast('2020-12-25 11:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
|                                                                                     2 |                                                                                                      -2 |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
```