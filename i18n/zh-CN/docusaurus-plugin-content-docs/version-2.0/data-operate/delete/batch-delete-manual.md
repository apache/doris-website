---
{
    "title": "批量删除",
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
有了 Delete 操作为什么还要引入基于导入的批量删除？

**Delete 操作的局限性**

使用 Delete 语句的方式删除时，每执行一次 Delete 都会生成一个空的 rowset 来记录删除条件，并产生一个新的数据版本。每次读取都要对删除条件进行过滤，如果频繁删除或者删除条件过多时，都会严重影响查询性能。

**Insert 数据和 Delete 数据穿插出现**

对于类似于从事务数据库中，通过 CDC 进行数据导入的场景，数据中 Insert 和 Delete 一般是穿插出现的，面对这种场景当前 Delete 操作也是无法实现。

导入数据时有几种合并方式：

1. APPEND: 数据全部追加到现有数据中。

2. DELETE: 删除所有与导入数据 key 列值相同的行 (当表存在`sequence`列时，需要同时满足主键相同以及 sequence 列的大小逻辑才能正确删除，详见下边用例 4)。

3. MERGE: 根据 DELETE ON 的决定 APPEND 还是 DELETE。

批量删除只工作在 Unique 模型上。

## 基本原理

通过在 Unique 表上增加一个隐藏列`__DORIS_DELETE_SIGN__`来实现。

FE 解析查询时，遇到 * 等扩展时去掉`__DORIS_DELETE_SIGN__`，并且默认加上 `__DORIS_DELETE_SIGN__ != true` 的条件，BE 读取时都会加上一列进行判断，通过条件确定是否删除。

- 导入

    导入时在 FE 解析时将隐藏列的值设置成 `DELETE ON` 表达式的值。

- 读取

    读取时在所有存在隐藏列的上增加`__DORIS_DELETE_SIGN__ != true` 的条件，be 不感知这一过程，正常执行。

- Cumulative Compaction

    Cumulative Compaction 时将隐藏列看作正常的列处理，Compaction 逻辑没有变化。

- Base Compaction

    Base Compaction 时要将标记为删除的行的删掉，以减少数据占用的空间。

## 启用批量删除支持

启用批量删除支持有以下两种形式：

1. 通过在 FE 配置文件中增加`enable_batch_delete_by_default=true` 重启 fe 后新建表的都支持批量删除，此选项默认为 true；

2. 对于没有更改上述 FE 配置或对于已存在的不支持批量删除功能的表，可以使用如下语句： `ALTER TABLE tablename ENABLE FEATURE "BATCH_DELETE"` 来启用批量删除。本操作本质上是一个 schema change 操作，操作立即返回，可以通过`show alter table column` 来确认操作是否完成。

那么如何确定一个表是否支持批量删除，可以通过设置一个 session variable 来显示隐藏列 `SET show_hidden_columns=true` ，之后使用`desc tablename`，如果输出中有`__DORIS_DELETE_SIGN__` 列则支持，如果没有则不支持。

## 语法说明

导入的语法设计方面主要是增加一个指定删除标记列的字段的 column 映射，并且需要在导入的数据中增加一列，各种导入方式设置的语法如下

### Stream Load

`Stream Load` 的写法在 header 中的 columns 字段增加一个设置删除标记列的字段，示例 `-H "columns: k1, k2, label_c3" -H "merge_type: [MERGE|APPEND|DELETE]" -H "delete: label_c3=1"`。

### Broker Load

`Broker Load` 的写法在 `PROPERTIES` 处设置删除标记列的字段，语法如下：

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1,tmp_c2, label_c3)
    SET
    (
        id=tmp_c2,
        name=tmp_c1,
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Routine Load

`Routine Load`的写法在 `columns`字段增加映射，映射方式同上，语法如下：

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
 [WITH MERGE|APPEND|DELETE]
 COLUMNS(k1, k2, k3, v1, v2, label),
 WHERE k1  100 and k2 like "%doris%"
 [DELETE ON label=true]
 PROPERTIES
 (
     "desired_concurrent_number"="3",
     "max_batch_interval" = "20",
     "max_batch_rows" = "300000",
     "max_batch_size" = "209715200",
     "strict_mode" = "false"
 )
 FROM KAFKA
 (
     "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
     "kafka_topic" = "my_topic",
     "kafka_partitions" = "0,1,2,3",
     "kafka_offsets" = "101,0,0,200"
 );
```

### 注意事项

1. 由于除`Stream Load` 外的导入操作在 doris 内部有可能乱序执行，因此在使用`MERGE` 方式导入时如果不是`Stream Load`，需要与 load sequence 一起使用，具体的语法可以参照`sequence`列 相关的文档；

2. `DELETE ON` 条件只能与 MERGE 一起使用。

如果在执行导入作业前按上文所述开启了`SET show_hidden_columns = true`的 session variable 来查看表是否支持批量删除，按示例完成 DELETE/MERGE 的导入作业后，如果在同一个 session 中执行`select count(*) from xxx`等语句时，需要执行`SET show_hidden_columns = false`或者开启新的 session, 避免查询结果中包含那些被批量删除的记录，导致结果与预期不符。

## 使用示例

### 查看是否启用批量删除支持

```sql
mysql> CREATE TABLE IF NOT EXISTS table1 (
    ->     siteid INT,
    ->     citycode INT,
    ->     username VARCHAR(64),
    ->     pv BIGINT
    -> ) UNIQUE KEY (siteid, citycode, username)
    -> DISTRIBUTED BY HASH(siteid) BUCKETS 10
    -> PROPERTIES (
    ->     "replication_num" = "3"
    -> );
Query OK, 0 rows affected (0.34 sec)

mysql> SET show_hidden_columns=true;
Query OK, 0 rows affected (0.00 sec)

mysql> DESC table1;
+-----------------------+-------------+------+-------+---------+-------+
| Field                 | Type        | Null | Key   | Default | Extra |
+-----------------------+-------------+------+-------+---------+-------+
| siteid                | int         | Yes  | true  | NULL    |       |
| citycode              | int         | Yes  | true  | NULL    |       |
| username              | varchar(64) | Yes  | true  | NULL    |       |
| pv                    | bigint      | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint     | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint      | No   | false | 0       | NONE  |
+-----------------------+-------------+------+-------+---------+-------+
6 rows in set (0.01 sec)
```

### Stream Load 使用示例
请查阅[Stream Load使用手册](../import/import-way/stream-load-manual.md)中“指定 merge_type 进行 Delete 操作”和“指定 merge_type 进行 Merge 操作”章节的内容。
