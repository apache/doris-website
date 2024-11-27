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

Delete 操作的语法详见 [DELETE](../../sql-manual/sql-statements/data-modification/DML/DELETE) 语法。不同于 Insert into 命令，delete 不能手动指定`label`，有关 label 的概念可以查看 [Insert Into](../../data-operate/import/insert-into-manual) 文档。

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
可以通过 [STOP ROUTINE LOAD](../../../sql-manual/sql-reference/Data-Manipulation-Statements/Load/STOP-ROUTINE-LOAD) 命令停止并删除 Routine Load 导入作业。删除后的导入作业无法被恢复，也无法通过 SHOW ROUTINE LOAD 命令查看。

可以通过以下命令停止并删除导入作业 testdb.example_routine_load_csv：

```sql
STOP ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

## 参考手册

### 导入命令

创建一个 Routine Load 常驻导入作业语法如下：

```sql
CREATE ROUTINE LOAD [<db_name>.]<job_name> [ON <tbl_name>]
[merge_type]
[load_properties]
[job_properties]
FROM KAFKA [data_source_properties]
[COMMENT "<comment>"]
```

创建导入作业的模块说明如下：

| 模块                   | 说明                                                         |
| ---------------------- | ------------------------------------------------------------ |
| db_name                | 指定创建导入任务的数据库。                                   |
| job_name               | 指定创建的导入任务名称，同一个 database 不能有名字相同的任务。 |
| tbl_name               | 指定需要导入的表的名称，可选参数，如果不指定，则采用动态表的方式，这个时候需要 Kafka 中的数据包含表名的信息。 |
| merge_type             | 数据合并类型。默认值为 APPEND。<p>merge_type 有三种选项：</p> <p>- APPEND：追加导入方式；</p> <p>- MERGE：合并导入方式；</p> <p>- DELETE：导入的数据皆为需要删除的数据。</p> |
| load_properties        | 导入描述模块，包括以下组成部分：<p>- colum_spearator 子句</p> <p>- columns_mapping 子句</p> <p>- preceding_filter 子句</p> <p>- where_predicates 子句</p> <p>- partitions 子句</p> <p>- delete_on 子句</p> <p>- order_by 子句</p> |
| job_properties         | 用于指定 Routine Load 的通用导入参数。                       |
| data_source_properties | 用于描述 Kafka 数据源属性。                                  |
| comment                | 用于描述导入作业的备注信息。                                 |

### 导入参数说明

**01 FE 配置参数**

**max_routine_load_task_concurrent_num**

- 默认值：256

- 动态配置：是

- FE Master 独有配置：是

- 参数描述：限制 Routine Load 的导入作业最大子并发数量。建议维持在默认值。如果设置过大，可能导致并发任务数过多，占用集群资源。

**max_routine_load_task_num_per_be**

- 默认值：1024

- 动态配置：是

- FE Master 独有配置：是

- 参数描述：每个 BE 限制的最大并发 Routine Load 任务数。`max_routine_load_task_num_per_be` 应该小 `routine_load_thread_pool_size` 于参数。

**max_routine_load_job_num**

- 默认值：100

- 动态配置：是

- FE Master 独有配置：是

- 参数描述：限制最大 Routine Load 作业数，包括 NEED_SCHEDULED，RUNNING，PAUSE

**max_tolerable_backend_down_num**

- 默认值：0

- 动态配置：是

- FE Master 独有配置：是

- 参数描述：只要有一个 BE 宕机，Routine Load 就无法自动恢复。在满足某些条件时，Doris 可以将 PAUSED 的任务重新调度，转换为 RUNNING 状态。该参数为 0 表示只有所有 BE 节点都是 alive 状态踩允许重新调度。

**period_of_auto_resume_min**

- 默认值：5（分钟）

- 动态配置：是

- FE Master 独有配置：是

- 参数描述：自动恢复 Routine Load 的周期

**02 BE 配置参数**

**max_consumer_num_per_group**

- 默认值：3

- 动态配置：是

- 描述：一个子任务重最多生成几个 consumer 消费数据。对于 Kafka 数据源，一个 consumer 可能消费一个或多个 Kafka Partition。假设一个任务需要消费 6 个 Kafka Partitio，则会生成 3 个 consumer，每个 consumer 消费 2 个 partition。如果只有 2 个 partition，则只会生成 2 个 consumer，每个 consumer 消费 1 个 partition。

**03 导入配置参数**

在创建 Routine Load 作业时，可以通过 CREATE ROUTINE LOAD 命令指定不同模块的导入配置参数。

**tbl_name 子句**

指定需要导入的表的名称，可选参数。

如果不指定，则采用动态表的方式，这个时候需要 Kafka 中的数据包含表名的信息。目前仅支持从 Kafka 的 Value 中获取动态表名，且需要符合这种格式：以 json 为例：`table_name|{"col1": "val1", "col2": "val2"}`, 其中 `tbl_name` 为表名，以 `|` 作为表名和表数据的分隔符。CSV 格式的数据也是类似的，如：`table_name|val1,val2,val3`。注意，这里的 `table_name` 必须和 Doris 中的表名一致，否则会导致导入失败。注意，动态表不支持后面介绍的 column_mapping 配置。

**merge_type 子句**

可以通过 merge_type 模块指定数据合并的类型。merge_type 有三种选项：

- APPEND：追加导入方式

- MERGE：合并导入方式。仅适用于 Unique Key 模型。需要配合 [DELETE ON] 模块，以标注 Delete Flag 列

- DELETE：导入的数据皆为需要删除的数据

**load_properties 子句**

可以通过 load_properties 模块描述导入数据的属性，具体语法如下

```sql
[COLUMNS TERMINATED BY <column_separator>,]
[COLUMNS (<column1_name>[, <column2_name>, <column_mapping>, ...]),]
[WHERE <where_expr>,]
[PARTITION(<partition1_name>, [<partition2_name>, <partition3_name>, ...]),]
[DELETE ON <delete_expr>,]
[ORDER BY <order_by_column1>[, <order_by_column2>, <order_by_column3>, ...]]
```

具体模块对应参数如下：

| 子模块                | 参数                                                         | 说明                                                         |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| COLUMNS TERMINATED BY | <column_separator>                                           | 用于指定列分隔符，默认为 `\t`。例如需要指定逗号为分隔符，可以使用以下命令：`COLUMN TERMINATED BY ","`对于空值处理，需要注意以下事项：<p>- 空值（null）需要用 `\n` 表示，`a,\n,b` 数据表示中间列是一个空值（null）</p> <p>- 空字符串（''）直接将数据置空，a,,b 数据表示中间列是一个空字符串（''）</p> |
| COLUMNS               | <column_name>                                                | 用于指定对应的列名例如需要指定导入列 `(k1, k2, k3)`，可以使用以下命令：`COLUMNS(k1, k2, k3)`在以下情况下可以缺省 COLUMNS 子句：<p>- CSV 中的列与表中的列一一对应</p> <p>- JSON 中的 key 列与表中的列名相同</p> |   
| &nbsp;&nbsp;               | <column_mapping>      | 在导入过程中，可以通过列映射进行列的过滤和转换。如在导入的过程中，目标列需要基于数据源的某一列进行衍生计算，目标列 k4 基于 k3 列使用公式 k3+1 计算得出，需要可以使用以下命令：`COLUMNS(k1, k2, k3, k4 = k3 + 1)`详细内容可以参考[数据转换](../../import/load-data-convert) |                                                              |
| WHERE                 | <where_expr>                                                 | 指定 where_expr 可以根据条件过滤导入的数据源。如只希望导入 age > 30 的数据源，可以使用以下命令：`WHERE age > 30` |
| PARTITION             | <partition_name>                                             | 指定导入目标表中的哪些 partition。如果不指定，会自动导入对应的 partition 中。如希望导入目标表 p1 与 p2 分区，可以使用以下命令：`PARTITION(p1, p2)` |
| DELETE ON             | <delete_expr>                                                | 在 MERGE 导入模式下，使用 delete_expr 标记哪些列需要被删除。如需要在 MERGE 时删除 age > 30 的列，可以使用，可以使用以下命令：`DELETE ON age > 30` |
| ORDER BY              | <order_by_column>                                            | 进针对 Unique Key 模型生效。用于指定导入数据中的 Sequence Column 列，以保证数据的顺序。如在 Unique Key 表导入时，需要指定导入的 Sequence Column 为 create_time，可以使用以下命令：`ORDER BY create_time`针对与 Unique Key 模型 Sequence Column 列的描述，可以参考文档[ 数据更新/Sequence 列 ](../../../data-operate/update/update-of-unique-model) |

**job_properties 子句**

在创建 Routine Load 导入作业时，可以指定 job_properties 子句以指定导入作业的属性。语法如下：

```sql
PROPERTIES ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

