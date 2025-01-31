---
{
    "title": "DATE_SUB",
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

从日期减去指定的时间间隔。

## 别名

- days_sub
- date_sub
- subdate

## 语法

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<date>` | 合法的日期值 |
| `<expr>` | 希望减去的时间间隔 |
| `<time_unit>` | 枚举值：YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND |

## 返回值

返回计算后的日期。

## 举例

```sql
select date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY);
```

```text
+-------------------------------------------------+
| date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-11-28 23:59:59                             |
+-------------------------------------------------+
```