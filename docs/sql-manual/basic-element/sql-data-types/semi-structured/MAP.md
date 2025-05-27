---
{
"title": "MAP",
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

## MAP

### Name

MAP

### Syntax
`MAP<K, V>`

Where:

* `K` is the type of the key for the map. You should must use one of the following types for keys:
  * String Data Type(Char/Varchar/String)
  * Numeric Data Type(except double and float)
  * Date Type(Date/Datetime/Time)
  * IP Address Type(IPV4/IPV6)

  Map keys always be nullable. 

  **Because nullable types are supported as map keys, key comparison in maps uses "null-safe equal" (null and null are considered equal), which differs from the standard SQL definition.**

* `V` is the type of the value in the map. And it is always nullable.

The Map type does not support duplicate keys; Doris will automatically remove duplicates (only one entry is retained for each identical key).

### Description

A Map of K, V items, it cannot be used as a key column. Now MAP can only used in Duplicate and Unique Model Tables.

Need to manually enable the support, it is disabled by default.
```
admin set frontend config("enable_map_type" = "true");
```
### Example

Create table example:

```sql
CREATE TABLE IF NOT EXISTS test.simple_map (
  `id` INT(11) NULL COMMENT "",
  `m` Map<STRING, INT> NULL COMMENT ""
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"storage_format" = "V2"
);
```

Insert data example:

```sql
mysql> INSERT INTO simple_map VALUES(1, {'a': 100, 'b': 200});
```

stream_load examples:
See [STREAM LOAD](../../../../data-operate/import/import-way/stream-load-manual)  for syntax details.

```shell
# load the map data from json file
curl --location-trusted -uroot: -T events.json -H "format: json" -H "read_json_by_line: true" http://fe_host:8030/api/test/simple_map/_stream_load
# 返回结果
{
    "TxnId": 106134,
    "Label": "5666e573-9a97-4dfc-ae61-2d6b61fdffd2",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10293125,
    "NumberLoadedRows": 10293125,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 2297411459,
    "LoadTimeMs": 66870,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 80,
    "ReadDataTimeMs": 6415,
    "WriteDataTimeMs": 10550,
    "CommitAndPublishTimeMs": 38
}
```

Select all data example:

```sql
mysql> SELECT * FROM simple_map;
+------+-----------------------------+
| id   | m                           |
+------+-----------------------------+
|    1 | {'a':100, 'b':200}          |
|    2 | {'b':100, 'c':200, 'd':300} |
|    3 | {'a':10, 'd':200}           |
+------+-----------------------------+
```

Select map column example:

```sql
mysql> SELECT m FROM simple_map;
+-----------------------------+
| m                           |
+-----------------------------+
| {'a':100, 'b':200}          |
| {'b':100, 'c':200, 'd':300} |
| {'a':10, 'd':200}           |
+-----------------------------+
```

Select map value according given key example: 

```sql
mysql> SELECT m['a'] FROM simple_map;
+-----------------------------+
| %element_extract%(`m`, 'a') |
+-----------------------------+
|                         100 |
|                        NULL |
|                          10 |
+-----------------------------+
```

map functions examples: 

```sql
# map construct

mysql> SELECT map('k11', 1000, 'k22', 2000)['k11'];
+---------------------------------------------------------+
| %element_extract%(map('k11', 1000, 'k22', 2000), 'k11') |
+---------------------------------------------------------+
|                                                    1000 |
+---------------------------------------------------------+

mysql> SELECT map('k11', 1000, 'k22', 2000)['nokey'];
+-----------------------------------------------------------+
| %element_extract%(map('k11', 1000, 'k22', 2000), 'nokey') |
+-----------------------------------------------------------+
|                                                      NULL |
+-----------------------------------------------------------+
1 row in set (0.06 sec)

# map size

mysql> SELECT map_size(map('k11', 1000, 'k22', 2000));
+-----------------------------------------+
| map_size(map('k11', 1000, 'k22', 2000)) |
+-----------------------------------------+
|                                       2 |
+-----------------------------------------+

mysql> SELECT id, m, map_size(m) FROM simple_map ORDER BY id;
+------+-----------------------------+---------------+
| id   | m                           | map_size(`m`) |
+------+-----------------------------+---------------+
|    1 | {"a":100, "b":200}          |             2 |
|    2 | {"b":100, "c":200, "d":300} |             3 |
|    2 | {"a":10, "d":200}           |             2 |
+------+-----------------------------+---------------+
3 rows in set (0.04 sec)

# map_contains_key

mysql> SELECT map_contains_key(map('k11', 1000, 'k22', 2000), 'k11');
+--------------------------------------------------------+
| map_contains_key(map('k11', 1000, 'k22', 2000), 'k11') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+
1 row in set (0.08 sec)

mysql> SELECT id, m, map_contains_key(m, 'k1') FROM simple_map ORDER BY id;
+------+-----------------------------+-----------------------------+
| id   | m                           | map_contains_key(`m`, 'k1') |
+------+-----------------------------+-----------------------------+
|    1 | {"a":100, "b":200}          |                           0 |
|    2 | {"b":100, "c":200, "d":300} |                           0 |
|    2 | {"a":10, "d":200}           |                           0 |
+------+-----------------------------+-----------------------------+
3 rows in set (0.10 sec)

mysql> SELECT id, m, map_contains_key(m, 'a') FROM simple_map ORDER BY id;
+------+-----------------------------+----------------------------+
| id   | m                           | map_contains_key(`m`, 'a') |
+------+-----------------------------+----------------------------+
|    1 | {"a":100, "b":200}          |                          1 |
|    2 | {"b":100, "c":200, "d":300} |                          0 |
|    2 | {"a":10, "d":200}           |                          1 |
+------+-----------------------------+----------------------------+
3 rows in set (0.17 sec)

# map_contains_value

mysql> SELECT map_contains_value(map('k11', 1000, 'k22', 2000), NULL);
+---------------------------------------------------------+
| map_contains_value(map('k11', 1000, 'k22', 2000), NULL) |
+---------------------------------------------------------+
|                                                       0 |
+---------------------------------------------------------+
1 row in set (0.04 sec)

mysql> SELECT id, m, map_contains_value(m, '100') FROM simple_map ORDER BY id;
+------+-----------------------------+------------------------------+
| id   | m                           | map_contains_value(`m`, 100) |
+------+-----------------------------+------------------------------+
|    1 | {"a":100, "b":200}          |                            1 |
|    2 | {"b":100, "c":200, "d":300} |                            1 |
|    2 | {"a":10, "d":200}           |                            0 |
+------+-----------------------------+------------------------------+
3 rows in set (0.11 sec)

# map_keys

mysql> SELECT map_keys(map('k11', 1000, 'k22', 2000));
+-----------------------------------------+
| map_keys(map('k11', 1000, 'k22', 2000)) |
+-----------------------------------------+
| ["k11", "k22"]                          |
+-----------------------------------------+
1 row in set (0.04 sec)

mysql> SELECT id, map_keys(m) FROM simple_map ORDER BY id;
+------+-----------------+
| id   | map_keys(`m`)   |
+------+-----------------+
|    1 | ["a", "b"]      |
|    2 | ["b", "c", "d"] |
|    2 | ["a", "d"]      |
+------+-----------------+
3 rows in set (0.19 sec)

# map_values

mysql> SELECT map_values(map('k11', 1000, 'k22', 2000));
+-------------------------------------------+
| map_values(map('k11', 1000, 'k22', 2000)) |
+-------------------------------------------+
| [1000, 2000]                              |
+-------------------------------------------+
1 row in set (0.03 sec)

mysql> SELECT id, map_values(m) FROM simple_map ORDER BY id;
+------+-----------------+
| id   | map_values(`m`) |
+------+-----------------+
|    1 | [100, 200]      |
|    2 | [100, 200, 300] |
|    2 | [10, 200]       |
+------+-----------------+
3 rows in set (0.18 sec)

```

### Keywords

    MAP
