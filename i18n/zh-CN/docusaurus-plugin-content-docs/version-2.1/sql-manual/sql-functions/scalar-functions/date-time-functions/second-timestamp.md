---
{
    "title": "SECOND_TIMESTAMP",
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
函数将输入的 `DATETIME` 值转换为从 `1970-01-01 00:00:00 UTC` 开始的 Unix 时间戳（以秒为单位）。

## 语法

```sql
SECOND_TIMESTAMP(<datetime>)
```

## 参数

| 参数           | 说明                                      |
|--------------|-----------------------------------------|
| `<datetime>` | 必填，输入的 DATETIME 值，表示要转换为 Unix 时间戳的日期时间。 |

## 返回值

- 返回一个整数，表示输入日期时间对应的 Unix 时间戳（以秒为单位）。
- 如果 `<datetime>` 为 NULL，函数返回 NULL。
- 如果 `<datetime>` 超出有效范围，函数可能返回错误或异常值。

## 举例

```sql
SELECT SECOND_TIMESTAMP('2025-01-23 12:34:56');
```

```text
+----------------------------------------------------------------+
| second_timestamp(cast('2025-01-23 12:34:56' as DATETIMEV2(0))) |
+----------------------------------------------------------------+
|                                                     1737606896 |
+----------------------------------------------------------------+
```