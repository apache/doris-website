---
{
    "title": "Delete 操作",
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

Delete 操作语句通过 MySQL 协议，对指定的 table 或者 partition 中的数据进行按条件删除。Delete 删除操作不同于基于导入的批量删除，它类似 Insert into 语句，是一个同步过程。所有的 Delete 操作在 Doris 中是一个独立的导入作业，一般 Delete 语句需要指定表和分区以及删除的条件来筛选要删除的数据，并将会同时删除 base 表和 rollup 表的数据。

Delete 操作的语法详见 [DELETE](../../sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/DELETE) 语法。不同于 Insert into 命令，delete 不能手动指定`label`，有关 label 的概念可以查看 [Insert Into](../../data-operate/import/insert-into-manual) 文档。

## 通过指定过滤谓词来删除

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### 必须的参数

- table_name: 指定需要删除数据的表

- column_name: 属于 table_name 的列

- op: 逻辑比较操作符，可选类型包括：=, >, <, >=, <=, !=, in, not in

- value | value_list: 做逻辑比较的值或值列表

### 可选的参数

- PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): 指定执行删除数据的分区名，如果表不存在此分区，则报错

- table_alias: 表的别名

### 注意事项

- 使用表模型 Aggregate 时，只能指定 Key 列上的条件。

- 当选定的 Key 列不存在于某个 Rollup 中时，无法进行 Delete。

- 条件之间只能是“与”的关系。若希望达成“或”的关系，需要将条件分写在两个 DELETE 语句中；

- 如果为分区表，需要指定分区，如果不指定，Doris 会从条件中推断出分区。两种情况下，Doris 无法从条件中推断出分区：1) 条件中不包含分区列；2) 分区列的 op 为 not in。当分区表未指定分区，或者无法从条件中推断分区的时候，需要设置会话变量 delete_without_partition 为 true，此时 Delete 会应用到所有分区。

- 该语句可能会降低执行后一段时间内的查询效率。影响程度取决于语句中指定的删除条件的数量。指定的条件越多，影响越大。

### 使用示例

**1. 删除 my_table partition p1 中 k1 列值为 3 的数据行**

```sql
DELETE FROM my_table PARTITION p1
    WHERE k1 = 3;
```

**2. 删除 my_table partition p1 中 k1 列值大于等于 3 且 k2 列值为 "abc" 的数据行**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 = 3 AND k2 = "abc";
```

**3. 删除 my_table partition p1, p2 中 k1 列值大于等于 3 且 k2 列值为 "abc" 的数据行**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 = 3 AND k2 = "abc";
```

## 通过使用 Using 子句来删除

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

### 必须的参数

- table_name: 指定需要删除数据的表

- WHERE condition: 指定一个用于选择删除行的条件

### 可选的参数

- PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): 指定执行删除数据的分区名，如果表不存在此分区，则报错

- table_alias: 表的别名

### 注意事项

此种形式只能在 UNIQUE KEY 模型表上使用

- 只能在表模型 UNIQUE Key 表模型上使用，只能指定 key 列上的条件。

### 使用示例

使用`t2`和`t3`表连接的结果，删除`t1`中的数据，删除的表只支持 unique 模型

```sql
-- 创建t1, t2, t3三张表
CREATE TABLE t1
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
UNIQUE KEY (id)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1', "function_column.sequence_col" = "c4");

CREATE TABLE t2
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

CREATE TABLE t3
  (id INT)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

-- 插入数据
INSERT INTO t1 VALUES
  (1, 1, '1', 1.0, '2000-01-01'),
  (2, 2, '2', 2.0, '2000-01-02'),
  (3, 3, '3', 3.0, '2000-01-03');

INSERT INTO t2 VALUES
  (1, 10, '10', 10.0, '2000-01-10'),
  (2, 20, '20', 20.0, '2000-01-20'),
  (3, 30, '30', 30.0, '2000-01-30'),
  (4, 4, '4', 4.0, '2000-01-04'),
  (5, 5, '5', 5.0, '2000-01-05');

INSERT INTO t3 VALUES
  (1),
  (4),
  (5);

-- 删除 t1 中的数据
DELETE FROM t1
  USING t2 INNER JOIN t3 ON t2.id = t3.id
  WHERE t1.id = t2.id;
```

预期结果为，删除了`t1`表`id`为`1`的列