job_properties 子句具体参数选项如下：

| 参数                      | 说明                                                         |
| ------------------------- | ------------------------------------------------------------ |
| desired_concurrent_number | <p>默认值：5 </p> <p>参数描述：单个导入子任务（load task）期望的并发度，修改 Routine Load 导入作业切分的期望导入子任务数量。在导入过程中，期望的子任务并发度可能不等于实际并发度。实际的并发度会根据集群的节点数、负载情况，以及数据源的情况综合考虑，使用公式以下可以计算出实际的导入子任务数：</p> <p>` min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`，其中：</p> <p>- topic_partition_num 表示 Kafka Topic 的 parititon 数量</p> <p>- desired_concurrent_number 表示设置的参数大小</p> <p>- max_routine_load_task_concurrent_num 为 FE 中设置 Routine Load 最大任务并行度的参数</p> |
| max_batch_interval        | 每个子任务的最大运行时间，单位是秒，必须大于 0，默认值为 60(s)。max_batch_interval/max_batch_rows/max_batch_size 共同形成子任务执行阈值。任一参数达到阈值，导入子任务结束，并生成新的导入子任务。 |
| max_batch_rows            | 每个子任务最多读取的行数。必须大于等于 200000。默认是 20000000。max_batch_interval/max_batch_rows/max_batch_size 共同形成子任务执行阈值。任一参数达到阈值，导入子任务结束，并生成新的导入子任务。 |
| max_batch_size            | 每个子任务最多读取的字节数。单位是字节，范围是 100MB 到 1GB。默认是 1G。max_batch_interval/max_batch_rows/max_batch_size 共同形成子任务执行阈值。任一参数达到阈值，导入子任务结束，并生成新的导入子任务。 |
| max_error_number          | 采样窗口内，允许的最大错误行数。必须大于等于 0。默认是 0，即不允许有错误行。采样窗口为 `max_batch_rows * 10`。即如果在采样窗口内，错误行数大于 `max_error_number`，则会导致例行作业被暂停，需要人工介入检查数据质量问题，通过 [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) 命令中 `ErrorLogUrls` 检查数据的质量问题。被 where 条件过滤掉的行不算错误行。 |
| strict_mode               | 是否开启严格模式，默认为关闭。严格模式表示对于导入过程中的列类型转换进行严格过滤。如果开启后，非空原始数据的列类型变换如果结果为 NULL，则会被过滤。<p>严格模式过滤策略如下：</p> <p>- 某衍生列（由函数转换生成而来），Strict Mode 对其不产生影响</p> <p>- 当列类型需要转换，错误的数据类型将被过滤掉，在 [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) 的 `ErrorLogUrls` 中查看因为数据类型错误而被过滤掉的列</p> <p>- 对于导入的某列类型包含范围限制的，如果原始数据能正常通过类型转换，但无法通过范围限制的，strict mode 对其也不产生影响。例如：如果类型是 decimal(1,0), 原始数据为 10，则属于可以通过类型转换但不在列声明的范围内。这种数据 strict 对其不产生影响。详细内容参考[严格模式](../../import/error-data-handling/#严格模式)。</p> |
| timezone                  | 指定导入作业所使用的时区。默认为使用 Session 的 timezone 参数。该参数会影响所有导入涉及的和时区有关的函数结果。 |
| format                    | 指定导入数据格式，默认是 CSV，支持 JSON 格式。               |
| jsonpaths                 | 当导入数据格式为 JSON 时，可以通过 jsonpaths 指定抽取 JSON 数据中的字段。例如通过以下命令指定导入 jsonpaths：`"jsonpaths" = "[\"$.userid\",\"$.username\",\"$.age\",\"$.city\"]"` |
| json_root                 | 当导入数据格式为 JSON 时，可以通过 json_root 指定 JSON 数据的根节点。Doris 将通过 json_root 抽取根节点的元素进行解析。默认为空。例如通过一下命令指定导入 JSON 根节点：`"json_root" = "$.RECORDS"` |
| strip_outer_array         | 当导入数据格式为 json 时，strip_outer_array 为 true 表示 JSON 数据以数组的形式展现，数据中的每一个元素将被视为一行数据。默认值是 false。通常情况下，Kafka 中的 JSON 数据可能以数组形式表示，即在最外层中包含中括号`[]`，此时，可以指定 `"strip_outer_array" = "true"`，以数组模式消费 Topic 中的数据。如以下数据会被解析成两行：`[{"user_id":1,"name":"Emily","age":25},{"user_id":2,"name":"Benjamin","age":35}]` |
| send_batch_parallelism    | 用于设置发送批量数据的并行度。如果并行度的值超过 BE 配置中的 `max_send_batch_parallelism_per_job`，那么作为协调点的 BE 将使用 `max_send_batch_parallelism_per_job` 的值。 |
| load_to_single_tablet     | 支持一个任务只导入数据到对应分区的一个 tablet，默认值为 false，该参数只允许在对带有 random 分桶的 olap 表导数的时候设置。 |
| partial_columns           | 指定是否开启部分列更新功能。默认值为 false。该参数只允许在表模型为 Unique 且采用 Merge on Write 时设置。一流多表不支持此参数。具体参考文档[部分列更新](../../../data-operate/update/update-of-unique-model) |
| max_filter_ratio          | 采样窗口内，允许的最大过滤率。必须在大于等于 0 到小于等于 1 之间。默认值是 1.0，表示可以容忍任何错误行。采样窗口为 `max_batch_rows * 10`。即如果在采样窗口内，错误行数/总行数大于 `max_filter_ratio`，则会导致例行作业被暂停，需要人工介入检查数据质量问题。被 where 条件过滤掉的行不算错误行。 |
| enclose                   | 指定包围符。当 CSV 数据字段中含有行分隔符或列分隔符时，为防止意外截断，可指定单字节字符作为包围符起到保护作用。例如列分隔符为 ","，包围符为 "'"，数据为 "a,'b,c'"，则 "b,c" 会被解析为一个字段。 |
| escape                    | 指定转义符。用于转义在字段中出现的与包围符相同的字符。例如数据为 "a,'b,'c'"，包围符为 "'"，希望 "b,'c 被作为一个字段解析，则需要指定单字节转义符，例如"\"，将数据修改为 "a,'b,\'c'"。 |

**04 data_source_properties 子句**

在创建 Routine Load 导入作业时，可以指定 data_source_properties 子句以指定 Kafka 数据源的属性。语法如下：

```sql
FROM KAFKA ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

data_source_properties 子句具体参数选项如下：

| 参数              | 说明                                                         |
| ----------------- | ------------------------------------------------------------ |
| kafka_broker_list | 指定 Kafka 的 broker 连接信息。格式为 `<kafka_broker_ip>:<kafka port>`。多个 broker 之间以逗号分隔。例如在 Kafka Broker 中默认端口号为 9092，可以使用以下命令指定 Broker List：`"kafka_broker_list" = "<broker1_ip>:9092,<broker2_ip>:9092"` |
| kafka_topic       | 指定要订阅的 Kafka 的 topic。一个导入作业仅能消费一个 Kafka Topic。 |
| kafka_partitions  | 指定需要订阅的 Kafka Partition。如果不指定，则默认消费所有分区。 |
| kafka_offsets     | 待销费的 Kakfa Partition 中起始消费点（offset）。如果指定时间，则会从大于等于该时间的最近一个 offset 处开始消费。offset 可以指定从大于等于 0 的具体 offset，也可以使用以下格式：<p>- OFFSET_BEGINNING: 从有数据的位置开始订阅。</p> <p>- OFFSET_END: 从末尾开始订阅。</p> <p>- 时间格式，如："2021-05-22 11:00:00"</p> <p>如果没有指定，则默认从 `OFFSET_END` 开始订阅 topic 下的所有 partition。</p> <p>可以指定多个其实消费点，使用逗号分隔，如：`"kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"`或者`"kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00"`</p> <p>注意，时间格式不能和 OFFSET 格式混用。</p> |
| property          | 指定自定义 kafka 参数。功能等同于 kafka shell 中 "--property" 参数。当参数的 Value 为一个文件时，需要在 Value 前加上关键词："FILE:"。创建文件可以参考 [CREATE FILE](../../../sql-manual/sql-statements/security/CREATE-FILE) 命令文档。更多支持的自定义参数，可以参考 librdkafka 的官方 [CONFIGURATION](https://github.com/confluentinc/librdkafka/blob/master/CONFIGURATION.md) 文档中，client 端的配置项。如：`"property.client.id" = "12345"``"property.group.id" = "group_id_0"``"property.ssl.ca.location" = "FILE:ca.pem"` |

通过配置 data_source_properties 中的 kafka property 参数，可以配置安全访问选项。目前 Doris 支持多种 Kafka 安全协议，如 plaintext（默认）、SSL、PLAIN、Kerberos 等。

### 导入状态

通过 SHOW ROUTINE LOAD 命令可以查看导入作业的状态，具体语法如下：

```sql
SHOW [ALL] ROUTINE LOAD [FOR jobName];
```

如通过 SHOW ROUTINE LOAD 会返回以下结果集示例：

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```

具体显示结果说明如下：

| 结果列               | 列说明                                                       |
| -------------------- | ------------------------------------------------------------ |
| Id                   | 作业 ID。由 Doris 自动生成。                                 |
| Name                 | 作业名称。                                                   |
| CreateTime           | 作业创建时间。                                               |
| PauseTime            | 最近一次作业暂停时间。                                       |
| EndTime              | 作业结束时间。                                               |
| DbName               | 对应数据库名称                                               |
| TableName            | 对应表名称。多表的情况下由于是动态表，因此不显示具体表名，会显示 multi-table。 |
| IsMultiTbl           | 是是否为多表                                                 |
| State                | 作业运行状态，有 5 种状态：<p>- NEED_SCHEDULE：作业等待被调度。在 CREATE ROUTINE LOAD 或 RESUME ROUTINE LOAD 后，作业会先进入到 NEED_SCHEDULE 状态；</p> <p>- RUNNING：作业运行中；</p> <p>- PAUSED：作业被暂停，可以通过 RESUME ROUTINE LOAD 恢复导入作业；</p> <p>- STOPPED：作业已结束，无法被重启；</p> <p>- CANCELLED：作业已取消。</p> |
| DataSourceType       | 数据源类型：KAFKA。                                          |
| CurrentTaskNum       | 当前子任务数量。                                             |
| JobProperties        | 作业配置详情。                                               |
| DataSourceProperties | 数据源配置详情。                                             |
| CustomProperties     | 自定义配置。                                                 |
| Statistic            | 作业运行状态统计信息。                                       |
| Progress             | 作业运行进度。对于 Kafka 数据源，显示每个分区当前已消费的 offset。如 `{"0":"2"}` 表示 Kafka 分区 0 的消费进度为 2。 |
| Lag                  | 作业延迟状态。对于 Kafka 数据源，显示每个分区的消费延迟。如 `{"0":10}` 表示 Kafka 分区 0 的消费延迟为 10。 |
| ReasonOfStateChanged | 作业状态变更的原因                                           |
| ErrorLogUrls         | 被过滤的质量不合格的数据的查看地址                           |
| OtherMsg             | 其他错误信息                                                 |

## 导入示例

### 设置导入最大容错率

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,dirty_data
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test01 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job01 ON routine_test01
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "max_filter_ratio"="0.5",
                "max_error_number" = "100",
                "strict_mode" = "true"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test01;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    +------+------------+------+
    2 rows in set (0.01 sec)
    ```

### 从指定消费点消费数据

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test02 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job02 ON routine_test02
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad02",
                "kafka_partitions" = "0",
                "kafka_offsets" = "3"
            );
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test02;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### 指定 Consumer Group 的 group.id 与 client.id

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test03 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job03 ON routine_test03
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.group.id" = "kafka_job03",
                "property.client.id" = "kafka_client_03",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test03;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    |    3 | Alexander  |   22 |
    +------+------------+------+
    3 rows in set (0.01 sec)
    ```

### 设置导入过滤条件

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test04 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job04 ON routine_test04
            COLUMNS TERMINATED BY ",",
            WHERE id >= 3
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad04",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test04;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### 导入指定分区数据

1. 导入数据样例

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test05 (
        id      INT            NOT NULL  COMMENT "ID",
        name    VARCHAR(30)    NOT NULL  COMMENT "Name",
        age     INT                      COMMENT "Age",
        date    DATETIME                 COMMENT "Date"
    )
    DUPLICATE KEY(`id`)
    PARTITION BY RANGE(`id`)
    (PARTITION partition_a VALUES [("0"), ("1")),
    PARTITION partition_b VALUES [("1"), ("2")),
    PARTITION partition_c VALUES [("2"), ("3")))
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job05 ON routine_test05
            COLUMNS TERMINATED BY ",",
            PARTITION(partition_b)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad05",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test05;
    +------+----------+------+---------------------+
    | id   | name     | age  | date                |
    +------+----------+------+---------------------+
    |    1 | Benjamin |   18 | 2024-02-04 10:00:00 |
    +------+----------+------+---------------------+
    1 rows in set (0.01 sec)
    ```

### 设置导入时区

1. 导入数据样例

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test06 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        date    DATETIME                 COMMENT "date"
    )
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job06 ON routine_test06
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "timezone" = "Asia/Shanghai"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad06",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test06;
    +------+-------------+------+---------------------+
    | id   | name        | age  | date                |
    +------+-------------+------+---------------------+
    |    1 | Benjamin    |   18 | 2024-02-04 10:00:00 |
    |    2 | Emily       |   20 | 2024-02-05 11:00:00 |
    |    3 | Alexander   |   22 | 2024-02-06 12:00:00 |
    +------+-------------+------+---------------------+
    3 rows in set (0.00 sec)
    ```
### 设置 merge_type

**指定 merge_type 进行 delete 操作**

1. 导入数据样例

```sql
3,Alexander,22
5,William,26
```

导入前表中数据如下

```sql
mysql> SELECT * FROM routine_test07;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|    1 | Benjamin       |   18 |
|    2 | Emily          |   20 |
|    3 | Alexander      |   22 |
|    4 | Sophia         |   24 |
|    5 | William        |   26 |
|    6 | Charlotte      |   28 |
+------+----------------+------+
```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test07 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job07 ON routine_test07
            WITH DELETE
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad07",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    4 | Sophia         |   24 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

**指定 merge_typpe 进行 merge 操作**

1. 导入数据样例

```sql
1,xiaoxiaoli,28
2,xiaoxiaowang,30
3,xiaoxiaoliu,32
4,dadali,34
5,dadawang,36
6,dadaliu,38
```

导入前表中数据如下：

```sql
mysql> SELECT * FROM routine_test08;
+------+----------------+------+
| id   | name           | age  |
+------+----------------+------+
|    1 | Benjamin       |   18 |
|    2 | Emily          |   20 |
|    3 | Alexander      |   22 |
|    4 | Sophia         |   24 |
|    5 | William        |   26 |
|    6 | Charlotte      |   28 |
+------+----------------+------+
6 rows in set (0.01 sec)
```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job08 ON routine_test08
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            DELETE ON id = 2
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad08",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```

4. 导入结果

```sql
mysql> SELECT * FROM routine_test08;
+------+-------------+------+
| id   | name        | age  |
+------+-------------+------+
|    1 | xiaoxiaoli  |   28 |
|    3 | xiaoxiaoliu |   32 |
|    4 | dadali      |   34 |
|    5 | dadawang    |   36 |
|    6 | dadaliu     |   38 |
+------+-------------+------+
5 rows in set (0.00 sec)
```

**指定导入需要 merge 的 sequence 列**

1. 导入数据样例

```sql
1,xiaoxiaoli,28
2,xiaoxiaowang,30
3,xiaoxiaoliu,32
4,dadali,34
5,dadawang,36
6,dadaliu,38
```

导入前表中数据如下：

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
        "function_column.sequence_col" = "age"
    );
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job09 ON routine_test09
            WITH MERGE 
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age),
            DELETE ON id = 2,
            ORDER BY age
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "strict_mode" = "false"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad09",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );   
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

