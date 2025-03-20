---
{
    "title": "YEARWEEK",
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

返回指定日期的年份和星期数。mode 的值默认为 0。当日期所在的星期属于上一年时，返回的是上一年的年份和星期数；当日期所在的星期属于下一年时，返回的是下一年的年份，星期数为 1。

## 语法

```sql
YEARWEEK (<date>[, mode])
```

## 参数

| 参数 | 说明 |
|--|--|
| `<date>` | 对应日期值，为 Date 或者 Datetime 类型 |
| `<mode>` | 可选作用参数，用于定义周计算规则，默认值为 0 |

## 返回值

指定日期的年份和星期数。当日期所在的星期属于上一年时，返回的是上一年的年份和星期数；当日期所在的星期属于下一年时，返回的是下一年的年份，星期数为 1。mode 的值默认为 0，对应值的作用参见下面的表格：

|Mode |星期的第一天 |星期数的范围 |第一个星期的定义                             |
|:----|:------------|:------------|:--------------------------------------------|
|0    |星期日       |1-53         |这一年中的第一个星期日所在的星期             |
|1    |星期一       |1-53         |这一年的日期所占的天数大于等于 4 天的第一个星期|
|2    |星期日       |1-53         |这一年中的第一个星期日所在的星期             |
|3    |星期一       |1-53         |这一年的日期所占的天数大于等于 4 天的第一个星期|
|4    |星期日       |1-53         |这一年的日期所占的天数大于等于 4 天的第一个星期|
|5    |星期一       |1-53         |这一年中的第一个星期一所在的星期             |
|6    |星期日       |1-53         |这一年的日期所占的天数大于等于 4 天的第一个星期|
|7    |星期一       |1-53         |这一年中的第一个星期一所在的星期             |

## 举例

```sql
SELECT YEARWEEK('2020-1-1'),YEARWEEK('2022-7-1',1);
```

```text
+---------------------------------------------+-----------------------------------------+
| yearweek(cast('2020-1-1' as DATETIMEV2(0))) | yearweek(cast('2022-7-1' as DATEV2), 1) |
+---------------------------------------------+-----------------------------------------+
|                                      201952 |                                  202226 |
+---------------------------------------------+-----------------------------------------+
```
