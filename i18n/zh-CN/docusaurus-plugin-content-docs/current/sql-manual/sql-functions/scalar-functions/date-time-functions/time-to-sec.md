---
{
    "title": "TIME_TO_SEC",
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
函数将输入的 `TIME` 或 `DATETIME` 类型的值转换为以秒为单位的总时间。如果输入为 `DATETIME` 类型，函数会自动提取时间部分（`HH:MM:SS`）。

## 语法

```sql
TIME_TO_SEC(<time>)
```

## 参数

| 参数       | 说明                                                          |
|----------|-------------------------------------------------------------|
| `<time>` | 必填，支持 TIME 或 DATETIME 类型的值。如果输入为 DATETIME 类型，函数会提取时间部分进行计算。 |

## 返回值
- 返回一个整数，表示输入时间值转换为总秒数的结果。
- 如果输入的 `<time>` 为 NULL，函数返回 NULL。

## 举例

```sql
SELECT TIME_TO_SEC('16:32:18'),TIME_TO_SEC('2025-01-01 16:32:18');
```
```text
+---------------------------------------+--------------------------------------------------+
| time_to_sec(cast('16:32:18' as TIME)) | time_to_sec(cast('2025-01-01 16:32:18' as TIME)) |
+---------------------------------------+--------------------------------------------------+
|                                 59538 |                                            59538 |
+---------------------------------------+--------------------------------------------------+
```