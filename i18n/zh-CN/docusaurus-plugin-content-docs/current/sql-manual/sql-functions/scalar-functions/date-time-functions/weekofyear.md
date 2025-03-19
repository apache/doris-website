---
{
    "title": "WEEKOFYEAR",
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

获得一年中的第几周

## 语法

`WEEKOFYEAR (<date>)`

## 参数

| 参数 | 说明 |
|--|--|
| `<date>` | 对应日期值，为 Date 或者 Datetime 类型 |

## 返回值

返回一年中的第几周

## 举例

```sql
SELECT WEEKOFYEAR('2019-06-25'),WEEKOFYEAR('2024-09-10 10:29:30');
```

```text
+-------------------------------------------------+----------------------------------------------------------+
| weekofyear(cast('2019-06-25' as DATETIMEV2(0))) | weekofyear(cast('2024-09-10 10:29:30' as DATETIMEV2(0))) |
+-------------------------------------------------+----------------------------------------------------------+
|                                              26 |                                                       37 |
+-------------------------------------------------+----------------------------------------------------------+
```
