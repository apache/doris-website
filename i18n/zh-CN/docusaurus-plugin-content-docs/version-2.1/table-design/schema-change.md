---
{
    "title": "Schema 变更",
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

用户可以通过 Schema Change 操作来修改已存在表的 Schema。表的 Schema，主要包括对列的修改和索引的改动，这里主要介绍列相关的 Scheme 变更，关于索引相关的变更，可以查看数据表设计/表索引来查看每种索引的变更方式。

## 名词解释

- Base Table：基表。使用建表语句创建出的原始表。

- Rollup：基于基表或者其他 Rollup 创建出来的上卷表。

- Index：物化索引。Rollup 和 Base Table 都被称为物化索引。

- Transaction：事务。每一个导入任务都对应一个事务，每个事务有一个唯一递增的 Transaction ID。

## 原理介绍

**概览**

Schema Change 的实现分为两个大类：轻量级Schema Change和重量级Schema Change。

- 轻量级Schema Change完成速度很快，只会同步地修改FE的元数据，一般在秒级别完成。增加或删除value列、更改列名、增加除DUP KEY列和UNIQUE KEY列以外的VARCHAR列的长度，都会使用轻量级Schema Change的逻辑。

- 重量级Schema Change需要依赖BE进行数据文件的转换。具体实现方式如下：

    |Schema change实现| 主要逻辑 | 使用场景 |
    |-----------------|---------|----------|
    | Direct Schema Change | 对数据文件进行整体重写，但是不会涉及重排序 | 更改value列的数据类型 |
    | Sort Schema Change | 对数据文件进行整体重写，并进行重排序 | 更改key列的数据类型 |
    | Hard Linked Schema Change | 对数据文件进行重新链接，不需要直接修改数据文件 | 在列的变更中被轻量级Schema Change取代 |

**主要流程**

对于轻量级Schema Change，只会在Alter命令发起后修改FE的相应元数据，Alter命令的返回就代表Schema变更的结束。

对于重量级Schema Change，在用户发起Alter命令后，会在后台启动一个任务进行Schema的变更，命令的返回代表着Schema变更任务的提交成功。后台任务的执行将经过以下过程：

1. 对目标表的每个tablet，都根据变更后的schema创建对应的new tablet，用于存放转换后的数据。
2. 等待先前的所有导入事务结束，才能开始数据转换。
3. 开始数据转换，按tablet为任务单位，把每个旧tablet上的数据经过变更写入到之前新建的tablet上。三种重量级Schema Change的差异在这一步上，会通过上文提到的各自实现逻辑进行数据转换。
4. 数据转换开始后，如果有新的导入事务创建，为保证数据完整性，新的导入事务将同时为旧tablet和新tablet生成数据，即数据双写。双写期间的数据必须兼容新、旧Schema，否则会导入失败。
    ```Plain
    +----------+
    | Load Job |
    +----+-----+
        |
        | Load job generates both origin and new Index data
        |
        |      +------------------+ +---------------+
        |      | Origin Index     | | Origin Index  |
        +------> New Incoming Data| | History Data  |
        |      +------------------+ +------+--------+
        |                                  |
        |                                  | Convert history data
        |                                  |
        |      +------------------+ +------v--------+
        |      | New Index        | | New Index     |
        +------> New Incoming Data| | History Data  |
                +------------------+ +---------------+
    ```
5. 数据转换完成后，所有存放旧数据的tablet将会被删除，所有完成数据变更的新tablet将会取代旧tablet进行服务。

创建 Schema Change 的具体语法可以查看帮助 [ALTER TABLE COLUMN](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN) 中 Schema Change 部分的说明。

## 向指定 Index 的指定位置添加一列

### 语法

```sql
ALTER TABLE table_name ADD COLUMN column_name column_type [KEY | agg_type] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- 聚合模型如果增加 Value 列，需要指定 `agg_type`

- 非聚合模型（如 DUPLICATE KEY）如果增加 Key 列，需要指定 `KEY` 关键字

- 不能在 Rollup Index 中增加 Base Index 中已经存在的列（如有需要，可以重新创建一个 Rollup Index）

### 示例

#### 非聚合模型

建表语句：

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int,
    col5 int
) DUPLICATE KEY(col1, col2, col3)
DISTRIBUTED BY RANDOM BUCKETS 1
ROLLUP (
    example_rollup_index (col1, col3, col4, col5)
)
PROPERTIES (
    "replication_num" = "1"
)
```

**1. 向 `example_rollup_index` 的 col1 后添加一个 Key 列 `new_col`**

```sql
ALTER TABLE example_db.my_table
ADD COLUMN new_col INT KEY DEFAULT "0" AFTER col1
TO example_rollup_index;
```

**2. 向 `example_rollup_index` 的 col1 后添加一个 Value 列 `new_col`**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

#### 聚合模型

建表语句：

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 1
ROLLUP (
    example_rollup_index (col1, col3, col4, col5)
)
PROPERTIES (
    "replication_num" = "1"
)
```

**3. 向 `example_rollup_index` 的 col1 后添加一个 Key 列 `new_col`**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

**4. 向 `example_rollup_index` 的 col1 后添加一个 Value 列 `new_co``l` SUM 聚合类型**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT SUM DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

## 向指定 Index 添加多列

### 语法

```sql
ALTER TABLE table_name ADD COLUMN (column_name1 column_type [KEY | agg_type] DEFAULT "default_value", ...)
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- 聚合模型如果增加 Value 列，需要指定 `agg_type`

- 聚合模型如果增加 Key 列，需要指定 KEY 关键字

- 不能在 Rollup Index 中增加 Base Table 中已经存在的列（如有需要，可以重新创建一个 Rollup Index）

### 示例

向 `example_rollup_index`添加多列 (聚合模型)

```sql
ALTER TABLE example_db.my_table
ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0")
TO example_rollup_index;
```

## 从指定 Index 中删除一列

### 语法

```sql
ALTER TABLE table_name DROP COLUMN column_name
[FROM rollup_index_name]
```

- 不能删除分区列

- 如果是从 Base Table 中删除列，则如果 Rollup Index 中包含该列，也会被删除

### 示例

从 `example_rollup_index` 删除一列

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col3
FROM example_rollup_index;
```

## 修改指定 Index 的列类型以及列位置

### 语法

```sql
ALTER TABLE table_name MODIFY COLUMN column_name column_type [KEY | agg_type] [NULL | NOT NULL] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- 聚合模型如果修改 Value 列，需要指定 `agg_type`

- 非聚合类型如果修改 Key 列，需要指定 **KEY** 关键字

- 只能修改列的类型，列的其他属性维持原样（即其他属性需在语句中按照原属性显式的写出，参见 Example 8）

- 分区列和分桶列不能做任何修改

- 目前支持以下类型的转换（用户需要注意精度损失）

  - TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE 类型向范围更大的数字类型转换

  - TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL 转换成 VARCHAR

  - VARCHAR 支持修改最大长度

  - VARCHAR/CHAR 转换成 TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE

  - VARCHAR/CHAR 转换成 DATE (目前支持"%Y-%m-%d", "%y-%m-%d", "%Y%m%d", "%y%m%d", "%Y/%m/%d, "%y/%m/%d" 六种格式化格式)

  - DATETIME 转换成 DATE (仅保留年 - 月 - 日信息，例如： `2019-12-09 21:47:05` <--> `2019-12-09`)

  - DATE 转换成 DATETIME (时分秒自动补零，例如： `2019-12-09` <--> `2019-12-09 00:00:00`)

  - FLOAT 转换成 DOUBLE

  - INT 转换成 DATE (如果 INT 类型数据不合法则转换失败，原始数据不变)

  - 除 DATE 与 DATETIME 以外都可以转换成 STRING，但是 STRING 不能转换任何其他类型

### 示例

建表语句：

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col0 int,
    col1 int DEFAULT "1",
    col2 int,
    col3 varchar(32),
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col0, col1, col2, col3)
DISTRIBUTED BY HASH(col0) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
)
```

**1.  修改 Base Index 的 Key 列 col1 的类型为 BIGINT，并移动到 col2 列后面。**

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
```