```Plain
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## 结果返回

Delete 命令是一个 SQL 命令，返回结果是同步的，分为以下几种：

### 执行成功

如果 Delete 顺利执行完成并可见，将返回下列结果，`Query OK`表示成功

```sql
mysql> delete from test_tbl PARTITION p1 where k1 = 1;
Query OK, 0 rows affected (0.04 sec)
{'label':'delete_e7830c72-eb14-4cb9-bbb6-eebd4511d251', 'status':'VISIBLE', 'txnId':'4005'}
```

### 提交成功，但未可见

Doris 的事务提交分为两步：提交和发布版本，只有完成了发布版本步骤，结果才对用户是可见的。若已经提交成功了，那么就可以认为最终一定会发布成功，Doris 会尝试在提交完后等待发布一段时间，如果超时后即使发布版本还未完成也会优先返回给用户，提示用户提交已经完成。若如果 Delete 已经提交并执行，但是仍未发布版本和可见，将返回下列结果

```sql
mysql> delete from test_tbl PARTITION p1 where k1 = 1;
Query OK, 0 rows affected (0.04 sec)
{'label':'delete_e7830c72-eb14-4cb9-bbb6-eebd4511d251', 'status':'COMMITTED', 'txnId':'4005', 'err':'delete job is committed but may be taking effect later' }
```

结果会同时返回一个 json 字符串：

- `affected rows`：表示此次删除影响的行，由于 Doris 的删除目前是逻辑删除，因此对于这个值是恒为 0；

- `label`：自动生成的 label，是该导入作业的标识。每个导入作业，都有一个在单 Database 内部唯一的 Label；

- `status`：表示数据删除是否可见，如果可见则显示`VISIBLE`，如果不可见则显示`COMMITTED`；

- `txnId`：这个 Delete job 对应的事务 id；

- `err`：字段会显示一些本次删除的详细信息。

### 提交失败，事务取消

如果 Delete 语句没有提交成功，将会被 Doris 自动中止，返回下列结果

```sql
mysql> delete from test_tbl partition p1 where k1 > 80;
ERROR 1064 (HY000): errCode = 2, detailMessage = {错误原因}
```

比如说一个超时的删除，将会返回 `timeout` 时间和未完成的`(tablet=replica)`

```sql
mysql> delete from test_tbl partition p1 where k1 > 80;
ERROR 1064 (HY000): errCode = 2, detailMessage = failed to delete replicas from job: 4005, Unfinished replicas:10000=60000, 10001=60000, 10002=60000
```

### 总结

对于 Delete 操作返回结果的正确处理逻辑为：

- 如果返回结果为`ERROR 1064 (HY000)`，则表示删除失败；

- 如果返回结果为`Query OK`，则表示删除执行成功；

  - 如果`status`为`COMMITTED`，表示数据仍不可见，用户可以稍等一段时间再用`show delete`命令查看结果；

  - 如果`status`为`VISIBLE`，表示数据删除成功。

## 相关 FE 配置

**TIMEOUT 配置**

总体来说，Doris 的删除作业的超时时间计算规则为如下（单位：秒）：

```Plain
TIMEOUT = MIN(delete_job_max_timeout_second, MAX(30, tablet_delete_timeout_second * tablet_num))
```

- tablet_delete_timeout_second

  Delete 自身的超时时间是受指定分区下 Tablet 的数量弹性改变的，此项配置为平均一个 Tablet 所贡献的 `timeout` 时间，默认值为 2。

  假设此次删除所指定分区下有 5 个 tablet，那么可提供给 delete 的 timeout 时间为 10 秒，由于低于最低超时时间 30 秒，因此最终超时时间为 30 秒。

- query_timeout

  因为 Delete 本身是一个 SQL 命令，因此删除语句也会受 Session 限制，`timeout` 还受 Session 中的`query_timeout`值影响，可以通过`SET query_timeout = xxx`来增加超时时间，单位是秒。

**IN 谓词配置**

- `max_allowed_in_element_num_of_delete`

  如果用户在使用 in 谓词时需要占用的元素比较多，用户可以通过此项调整允许携带的元素上限，默认值为 1024。

## 查看历史记录

用户可以通过 show delete 语句查看历史上已执行完成的删除记录。

语法如下

```sql
SHOW DELETE [FROM db_name]
```

使用示例

```sql
mysql> show delete from test_db;
+-----------+---------------+---------------------+-----------------+----------+
| TableName | PartitionName | CreateTime          | DeleteCondition | State    |
+-----------+---------------+---------------------+-----------------+----------+
| empty_tbl | p3            | 2020-04-15 23:09:35 | k1 EQ "1"       | FINISHED |
| test_tbl  | p4            | 2020-04-15 23:09:53 | k1 GT "80"      | FINISHED |
+-----------+---------------+---------------------+-----------------+----------+
2 rows in set (0.00 sec)
```
