---
{
    "title": "NEXT_DAY",
    "language": "cn"
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
> 从版本 2.1.10 开始支持

NEXT_DAY 函数用于返回给定日期之后第一个匹配指定星期几的日期。

## 语法

```sql
NEXT_DAY(<datetime/date>, <day_of_week>)
```

## 参数

| 参数              | 描述                                                         |
|-------------------|--------------------------------------------------------------|
| `<datetime/date>` | 用于查找下一个星期几的日期。                                 |
| `<day_of_week>`   | 用于标识星期几的字符串表达式。                               |

`<day_of_week>` 必须是以下值之一（不区分大小写）：
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## 返回值
无论输入是 DATETIME 还是 DATE 类型，都返回 DATE 类型的值。

特殊情况：
- 如果 `<datetime/date>` 输入为 NULL，函数返回 NULL。
- 如果输入是 NEXT_DAY("9999-12-31 12:00:00", `<day_of_week>`)，函数将返回与输入相同的值。

## 示例

``` sql
select next_day("2020-01-31 02:02:02", "MONDAY"),next_day("2020-01-31", "MONDAY");
```
```text
+--------------------------------------------+-----------------------------------+
| next_day("2020-01-31 02:02:02", "MONDAY")  | next_day("2020-01-31", "MONDAY")  |
+--------------------------------------------+-----------------------------------+
| 2020-02-03                                 | 2020-02-03                        |
+--------------------------------------------+-----------------------------------+
``` 