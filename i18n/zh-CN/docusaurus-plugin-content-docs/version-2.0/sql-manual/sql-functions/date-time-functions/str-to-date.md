---
{
    "title": "STR_TO_DATE",
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

函数将输入的日期时间字符串根据指定的格式转换为 `DATETIME` 类型的值。

## 语法

```sql
STR_TO_DATE(<datetime_str>, <format>)
```

## 参数

| 参数               | 说明                                                           |
|------------------|--------------------------------------------------------------|
| `<datetime_str>` | 必填，输入的日期时间字符串，表示要转换的日期或时间。                                   |
| `<format>`       | 必填，指定的日期时间格式字符串，如 `%Y-%m-%d %H:%i:%s` 或 `yyy-MM-dd HH:mm:ss` |

## 返回值
- 返回一个 DATETIME 类型值，表示转换后的日期时间。
- 如果输入的 `<datetime_str>` 或 `<format>` 无效，函数返回 NULL。

## 举例

将常见的日期时间字符串转换为 DATETIME 类型
```sql
SELECT STR_TO_DATE('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s'),STR_TO_DATE('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss');
```
```text
+---------------------------------------------------------+-----------------------------------------------------------+
| str_to_date('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s') | str_to_date('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss') |
+---------------------------------------------------------+-----------------------------------------------------------+
| 2025-01-23 12:34:56.000000                              | 2025-01-23 12:34:56.000000                                |
+---------------------------------------------------------+-----------------------------------------------------------+
```
其他

```sql
select STR_TO_DATE('200442 Monday', '%X%V %W'),STR_TO_DATE('2023','%Y');
```
```text
+-----------------------------------------+---------------------------+
| str_to_date('200442 Monday', '%X%V %W') | str_to_date('2023', '%Y') |
+-----------------------------------------+---------------------------+
| 2004-10-18                              | 2023-01-01                |
+-----------------------------------------+---------------------------+
```