注意：无论是修改 Key 列还是 Value 列都需要声明完整的 Column 信息

**2. 修改 Base Index 的 val1 列最大长度。原 val1 为 (val1 VARCHAR(32) REPLACE DEFAULT "abc")**

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
```

注意：只能修改列的类型，列的其他属性需要维持原样

**3. 修改 Duplicate Key 表 Key 列的某个字段的长度**

```sql
ALTER TABLE example_db.my_table
MODIFY COLUMN col3 varchar(50) KEY NULL comment 'to 50'
```

## 对指定 Index 的列进行重新排序

### 语法

```sql
ALTER TABLE table_name ORDER BY (column_name1, column_name2, ...)
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

- Index 中的所有列都要写出来

- Value 列在 Key 列之后

### 示例

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    k1 int DEFAULT "1",
    k2 int,
    k3 varchar(32),
    k4 date,
    v1 int SUM,
    v2 int MAX,
) AGGREGATE KEY(k1, k2, k3, k4)
DISTRIBUTED BY HASH(k1) BUCKETS 1
ROLLUP (
   example_rollup_index(k1, k2, k3, v1, v2)
)
PROPERTIES (
    "replication_num" = "1"
)
```

重新排序 `example_rollup_index` 中的列（设原列顺序为：k1, k2, k3, v1, v2）

```sql
ALTER TABLE example_db.my_table
ORDER BY (k3,k1,k2,v2,v1)
FROM example_rollup_index;
```

## 一次提交进行多种变更

Schema Change 可以在一个作业中，对多个 Index 进行不同的修改。

### 示例 1

源 Schema：

```sql
CREATE TABLE IF NOT EXISTS example_db.tbl1(
    k1 int,
    k2 int,
    k3 int
) AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(k1) BUCKETS 1
ROLLUP (
   rollup1 (k1, k2),
   rollup2 (k2)
)
PROPERTIES (
    "replication_num" = "1"
)
```

可以通过以下命令给 rollup1 和 rollup2 都加入一列 k4，并且再给 rollup2 加入一列 k5：

```sql
ALTER TABLE tbl1
ADD COLUMN k4 INT default "1" to rollup1,
ADD COLUMN k4 INT default "1" to rollup2,
ADD COLUMN k5 INT default "1" to rollup2;
```

完成后，Schema 变为：

```Plain
+-----------+-------+------+------+------+---------+-------+
| IndexName | Field | Type | Null | Key  | Default | Extra |
+-----------+-------+------+------+------+---------+-------+
| tbl1      | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k3    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
|           | k5    | INT  | No   | true | 1       |       |
|           |       |      |      |      |         |       |
| rollup2   | k2    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
|           | k5    | INT  | No   | true | 1       |       |
|           |       |      |      |      |         |       |
| rollup1   | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k4    | INT  | No   | true | 1       |       |
+-----------+-------+------+------+------+---------+-------+
```

可以看到，Base 表 tbl1 也自动加入了 k4, k5 列。即给任意 Rollup 增加的列，都会自动加入到 Base 表中。

同时，不允许向 Rollup 中加入 Base 表已经存在的列。如果用户需要这样做，可以重新建立一个包含新增列的 Rollup，之后再删除原 Rollup。

### 示例 2

建表语句

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    k1 int DEFAULT "1",
    k2 int,
    k3 varchar(32),
    k4 date,
    v1 int SUM,
) AGGREGATE KEY(k1, k2, k3, k4)
DISTRIBUTED BY HASH(k1) BUCKETS 1
ROLLUP (
    example_rollup_index(k1, k3, k2, v1)
)
PROPERTIES (
    "replication_num" = "1"
)
```

