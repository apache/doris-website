---
{
    "title": "MONTHS_SUB",
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
MONTHS_SUB 函数用于对指定日期添加或减去指定的月份数，并返回计算后的新日期

## 语法

`MONTHS_SUB(<datetime/date>,  <nums>)`

## 参数

| 参数                | 说明            |
|-------------------|---------------|
| `<datetime/date>` | 需要被计算加减月份的日期值 |
| `<nums>`          | 需要加减的月份数      |

## 返回值
返回值与输入的 <datetime/date> 类型一致
特殊情况：
- <datetime/date> 输入为 0000-00-00 或 0000-00-00 00:00:00 时，返回 NULL
- <datetime/date> 输入为 NULL 时，返回 NULL
- 如果输入为 months_sub("9999-12-31",-1)，将返回 NULL


## 举例

``` sql
select months_sub("2020-01-31 02:02:02", 1),months_sub("2020-01-31", 1),months_sub("2020-01-31", -1);
```
```text
+-------------------------------------------------------------+---------------------------------------------+----------------------------------------------+
| months_sub(cast('2020-01-31 02:02:02' as DATETIMEV2(0)), 1) | months_sub(cast('2020-01-31' as DATEV2), 1) | months_sub(cast('2020-01-31' as DATEV2), -1) |
+-------------------------------------------------------------+---------------------------------------------+----------------------------------------------+
| 2019-12-31 02:02:02                                         | 2019-12-31                                  | 2020-02-29                                   |
+-------------------------------------------------------------+---------------------------------------------+----------------------------------------------+
```
