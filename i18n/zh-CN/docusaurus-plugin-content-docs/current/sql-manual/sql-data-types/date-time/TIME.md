---
{
    "title": "TIME",
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

## TIME

### name

TIME

### description

TIME 类型
    时间类型，可以作为查询结果出现，暂时不支持建表存储。表示范围为 `[-838:59:59, 838:59:59]`。
    当前 Doris 中，TIME 作为计算结果的正确性是有保证的（如 `timediff` 等函数），但**不推荐手动 CAST 产生 TIME 类型**。
    TIME 类型不会在常量折叠中进行计算。

### example

```sql
mysql> select timediff('2020-01-01 12:05:03', '2020-01-01 08:02:15');
+------------------------------------------------------------------------------------------------------+
| timediff(cast('2020-01-01 12:05:03' as DATETIMEV2(0)), cast('2020-01-01 08:02:15' as DATETIMEV2(0))) |
+------------------------------------------------------------------------------------------------------+
| 04:02:48                                                                                             |
+------------------------------------------------------------------------------------------------------+
1 row in set (0.12 sec)

mysql> select timediff('2020-01-01', '2000-01-01');
+------------------------------------------------------------------------------------+
| timediff(cast('2020-01-01' as DATETIMEV2(0)), cast('2000-01-01' as DATETIMEV2(0))) |
+------------------------------------------------------------------------------------+
| 838:59:59                                                                          |
+------------------------------------------------------------------------------------+
1 row in set (0.11 sec)
```

### keywords

    TIME
