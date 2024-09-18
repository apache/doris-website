---
{
    "title": "CAST",
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

## CAST

### Description

The `CAST` function is used for data type conversion in SQL queries. It is typically used to convert one data type into another, such as converting a string to an integer, converting an integer to a string, and so on.

#### Syntax

`CAST (src_type as dst_type)`

Converts the src_type to the specified dst_type.

### Example

1. Turn constant, or a column in a table

```mysql
mysql> select cast('1234' as int);
+---------------------+
| cast('1234' as INT) |
+---------------------+
|                1234 |
+---------------------+
```

2. Transferred raw data

```shell
curl --location-trusted -u root: -T ~/user_data/bigint -H "columns: tmp_k1, k1=cast(tmp_k1 as BIGINT)"  http://host:port/api/test/bigint/_stream_load
```

* Note: In the import, because the original type is String, when the original data with floating point value is cast, the data will be converted to NULL, such as 12.0. Doris is currently not truncating raw data. *

If you want to force this type of raw data cast to int. Look at the following words:

```shell
curl --location-trusted -u root: -T ~/user_data/bigint -H "columns: tmp_k1, k1=cast(cast(tmp_k1 as DOUBLE) as BIGINT)"  http://host:port/api/test/bigint/_stream_load
```

```mysql
mysql> select cast(cast ("11.2" as double) as bigint);
+----------------------------------------+
| CAST(CAST('11.2' AS DOUBLE) AS BIGINT) |
+----------------------------------------+
|                                     11 |
+----------------------------------------+
1 row in set (0.00 sec)

# For the DECIMALV3 DATETIME type, the cast operation performs rounding half up.
mysql> select cast (1.115 as DECIMALV3(16, 2));
+---------------------------------+
| cast(1.115 as DECIMALV3(16, 2)) |
+---------------------------------+
|                            1.12 |
+---------------------------------+

mysql> select cast('2024-12-29-20:40:50.123500' as datetime(3));
+-----------------------------------------------------+
| cast('2024-12-29-20:40:50.123500' as DATETIMEV2(3)) |
+-----------------------------------------------------+
| 2024-12-29 20:40:50.124                             |
+-----------------------------------------------------+

mysql> select cast('2024-12-29-20:40:50.123499' as datetime(3));
+-----------------------------------------------------+
| cast('2024-12-29-20:40:50.123499' as DATETIMEV2(3)) |
+-----------------------------------------------------+
| 2024-12-29 20:40:50.123                             |
+-----------------------------------------------------+
```

### Keywords

CAST