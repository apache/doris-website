---
{
    "title": "SECONDS_DIFF",
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

函数用于计算两个日期时间值之间的时间差，以秒为单位返回差值。


## 语法

```sql
SECONDS_DIFF(<end_datetime>, <start_datetime>)
```

## 参数

| 参数                 | 说明                                 |
|--------------------|------------------------------------|
| `<end_datetime>`   | 必填，结束的日期时间值，支持 DATETIME 或 DATE 类型。 |
| `<start_datetime>` | 必填，起始的日期时间值，支持 DATETIME 或 DATE 类型。 |

## 返回值
- 返回一个整数，表示两个日期时间值之间的秒差：
  - 如果 `<end_datetime>` 晚于 `<start_datetime>`，返回正数。
  - 如果 `<end_datetime>` 早于 `<start_datetime>`，返回负数。
  - 如果 `<end_datetime>` 和 `<start_datetime>` 相等，返回 0。
- 如果任一参数为 NULL，函数返回 NULL。
- 如果输入的日期时间值为非法日期（如 0000-00-00T00:00:00），函数返回 NULL。

## 举例
```sql
SELECT SECONDS_DIFF('2025-01-23 12:35:56', '2025-01-23 12:34:56');
```
```text
+----------------------------------------------------------------------------------------------------------+
| seconds_diff(cast('2025-01-23 12:35:56' as DATETIMEV2(0)), cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                       60 |
```