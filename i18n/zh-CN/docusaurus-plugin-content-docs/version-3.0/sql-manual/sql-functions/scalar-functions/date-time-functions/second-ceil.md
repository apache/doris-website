---
{
    "title": "SECOND_CEIL",
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
函数用于将输入的日期时间值向上对齐到指定的秒周期边界，并返回对齐后的日期时间值。

## 语法

```sql
SECOND_CEIL(<datetime>[, <period>][, <origin_datetime>])
```

## 参数

| 参数                  | 说明                                                       |
|---------------------|----------------------------------------------------------|
| `<datetime>`        | 必填，输入的日期时间值，支持 DATETIME 类型。                              |
| `<period>`          | 可选，表示每个周期由多少秒组成，支持正整数类型（INT）。默认为 1 秒。                    |
| `<origin_datetime>` | 可选，对齐的时间起点，支持 DATETIME 类型。如果未指定，默认为 0001-01-01T00:00:00。 |

## 返回值
- 返回一个日期时间值，表示输入日期时间向上对齐后的结果。
- 如果输入的 `<datetime>` 为 NULL，返回 NULL。
- 如果输入的 `<datetime>` 为非法日期（如 0000-00-00T00:00:00），返回 NULL。

## 举例
只指定参数`<datetime>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56');
```
```text
+-----------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+-----------------------------------------------------------+
| 2025-01-23 12:34:56                                       |
+-----------------------------------------------------------+
```
指定参数 `<datetime>`， `<origin_datetime>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56', '2025-01-01 00:00:00');
```
```text
+---------------------------------------------------------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), cast('2025-01-01 00:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------------------------------------------------------+
| 2025-01-23 12:34:56                                                                                     |
+---------------------------------------------------------------------------------------------------------+
```
指定参数 `<datetime>`，`<period>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56', 5)
```
```text
+--------------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2025-01-23 12:35:00                                          |
+--------------------------------------------------------------+
```
同时指定   `<datetime>`，`<period>`，`<origin_datetime>`
```sql
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00');
```
```text
+-------------------------------------------------------------------------------------------------------------+
| second_ceil(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), 10, cast('2025-01-23 12:00:00' as DATETIMEV2(0))) |
+-------------------------------------------------------------------------------------------------------------+
| 2025-01-23 12:35:00                                                                                         |
+-------------------------------------------------------------------------------------------------------------+
```