```sql
ALTER TABLE example_db.my_table
ADD COLUMN v2 INT MAX DEFAULT "0" TO example_rollup_index,
ORDER BY (k3,k1,k2,v2,v1) FROM example_rollup_index;
```

## 修改列名称

语法

```sql
ALTER TABLE RENAME COLUMN old_column_name new_column_name;    
```

## 查看作业

用户可以通过 `SHOW ALTER TABLE COLUMN` 命令来查看schema change作业进度。

`SHOW ALTER TABLE COLUMN` 可以查看当前正在执行或已经完成的 Schema Change 作业。当一次 Schema Change 作业涉及到多个 Index 时，该命令会显示多行，每行对应一个 Index。举例如下：

```sql
mysql > SHOW ALTER TABLE COLUMN\G;
*************************** 1. row ***************************
        JobId: 20021
    TableName: tbl1
   CreateTime: 2019-08-05 23:03:13
   FinishTime: 2019-08-05 23:03:42
    IndexName: tbl1
      IndexId: 20022
OriginIndexId: 20017
SchemaVersion: 2:792557838
TransactionId: 10023
        State: FINISHED
          Msg: 
     Progress: NULL
      Timeout: 86400
1 row in set (0.00 sec)
```

- JobId：每个 Schema Change 作业的唯一 ID。

- TableName：Schema Change 对应的基表的表名。

- CreateTime：作业创建时间。

- FinishedTime：作业结束时间。如未结束，则显示 "N/A"。

- IndexName：本次修改所涉及的某一个 Index 的名称。

