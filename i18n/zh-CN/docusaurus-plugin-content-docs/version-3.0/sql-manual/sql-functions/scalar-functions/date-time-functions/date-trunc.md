---
{
    "title": "DATE_TRUNC",
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

将 datetime 按照指定的时间单位截断。

## 语法

```sql
DATE_TRUNC(<datetime>, <time_unit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<datetime>` | 合法的日期表达式 |
| `<time_unit>` | 希望截断的时间间隔，可选的值如下：[`second`,`minute`,`hour`,`day`,`week`,`month`,`quarter`,`year`] |

## 返回值

按照指定的时间单位截断的时间

## 举例

```sql
select date_trunc('2010-12-02 19:28:30', 'second');
```

```text
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'second')     |
+-------------------------------------------------+
| 2010-12-02 19:28:30                             |
+-------------------------------------------------+
```

```sql
select date_trunc('2010-12-02 19:28:30', 'minute');
```

```text
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'minute')     |
+-------------------------------------------------+
| 2010-12-02 19:28:00                             |
+-------------------------------------------------+
```

```sql
select date_trunc('2010-12-02 19:28:30', 'hour');
```

```text
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'hour')       |
+-------------------------------------------------+
| 2010-12-02 19:00:00                             |
+-------------------------------------------------+
```

```sql
select date_trunc('2010-12-02 19:28:30', 'day');
```

```text
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'day')        |
+-------------------------------------------------+
| 2010-12-02 00:00:00                             |
+-------------------------------------------------+
```

```sql
select date_trunc('2023-4-05 19:28:30', 'week');
```

```text
+-------------------------------------------+
| date_trunc('2023-04-05 19:28:30', 'week') |
+-------------------------------------------+
| 2023-04-03 00:00:00                       |
+-------------------------------------------+
```

```sql
select date_trunc('2010-12-02 19:28:30', 'month');
```

```text
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'month')      |
+-------------------------------------------------+
| 2010-12-01 00:00:00                             |
+-------------------------------------------------+
```

```sql
select date_trunc('2010-12-02 19:28:30', 'quarter');
```

```text
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'quarter')    |
+-------------------------------------------------+
| 2010-10-01 00:00:00                             |
+-------------------------------------------------+
```

```sql
select date_trunc('2010-12-02 19:28:30', 'year');
```

```text
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'year')       |
+-------------------------------------------------+
| 2010-01-01 00:00:00                             |
+-------------------------------------------------+
```