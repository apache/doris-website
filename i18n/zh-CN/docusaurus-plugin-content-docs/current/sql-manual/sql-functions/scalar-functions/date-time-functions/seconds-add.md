---
{
    "title": "SECONDS_ADD",
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
函数用于在指定的日期时间值上增加或减少指定的秒数，并返回计算后的日期时间值

## 语法

```sql
SECONDS_ADD(<datetime>, <seconds>)
```
## 参数

| 参数           | 说明                                          |
|--------------|---------------------------------------------|
| `<datetime>` | 必填，输入的日期时间值，支持 DATETIME 或 DATE 类型           |
| `<seconds>`  | 必填，要增加或减少的秒数，支持整数类型（INT）。正数表示增加秒数，负数表示减少秒数。 |

## 返回值
- 返回一个日期时间值，类型与输入的 `<datetime>` 类型一致。
- 如果 `<datetime>` 为 NULL，函数返回 NULL。
- 如果 `<datetime>` 为非法日期（如 0000-00-00T00:00:00），函数返回 NULL。


## 举例
```
SELECT SECONDS_ADD('2025-01-23 12:34:56', 30),SECONDS_ADD('2025-01-23 12:34:56', -30);
```
```text
+---------------------------------------------------------------+----------------------------------------------------------------+
| seconds_add(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), 30) | seconds_add(cast('2025-01-23 12:34:56' as DATETIMEV2(0)), -30) |
+---------------------------------------------------------------+----------------------------------------------------------------+
| 2025-01-23 12:35:26                                           | 2025-01-23 12:34:26                                            |
+---------------------------------------------------------------+----------------------------------------------------------------+
```