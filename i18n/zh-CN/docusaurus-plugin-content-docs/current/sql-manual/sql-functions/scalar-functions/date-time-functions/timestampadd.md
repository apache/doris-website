---
{
    "title": "TIMESTAMPADD",
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

`timestampadd`  函数用于将指定的时间单位（如年、月、日、小时、分钟、秒等）添加到一个日期上。这个函数通常用于日期和时间的计算。

## 语法

`TIMESTAMPADD(<unit>, <interval>, <datetime_expr>)`

## 参数

| 参数 | 说明                                                                |
| -- |-------------------------------------------------------------------|
| `unit` | 时间单位，指定要添加的时间单位，常见的值有 SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR |
|`interval`| 要添加的时间间隔，通常是一个整数，可以是正数或负数，表示添加或减去的时间长度                            |
| `datetime_expr` | 合法的目标日期，为 `DATETIME` 类型                                             |

## 返回值

返回新的日期时间，表示在指定时间点上添加或减去指定时间间隔后的结果。

如果输入的目标日期不合法，则返回 `NULL`。

## 举例

```sql
SELECT TIMESTAMPADD(MINUTE,1,'2019-01-02');
```

```text
+------------------------------------------------+
| timestampadd(MINUTE, 1, '2019-01-02 00:00:00') |
+------------------------------------------------+
| 2019-01-02 00:01:00                            |
+------------------------------------------------+
```

```sql
SELECT TIMESTAMPADD(WEEK,1,'2019-01-02');
```

```text
+----------------------------------------------+
| timestampadd(WEEK, 1, '2019-01-02 00:00:00') |
+----------------------------------------------+
| 2019-01-09 00:00:00                          |
+----------------------------------------------+
```

```sql
SELECT TIMESTAMPADD(WEEK,1,'1196440219');
```

```sql
+------------------------------------------------------------+
| timestampadd(WEEK, 1, CAST('1196440219' AS datetimev2(6))) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```
