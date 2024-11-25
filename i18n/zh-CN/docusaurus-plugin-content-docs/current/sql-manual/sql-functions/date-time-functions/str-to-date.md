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

## str_to_date
### Description
#### Syntax

`DATETIME STR_TO_DATE(VARCHAR str, VARCHAR format)`

通过 `format` 指定的方式将 `str` 转化为 `DATETIME` 类型，若 `str` 无法按照 `format` 指定格式解析，则结果未指定。

支持[date_format](./date-format)中的所有 `format` 格式，此外对于 '%Y' 和 '%Y-%m'，支持补齐日期剩余部分。

### Example

```sql
mysql> select str_to_date('2014-12-21 12:34:56', '%Y-%m-%d %H:%i:%s');
+---------------------------------------------------------+
| str_to_date('2014-12-21 12:34:56', '%Y-%m-%d %H:%i:%s') |
+---------------------------------------------------------+
| 2014-12-21 12:34:56                                     |
+---------------------------------------------------------+

mysql> select str_to_date('2014-12-21 12:34%3A56', '%Y-%m-%d %H:%i%%3A%s');
+--------------------------------------------------------------+
| str_to_date('2014-12-21 12:34%3A56', '%Y-%m-%d %H:%i%%3A%s') |
+--------------------------------------------------------------+
| 2014-12-21 12:34:56                                          |
+--------------------------------------------------------------+

mysql> select str_to_date('200442 Monday', '%X%V %W');
+-----------------------------------------+
| str_to_date('200442 Monday', '%X%V %W') |
+-----------------------------------------+
| 2004-10-18                              |
+-----------------------------------------+

mysql> select str_to_date("2020-09-01", "%Y-%m-%d %H:%i:%s");
+------------------------------------------------+
| str_to_date('2020-09-01', '%Y-%m-%d %H:%i:%s') |
+------------------------------------------------+
| 2020-09-01 00:00:00                            |
+------------------------------------------------+

mysql> select str_to_date('2023','%Y');
+---------------------------+
| str_to_date('2023', '%Y') |
+---------------------------+
| 2023-01-01                |
+---------------------------+
```

### keywords

    STR_TO_DATE,STR,TO,DATE
