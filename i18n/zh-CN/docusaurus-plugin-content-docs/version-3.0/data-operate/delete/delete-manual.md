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



删除操作语句通过 MySQL 协议，按条件删除指定表或分区中的数据。支持通过简单的谓词组合条件来指定要删除的数据，也支持在主键表上使用 `USING` 子句关联多表进行删除。

## 通过指定过滤谓词删除

```sql
DELETE FROM table_name [table_alias]
  [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
  WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### 必须参数

- `table_name`: 指定需要删除数据的表
- `column_name`: 属于 `table_name` 的列
- `op`: 逻辑比较操作符，包括：=, >, <, >=, <=, !=, in, not in
- `value | value_list`: 进行逻辑比较的值或值列表

### 可选参数

- `PARTITION partition_name | PARTITIONS (partition_name [, partition_name])`: 指定执行删除数据的分区名，如果表不存在此分区，则报错
- `table_alias`: 表的别名

### 使用限制

- 使用表模型 Aggregate 时，只能指定 Key 列上的条件。当选定的 Key 列不存在于某个 Rollup 中时，无法进行删除。
- 对于分区表，需要指定分区。如果不指定，Doris 会从条件中推断分区。
  - 两种情况下，Doris 无法从条件中推断分区：
    1. 条件中不包含分区列
    2. 分区列的 `op` 为 `not in`
  - 当分区表未指定分区，或无法从条件中推断分区时，需要设置会话变量 `delete_without_partition` 为 `true`，此时删除操作会应用到所有分区。

### 示例

**1. 删除 `my_table` 分区 `p1` 中 `k1` 列值为 3 的数据行**

```sql
DELETE FROM my_table PARTITION p1
  WHERE k1 = 3;
```

**2. 删除 `my_table` 分区 `p1` 中 `k1` 列值大于等于 3 且 `status` 列值为 "outdated" 的数据行**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 >= 3 AND status = "outdated";
```

**3. 删除 `my_table` 分区 `p1`, `p2` 中 `k1` 列值大于等于 3 且 `dt` 列值位于 "2024-10-01" 和 "2024-10-31" 之间的数据行**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 >= 3 AND dt >= "2024-10-01" AND dt <= "2024-10-31";
```

## 通过使用 `USING` 子句删除

在某些场景下，用户需要关联多张表才能精确确定要删除的数据，这种情况下 `USING` 子句非常有用，语法如下：

```sql
DELETE FROM table_name [table_alias]
  [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
  [USING additional_tables]
  WHERE condition
```

### 必须参数

- `table_name`: 指定需要删除数据的表
- `WHERE condition`: 指定用于选择删除行的条件

### 可选参数

- `PARTITION partition_name | PARTITIONS (partition_name [, partition_name])`: 指定执行删除数据的分区名，如果表不存在此分区，则报错
- `table_alias`: 表的别名

### 注意事项

- 此形式只能在 UNIQUE KEY 模型表上使用

### 示例

使用 `t2` 和 `t3` 表连接的结果，删除 `t1` 中的数据，删除的表只支持 unique 模型。

```sql
-- 创建 t1, t2, t3 三张表
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

预期结果为，删除 `t1` 表中 `id` 为 `1` 的行。

```Plain
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## 相关配置

**超时配置**

- `insert_timeout`: 因为删除操作是一个 SQL 命令且被视为一种特殊的导入，因此删除语句会受 Session 中的 `insert_timeout` 值影响，可以通过 `SET insert_timeout = xxx` 来增加超时时间，单位为秒。

**IN 谓词配置**

- `max_allowed_in_element_num_of_delete`: 如果用户在使用 `in` 谓词时需要占用的元素较多，可以通过此项调整允许携带的元素上限，默认值为 1024。

## 查看历史记录

用户可以通过 `SHOW DELETE` 语句查看历史上已执行完成的删除记录。

语法如下：

```sql
SHOW DELETE [FROM db_name]
```

示例：

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

## 性能建议

1. 在明细表（Duplicate Key）和聚合表（Aggregate Key）上，删除操作执行速度较快，但短时间内大量删除操作会影响查询性能。
2. 在主键表（Unique Key）上，删除操作被转换成 `INSERT INTO` 语句，涉及大范围删除时执行速度较慢，但短时间内大量删除不会对查询性能有较大影响。

## 语法

删除语法详见 [DELETE](../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/DELETE) 语法手册。