### 导入完成列影射与衍生列计算

1. 导入数据样例

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test10 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job10 ON routine_test10
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age, num=age*10)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad10",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test10;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### 导入包含包围符的数据

1. 导入数据样例

    ```sql
    1,"Benjamin",18
    2,"Emily",20
    3,"Alexander",22
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test11 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job11 ON routine_test11
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "enclose" = "\""
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 导入结果

    ```sql
    mysql> SELECT * FROM routine_test11;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.02 sec)
    ```

### JSON 格式导入

**以简单模式导入 JSON 格式数据**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test12 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job12 ON routine_test12
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test12;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

**匹配模式导入复杂的 JSON 格式数据**

1. 导入数据样例

    ```sql
    { "name" : "Benjamin", "id" : 1, "num":180 , "age":18 }
    { "name" : "Emily", "id" : 2, "num":200 , "age":20 }
    { "name" : "Alexander", "id" : 3, "num":220 , "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test13 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job13 ON routine_test13
            COLUMNS(name, id, num, age)
            PROPERTIES
            (
                "format" = "json",
                "jsonpaths" = "[\"$.name\",\"$.id\",\"$.num\",\"$.age\"]"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad13",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test13;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

**指定 JSON 根节点导入数据**

1. 导入数据样例

    ```sql
    {"id": 1231, "source" :{ "id" : 1, "name" : "Benjamin", "age":18 }}
    {"id": 1232, "source" :{ "id" : 2, "name" : "Emily", "age":20 }}
    {"id": 1233, "source" :{ "id" : 3, "name" : "Alexander", "age":22 }}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test14 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job14 ON routine_test14
            PROPERTIES
            (
                "format" = "json",
                "json_root" = "$.source"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad14",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test14;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**导入完成列影射与衍生列计算**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test15 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job15 ON routine_test15
            COLUMNS(id, name, age, num=age*10)
            PROPERTIES
            (
                "format" = "json",
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad15",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test15;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### 导入复杂类型

**导入 Array 数据类型**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "array":[1,2,3,4,5]}
    { "id" : 2, "name" : "Emily", "age":20, "array":[6,7,8,9,10]}
    { "id" : 3, "name" : "Alexander", "age":22, "array":[11,12,13,14,15]}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test16
    (
        id      INT             NOT NULL  COMMENT "id",
        name    VARCHAR(30)     NOT NULL  COMMENT "name",
        age     INT                       COMMENT "age",
        array   ARRAY<int(11)>  NULL      COMMENT "test array column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job16 ON routine_test16
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad16",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test16;
    +------+----------------+------+----------------------+
    | id   | name           | age  | array                |
    +------+----------------+------+----------------------+
    |    1 | Benjamin       |   18 | [1, 2, 3, 4, 5]      |
    |    2 | Emily          |   20 | [6, 7, 8, 9, 10]     |
    |    3 | Alexander      |   22 | [11, 12, 13, 14, 15] |
    +------+----------------+------+----------------------+
    3 rows in set (0.00 sec)
    ```

**导入 Map 数据类型**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "map":{"a": 100, "b": 200}}
    { "id" : 2, "name" : "Emily", "age":20, "map":{"c": 300, "d": 400}}
    { "id" : 3, "name" : "Alexander", "age":22, "map":{"e": 500, "f": 600}}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test17 (
        id      INT                 NOT NULL  COMMENT "id",
        name    VARCHAR(30)         NOT NULL  COMMENT "name",
        age     INT                           COMMENT "age",
        map     Map<STRING, INT>    NULL      COMMENT "test column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job17 ON routine_test17
        PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad17",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test17;
    +------+----------------+------+--------------------+
    | id   | name           | age  | map                |
    +------+----------------+------+--------------------+
    |    1 | Benjamin       |   18 | {"a":100, "b":200} |
    |    2 | Emily          |   20 | {"c":300, "d":400} |
    |    3 | Alexander      |   22 | {"e":500, "f":600} |
    +------+----------------+------+--------------------+
    3 rows in set (0.01 sec)
    ```

**导入 Bitmap 数据类型**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "bitmap_id":243}
    { "id" : 2, "name" : "Emily", "age":20, "bitmap_id":28574}
    { "id" : 3, "name" : "Alexander", "age":22, "bitmap_id":8573}
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test18 (
        id        INT            NOT NULL      COMMENT "id",
        name      VARCHAR(30)    NOT NULL      COMMENT "name",
        age       INT                          COMMENT "age",
        bitmap_id INT                          COMMENT "test",
        device_id BITMAP         BITMAP_UNION  COMMENT "test column"
    )
    AGGREGATE KEY (`id`,`name`,`age`,`bitmap_id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job18 ON routine_test18
            COLUMNS(id, name, age, bitmap_id, device_id=to_bitmap(bitmap_id))
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad18",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 导入结果

    ```sql
    mysql> select id, BITMAP_UNION_COUNT(pv) over(order by id) uv from(
        ->    select id, BITMAP_UNION(device_id) as pv
        ->    from routine_test18 
        -> group by id 
        -> ) final;
    +------+------+
    | id   | uv   |
    +------+------+
    |    1 |    1 |
    |    2 |    2 |
    |    3 |    3 |
    +------+------+
    3 rows in set (0.00 sec)
    ```

**导入 HLL 数据类型**

1. 导入数据样例

    ```sql
    2022-05-05,10001,Test01,Beijing,windows
    2022-05-05,10002,Test01,Beijing,linux
    2022-05-05,10003,Test01,Beijing,macos
    2022-05-05,10004,Test01,Hebei,windows
    2022-05-06,10001,Test01,Shanghai,windows
    2022-05-06,10002,Test01,Shanghai,linux
    2022-05-06,10003,Test01,Jiangsu,macos
    2022-05-06,10004,Test01,Shaanxi,windows
    ```

2. 建表结构

    ```sql
    create table demo.routine_test19 (
        dt        DATE,
        id        INT,
        name      VARCHAR(10),
        province  VARCHAR(10),
        os        VARCHAR(10),
        pv        hll hll_union
    )
    Aggregate KEY (dt,id,name,province,os)
    distributed by hash(id) buckets 10;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job19 ON routine_test19
            COLUMNS TERMINATED BY ",",
            COLUMNS(dt, id, name, province, os, pv=hll_hash(id))
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad19",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test19;
    +------------+-------+----------+----------+---------+------+
    | dt         | id    | name     | province | os      | pv   |
    +------------+-------+----------+----------+---------+------+
    | 2022-05-05 | 10001 | Test01   | Beijing     | windows | NULL |
    | 2022-05-06 | 10001 | Test01   | Shanghai    | windows | NULL |
    | 2022-05-05 | 10002 | Test01   | Beijing     | linux   | NULL |
    | 2022-05-06 | 10002 | Test01   | Shanghai    | linux   | NULL |
    | 2022-05-05 | 10004 | Test01   | Heibei      | windows | NULL |
    | 2022-05-06 | 10004 | Test01   | Shanxi      | windows | NULL |
    | 2022-05-05 | 10003 | Test01   | Beijing     | macos   | NULL |
    | 2022-05-06 | 10003 | Test01   | Jiangsu     | macos   | NULL |
    +------------+-------+----------+----------+---------+------+
    8 rows in set (0.01 sec)

    mysql> SELECT HLL_UNION_AGG(pv) FROM routine_test19;
    +-------------------+
    | hll_union_agg(pv) |
    +-------------------+
    |                 4 |
    +-------------------+
    1 row in set (0.01 sec)
    ```

### Kafka 安全认证

**导入 SSL 认证的 Kafka 数据**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test20 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job20 ON routine_test20
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad21",
                "property.security.protocol" = "ssl",
                "property.ssl.ca.location" = "FILE:ca.pem",
                "property.ssl.certificate.location" = "FILE:client.pem",
                "property.ssl.key.location" = "FILE:client.key",
                "property.ssl.key.password" = "ssl_passwd"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test20;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**导入 Kerberos 认证的 Kafka 数据**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test21 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job21 ON routine_test21
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad21",
                "property.security.protocol" = "SASL_PLAINTEXT",
                "property.sasl.kerberos.service.name" = "kafka",
                "property.sasl.kerberos.keytab" = "/etc/krb5.keytab",
                "property.sasl.kerberos.keytab"="/opt/third/kafka/kerberos/kafka_client.keytab",
                "property.sasl.kerberos.principal" = "clients/stream.dt.local@EXAMPLE.COM"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test21;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

**导入 PLAIN 认证的 Kafka 集群**

1. 导入数据样例

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 建表结构

    ```sql
    CREATE TABLE demo.routine_test22 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 导入命令

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job22 ON routine_test22
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "192.168.100.129:9092",
                "kafka_topic" = "routineLoad22",
                "property.security.protocol"="SASL_PLAINTEXT",
                "property.sasl.mechanism"="PLAIN",
                "property.sasl.username"="admin",
                "property.sasl.password"="admin"
            );  
    ```

4. 导入结果

    ```sql
    mysql> select * from routine_test22;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

### 一流多表导入

为 example_db 创建一个名为 test1 的 Kafka 例行动态多表导入任务。指定列分隔符和 group.id 和 client.id，并且自动默认消费所有分区，且从有数据的位置（OFFSET_BEGINNING）开始订阅。

这里假设需要将 Kafka 中的数据导入到 example_db 中的 tbl1 以及 tbl2 表中，我们创建了一个名为 test1 的例行导入任务，同时将名为 `my_topic` 的 Kafka 的 Topic 数据同时导入到 tbl1 和 tbl2 中的数据中，这样就可以通过一个例行导入任务将 Kafka 中的数据导入到两个表中。

```sql
CREATE ROUTINE LOAD example_db.test1
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

这个时候需要 Kafka 中的数据包含表名的信息。目前仅支持从 Kafka 的 Value 中获取动态表名，且需要符合这种格式：以 JSON 为例：`table_name|{"col1": "val1", "col2": "val2"}`, 其中 `tbl_name` 为表名，以 `|` 作为表名和表数据的分隔符。CSV 格式的数据也是类似的，如：`table_name|val1,val2,val3`。注意，这里的 `table_name` 必须和 Doris 中的表名一致，否则会导致导入失败。注意，动态表不支持后面介绍的 column_mapping 配置。

### 严格模式导入

为 example_db 的 example_tbl 创建一个名为 test1 的 Kafka 例行导入任务。导入任务为严格模式。

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
PRECEDING FILTER k1 = 1,
WHERE k1 < 100 and k2 like "%doris%"
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic"
);
```

## 更多帮助

参考 SQL 手册 [Routine Load](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)。也可以在客户端命令行下输入 `HELP ROUTINE LOAD` 获取更多帮助信息。