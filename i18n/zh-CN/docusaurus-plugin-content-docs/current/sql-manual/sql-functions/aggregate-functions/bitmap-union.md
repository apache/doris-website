---
{
"title": "BITMAP_UNION",
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

计算输入 Bitmap 的并集，返回新的 bitmap

## 语法

```sql
BITMAP_UNION(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持 BITMAP 的数据类型 |

## 返回值

返回值的数据类型为 BITMAP。

## 举例

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    2 | 200  | 300                       |
+------+------+---------------------------+
```

计算 user_id 的去重值：

```
select bitmap_count(bitmap_union(user_id)) from pv_bitmap;
```

```text
+-------------------------------------+
| bitmap_count(bitmap_union(user_id)) |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```

### Create table

建表时需要使用聚合模型，数据类型是 bitmap , 聚合函数是 bitmap_union

```
CREATE TABLE `pv_bitmap` (
  `dt` int(11) NULL COMMENT "",
  `page` varchar(10) NULL COMMENT "",
  `user_id` bitmap BITMAP_UNION NULL COMMENT ""
) ENGINE=OLAP
AGGREGATE KEY(`dt`, `page`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`dt`) BUCKETS 2;
```
注：当数据量很大时，最好为高频率的 bitmap_union 查询建立对应的 rollup 表

```
ALTER TABLE pv_bitmap ADD ROLLUP pv (page, user_id);
```

### Data Load

`TO_BITMAP(expr)` : 将 0 ~ 18446744073709551615 的 unsigned bigint 转为 bitmap

`BITMAP_EMPTY()`: 生成空 bitmap 列，用于 insert 或导入的时填充默认值

`BITMAP_HASH(expr)`或者`BITMAP_HASH64(expr)`: 将任意类型的列通过 Hash 的方式转为 bitmap

#### Stream Load

``` 
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,user_id, user_id=to_bitmap(user_id)"   http://host:8410/api/test/testDb/_stream_load
```

``` 
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,user_id, user_id=bitmap_hash(user_id)"   http://host:8410/api/test/testDb/_stream_load
```

``` 
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,user_id, user_id=bitmap_empty()"   http://host:8410/api/test/testDb/_stream_load
```

#### Insert Into

id2 的列类型是 bitmap
```
insert into bitmap_table1 select id, id2 from bitmap_table2;
```

id2 的列类型是 bitmap
```
INSERT INTO bitmap_table1 (id, id2) VALUES (1001, to_bitmap(1000)), (1001, to_bitmap(2000));
```

id2 的列类型是 bitmap
```
insert into bitmap_table1 select id, bitmap_union(id2) from bitmap_table2 group by id;
```

id2 的列类型是 int
```
insert into bitmap_table1 select id, to_bitmap(id2) from table;
```

id2 的列类型是 String
```
insert into bitmap_table1 select id, bitmap_hash(id_string) from table;
```
