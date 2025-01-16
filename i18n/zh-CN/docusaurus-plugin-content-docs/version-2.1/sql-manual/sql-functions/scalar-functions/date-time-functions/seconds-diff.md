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
`SECONDS_DIFF` 函数用于计算两个日期时间值之间的时间差（以秒为单位）。该函数接受两个日期时间参数，返回第一个日期时间减去第二个日期时间后的差值。

## 语法

`seconds_diff(<end_datetime>, <start_datetime>)`

## 参数

| 参数	                | 说明      |
|--------------------|---------|
| `<end_datetime>`	  | 日期时间结束值 |
| `<start_datetime>` | 日期时间开始值 |

## 返回值
返回一个整数，表示两个日期时间之间的秒差：
- 当 `<end_datetime>` 晚于 `<start_datetime>` 时，返回正数。
- 当 `<end_datetime>` 早于 `<start_datetime>` 时，返回负数。
- 如果 `<end_datetime>` 和 `<start_datetime>` 相等，返回 0。
- 如果 `<end_datetime>` 或 `<start_datetime>` 为 NULL，返回 NULL。
- 如果 `<end_datetime>` 或 `<start_datetime>` 为非法日期值（如 0000-00-00 00:00:00），返回 NULL。

## 举例

```sql
select seconds_diff('2020-12-25 22:00:00','2020-12-25 21:00:00');
```
```text
+----------------------------------------------------------------------------------------------------------+
| seconds_diff(cast('2020-12-25 22:00:00' as DATETIMEV2(0)), cast('2020-12-25 21:00:00' as DATETIMEV2(0))) |
+----------------------------------------------------------------------------------------------------------+
|                                                                                                     3600 |
+----------------------------------------------------------------------------------------------------------+
```