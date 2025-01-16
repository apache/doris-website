---
{
    "title": "TIMEDIFF",
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
`TIMEDIFF` 函数用于计算两个日期时间值之间的差值。该函数接受两个参数，并返回其差值，结果为 `TIME` 类型。

## 语法

`TIMEDIFF(<end_datetime>, <start_datetime>)`

## 参数

| 参数              | 说明                          |
|-------------------|-------------------------------|
| `<end_datetime>`      | 结束的时间或日期时间值        |
| `<start_datetime>`    | 开始的时间或日期时间值        |

## 返回值
返回一个 `TIME` 类型的值，表示两个输入之间的时间差：
- 当 `<end_datetime>` 晚于 `<start_datetime>` 时，返回正的时间差。
- 当 `<end_datetime>` 早于 `<start_datetime>` 时，返回负的时间差。
- 当 `<end_datetime>` 和 `<start_datetime>` 相等时，返回 `00:00:00`。
- 如果 `<end_datetime>` 或 `<start_datetime>` 为 `NULL`，函数返回 `NULL`。
- 如果 `<end_datetime>` 或 `<start_datetime>` 为非法时间或日期时间值（如 `0000-00-00 00:00:00`），函数返回 `NULL`。

## 举例

```sql
SELECT TIMEDIFF('2024-07-20 16:59:30','2024-07-11 16:35:21');
```

```text
+------------------------------------------------------------------------------------------------------+
| timediff(cast('2024-07-20 16:59:30' as DATETIMEV2(0)), cast('2024-07-11 16:35:21' as DATETIMEV2(0))) |
+------------------------------------------------------------------------------------------------------+
| 216:24:09                                                                                            |
+------------------------------------------------------------------------------------------------------+
```
