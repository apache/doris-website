---
{
    "title": "AUTO_PARTITION_NAME",
    "language": "en"
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

:::tip tip
Supported since Apache Doris 3.0.2
:::

### Description
#### Syntax

`VARCHAR AUTO_PARTITION_NAME('RANGE', 'VARCHAR unit', DATETIME datetime)`

`VARCHAR AUTO_PARTITION_NAME('LIST', VARCHAR,...)`

Generate datetime partition names by unit following RANGE's partition name rules

Convert strings to partition names following LIST's partition name rules

The datetime parameter is a legal date expression.

The unit parameter is the time interval you want, the available values are: [`second`, `minute`, `hour`, `day`, `month`, `year`].
If unit does not match one of these options, a syntax error will be returned. 

**Supported since Doris 3.0.2**

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
