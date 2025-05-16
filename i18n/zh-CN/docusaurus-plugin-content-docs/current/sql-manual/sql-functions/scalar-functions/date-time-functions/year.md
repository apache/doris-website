---
{
    "title": "YEAR",
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

返回日期值中的的年份，范围从 1000-9999

## 语法

```sql
YEAR(<date>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<date>` | 对应日期值，为 Date 或者 Datetime 类型 |

## 返回值

日期值中的的年份，范围从 1000-9999

## 举例

```sql
SELECT YEAR('1987-01-01'),YEAR('2013-02-11' 10:10:34);
```

```text
+-------------------------------------------+----------------------------------------------------+
| year(cast('1987-01-01' as DATETIMEV2(0))) | year(cast('2013-02-11 10:10:34' as DATETIMEV2(0))) |
+-------------------------------------------+----------------------------------------------------+
|                                      1987 |                                               2013 |
+-------------------------------------------+----------------------------------------------------+
```
