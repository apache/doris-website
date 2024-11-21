---
{
    "title": "AUTO_PARTITION_NAME",
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

### Description
#### Syntax

`VARCHAR AUTO_PARTITION_NAME('RANGE', 'VARCHAR unit', DATETIME datetime)`

`VARCHAR AUTO_PARTITION_NAME('LIST', VARCHAR,...)`

遵循 RANGE 的分区名规则将 datetime 按照 unit 生成分区名

遵循 LIST 的分区名规则将字符串转换为分区名

datetime 参数是合法的日期表达式。

unit 参数是您希望的时间间隔，可选的值如下：[`second`,`minute`,`hour`,`day`,`month`,`year`]。
如果 unit 不符合上述可选值，结果将返回语法错误。 

### Example
```sql
mysql> select auto_partition_name('range', 'years', '123');
ERROR 1105 (HY000): errCode = 2, detailMessage = range auto_partition_name must accept year|month|day|hour|minute|second for 2nd argument

mysql> select auto_partition_name('range', 'year', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'year', '2022-12-12 19:20:30')   |
+---------------------------------------------------------------+
| p20220101000000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'month', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'month', '2022-12-12 19:20:30')  |
+---------------------------------------------------------------+
| p20221201000000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'day', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'day', '2022-12-12 19:20:30')    |
+---------------------------------------------------------------+
| p20221212000000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'hour', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'hour', '2022-12-12 19:20:30')   |
+---------------------------------------------------------------+
| p20221212190000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'minute', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'minute', '2022-12-12 19:20:30') |
+---------------------------------------------------------------+
| p20221212192000                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('range', 'second', '2022-12-12 19:20:30');
+---------------------------------------------------------------+
| auto_partition_name('range', 'second', '2022-12-12 19:20:30') |
+---------------------------------------------------------------+
| p20221212192030                                               |
+---------------------------------------------------------------+

mysql> select auto_partition_name('list', 'helloworld');
+-------------------------------------------+
| auto_partition_name('list', 'helloworld') |
+-------------------------------------------+
| phelloworld10                             |
+-------------------------------------------+

mysql> select auto_partition_name('list', 'hello', 'world');
+-----------------------------------------------+
| auto_partition_name('list', 'hello', 'world') |
+-----------------------------------------------+
| phello5world5                                 |
+-----------------------------------------------+

mysql> select auto_partition_name('list', "你好");
+------------------------------------+
| auto_partition_name('list', "你好") |
+------------------------------------+
| p4f60597d2                         |
+------------------------------------+
```

### Keywords

    AUTO_PARTITION_NAME,AUTO,PARTITION,NAME
