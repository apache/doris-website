---
{
"title": "MAP",
"language": "zh-CN"
}
---

## MAP

### Name

MAP

### 语法
`MAP<K, V>`

其中:

* K 是 Map 的键类型。键必须使用以下类型之一：
	*	字符串类型（Char/Varchar/String）
	*	数值类型（不包括浮点数类型：double 和 float）1
  * 日期类型
  * IP 地址类型(IPV4/IPV6)

  Map 的 Key 类型 始终为 nullable。
  
  **因为支持 nullable 类型作为 map 的 key，map 中的 key 比较使用的是 “null-safe equal”（即 null 和 null 被认为是相等的），这与标准 SQL 的定义不同。**

*	V 是 Map 中值的类型，始终为 nullable。

Map 类型不支持重复的键；Doris 会自动删除重复的项。

### 描述

由 K, V 类型元素组成的 map，不能作为 key 列使用。目前支持在 Duplicate，Unique 模型的表中使用。


Map 类型支持默认情况下是没有开启的，需要设置参数：
```
admin set frontend config("enable_map_type" = "true");
```

## 举例

建表示例如下：

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

插入数据示例：

```sql
mysql> INSERT INTO simple_map VALUES(1, {'a': 100, 'b': 200});
```



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


查询数据示例：

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

查询 map 列示例：

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

map 取值示例：

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

map 支持的 functions 示例：

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

### keywords

    MAP
