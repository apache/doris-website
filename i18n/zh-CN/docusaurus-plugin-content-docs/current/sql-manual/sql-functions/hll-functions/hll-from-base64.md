---
{
    "title": "HLL_FROM_BASE64",
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

## hll_from_base64

### description
#### Syntax

`HLL HLL_FROM_BASE64(VARCHAR input)`

将一个base64字符串(`hll_to_base64`函数的结果)转化为一个HLL。当输入字符串不合法时，返回NULL。

### example

#### 查询示例
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

#### 数据导入示例：
```
前置条件：
1. 在 Hive 中已经创建好一个名为 hive_test.hive_hll_table 的 Hive 表（字段为：`k1` int, `k2` String, `k3` String, `uuid` binary），并且已经基于普通表使用 to_hll 的UDF函数往该表插入数据。

2. 在 Doris 中创建名为 hive 的 Catalog 用来连接。

3. 创建好 Doris 内表，名为 doris_hll_table，字段有：`k1` int, `k2` varchar(10), `k3` varchar(10), `uuid` HLL HLL_UNION。

那么，此时可以使用 hll_from_base64 函数从 Hive 插入数据到 Doris 中：
insert into doris_hll_table select k1, k2, k3, hll_from_base64(uuid) from hive.hive_test.hive_hll_table;
```
更多导入细节可以参考：[Hive Hll UDF](../../../ecosystem/hive-hll-udf.md)

### keywords
HLL_FROM_BASE64,HLL
