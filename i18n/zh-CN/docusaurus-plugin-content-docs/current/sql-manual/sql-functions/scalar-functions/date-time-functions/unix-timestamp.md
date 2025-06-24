---
{
    "title": "UNIX_TIMESTAMP",
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

将 Date 或者 Datetime 类型转化为 unix 时间戳（转化受时区影响）。如果没有参数，则是将当前的时间转化为时间戳。对于在 1970-01-01 00:00:00 之前或 2038-01-19 03:14:07 之后的时间，该函数将返回 0。

## 语法

```sql
UNIX_TIMESTAMP (<date>[, <fmt>])
```

## 参数

| 参数 | 说明 |
|--|--|
| `<date>` | 对应日期值，为 Date 或者 Datetime 类型 |
| `<fmt>` | 规定日期/时间的输出格式，格式请参阅[date_format](./date-format.md)函数的格式说明。|

## 返回值

Date 或者 Datetime 类型转化为 unix 的时间戳（转化受时区影响）。如果没有参数，则是将当前的时间转化为时间戳。对于在 1970-01-01 00:00:00 之前或 2038-01-19 03:14:07 之后的时间，该函数将返回 0。

## 举例

```sql
SELECT UNIX_TIMESTAMP(),UNIX_TIMESTAMP('2007-11-30'),UNIX_TIMESTAMP('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s');
```

```text
+------------------+-----------------------------------------------------+------------------------------------------------------------+
| unix_timestamp() | unix_timestamp(cast('2007-11-30' as DATETIMEV2(0))) | unix_timestamp('2007-11-30 10:30-19', '%Y-%m-%d %H:%i-%s') |
+------------------+-----------------------------------------------------+------------------------------------------------------------+
|       1742357008 |                                          1196352000 |                                          1196389819.000000 |
+------------------+-----------------------------------------------------+------------------------------------------------------------+
```