- IndexId：新的 Index 的唯一 ID。

- OriginIndexId：旧的 Index 的唯一 ID。

- SchemaVersion：以 M:N 的格式展示。其中 M 表示本次 Schema Change 变更的版本，N 表示对应的 Hash 值。每次 Schema Change，版本都会递增。

- TransactionId：转换历史数据的分水岭 Transaction ID。

- State：作业所在阶段。

  - PENDING：作业在队列中等待被调度。

  - WAITING_TXN：等待分水岭 Transaction ID 之前的导入任务完成。

  - RUNNING：历史数据转换中。

  - FINISHED：作业成功。

  - CANCELLED：作业失败。

- Msg：如果作业失败，这里会显示失败信息。

- Progress：作业进度。只有在 RUNNING 状态才会显示进度。进度是以 M/N 的形式显示。其中 N 为 Schema Change 涉及的总副本数。M 为已完成历史数据转换的副本数。

- Timeout：作业超时时间。单位秒。

## 取消作业

在作业状态不为 FINISHED 或 CANCELLED 的情况下，可以通过以下命令取消 Schema Change 作业：

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## 注意事项

- 一张表在同一时间只能有一个 Schema Change 作业在运行。

- Schema Change 操作不阻塞导入和查询操作。除非操作本身影响了表的元数据（例如自动分区表导入过程中创建了分区）

- 分区列和分桶列不能修改。

- 如果 Schema 中有 REPLACE 方式聚合的 Value 列，则不允许删除 Key 列。

- 如果删除 Key 列，Doris 无法决定 REPLACE 列的取值。

- Unique 数据模型表的所有非 Key 列都是 REPLACE 聚合方式。

- 在新增聚合类型为 SUM 或者 REPLACE 的 Value 列时，该列的默认值对历史数据没有含义。

- 因为历史数据已经失去明细信息，所以默认值的取值并不能实际反映聚合后的取值。

- 当修改列类型时，除 Type 以外的字段都需要按原列上的信息补全。

- 如修改列 `k1 INT SUM NULL DEFAULT "1"` 类型为 BIGINT，则需执行命令如下：

- `ALTER TABLE tbl1 MODIFY COLUMN`k1`BIGINT SUM NULL DEFAULT "1";`

- 注意，除新的列类型外，如聚合方式，Nullable 属性，以及默认值都要按照原信息补全。

- 不支持修改聚合类型、Nullable 属性、默认值。

## 常见问题

**Schema Change 的执行速度**

Light Schema Change，即如果是增加和删除 Value 列，则可以毫秒级返回。其它的 Schema Change 执行速度按照最差效率估计约为 10MB/s。保守起见，用户可以根据这个速率来设置作业的超时时间。

**提交作业报错 `Table xxx is not stable. ...`**

Schema Change 只有在表数据完整且非均衡状态下才可以开始。如果表的某些数据分片副本不完整，或者某些副本正在进行均衡操作，则提交会被拒绝。数据分片副本是否完整，可以通过以下命令查看：

```sql
SHOW REPLICA STATUS FROM tbl WHERE STATUS != "OK";
```

如果有返回结果，则说明有副本有问题。通常系统会自动修复这些问题，用户也可以通过以下命令优先修复这个表：

```sql
ADMIN REPAIR TABLE tbl1;
```

用户可以通过以下命令查看是否有正在运行的均衡任务：

```sql
SHOW PROC "/cluster_balance/pending_tablets";
```

可以等待均衡任务完成，或者通过以下命令临时禁止均衡操作：

```sql
ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
```

## 相关配置

### FE 配置

- `alter_table_timeout_second`：作业默认超时时间，86400 秒。

### BE 配置

- `alter_tablet_worker_count`：在 BE 端用于执行历史数据转换的线程数。默认为 3。如果希望加快 Schema Change 作业的速度，可以适当调大这个参数后重启 BE。但过多的转换线程可能会导致 IO 压力增加，影响其他操作。该线程和 Rollup 作业共用。

- `alter_index_worker_count`：在 BE 端用于执行历史数据构建索引的线程数（注：当前只支持倒排索引）。默认为 3。如果希望加快 Index Change 作业的速度，可以适当调大这个参数后重启 BE。但过多的线程可能会导致 IO 压力增加，影响其他操作。

## 更多参考

关于 Schema Change 使用的更多详细语法及最佳实践，请参阅 [ALTER TABLE COLUMN](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN) 命令手册。