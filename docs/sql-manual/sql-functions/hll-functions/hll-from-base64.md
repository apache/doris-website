---
{
    "title": "HLL_FROM_BASE64",
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

## hll_from_base64

### description
#### Syntax

`HLL HLL_FROM_BASE64(VARCHAR input)`

Convert a base64 string(result of function `hll_to_base64`) into a hll. If input string is invalid, return NULL.

### example

#### query example 

```
mysql> select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
1 row in set (0.04 sec)

mysql>  select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
1 row in set (0.04 sec)

mysql> select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(''))));
+---------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('')))) |
+---------------------------------------------------------------+
|                                                             1 |
+---------------------------------------------------------------+
1 row in set (0.02 sec)

mysql> select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL))));
+-----------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL)))) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
1 row in set (0.02 sec)
```
#### data import example 
```
Prerequisites:

1.A Hive table named hive_test.hive_hll_table has been created with fields: k1 int, k2 String, k3 String, uuid binary, and data has been inserted into the table using the to_hll UDF function from a regular table.

2.A catalog named hive has been created in Doris to connect to Hive.

3.A Doris internal table named doris_hll_table has been created with fields: k1 int, k2 varchar(10), k3 varchar(10), uuid HLL HLL_UNION.

Then, you can use the hll_from_base64 function to import data from Hive to Doris:
insert into doris_hll_table select k1, k2, k3, hll_from_base64(uuid) from hive.hive_test.hive_hll_table;
```
For more import details, please refer to: [Hive Hll UDF](../../../ecosystem/hive-hll-udf.md)

### keywords
HLL_FROM_BASE64, HLL
