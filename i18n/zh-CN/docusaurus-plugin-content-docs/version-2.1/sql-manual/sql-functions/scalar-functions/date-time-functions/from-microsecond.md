---
{
    "title": "FROM_MICROSECOND",
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

函数将输入的 Unix 时间戳（以微秒为单位）转换为 `DATETIME` 类型的日期时间值。

## 语法

```sql
FROM_MICROSECOND(<unix_timestamp>)
```

## 参数

| 参数                 | 说明                                                  |
|--------------------|-----------------------------------------------------|
| `<unix_timestamp>` | 必填，输入的 Unix 时间戳，表示从 1970-01-01 00:00:00 UTC 开始的微秒数。 |

## 返回值

- 返回一个 DATETIME 类型的值，表示输入的 Unix 时间戳对应的日期时间。
- 如果 `<unix_timestamp>` 为 NULL，函数返回 NULL。
- 如果 `<unix_timestamp>` 超出有效范围，函数返回错误。

## 举例

```sql
SELECT FROM_MICROSECOND(1700000000000000);
```

```text
+------------------------------------+
| from_microsecond(1700000000000000) |
+------------------------------------+
| 2023-11-15 06:13:20                |
+------------------------------------+
```