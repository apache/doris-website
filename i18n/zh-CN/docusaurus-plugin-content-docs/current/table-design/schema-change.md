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

-   Base Table：基表。每一个表被创建时，都对应一个基表。

-   Rollup：基于基表或者其他 Rollup 创建出来的上卷表。

-   Index：物化索引。Rollup 或 Base Table 都被称为物化索引。

-   Transaction：事务。每一个导入任务都是一个事务，每个事务有一个唯一递增的 Transaction ID。

## 原理介绍

**Light Schema Change**

在正式介绍以前，需要认识一下 Apache Doris 1.2.0 版本之前的 3 种 Schema Change 实现，这三种方式都是异步的：

-   Hard Linked Schema Change 主要作用于加减 Value 列，不需要对数据文件有修改。

-   Direct Schema Change 主要作用于改变 Value 列的类型，需要对数据进行重写，但不涉及到 Key 列，无需重新排序。

-   Sort Schema Change 主要是作用于对 key 列进行的 Schema Change，由于对 Key 列进行加/减/修改类型等操作都会影响到已有数据的排序，所以需要把数据重新读出来，修改后，然后再进行排序。

从 Apache Doris 1.2.0 以后，针对第一种，引入了 Light Schema Change 新特性，新的 Light Schema Change 使得增减 Value 列可以在毫秒级完成。从 Apache Doris 2.0.0 开始，所有的新建表都默认启用了 Light Schema Change。

**除了对 Value 列的增加和删除，其它类型的 Schema 变更的主要原理如下**

执行 Schema Change 的基本过程，是通过原表 /Index 的数据，生成一份新 Schema 的表 /Index 数据。其中主要需要进行两部分数据转换，一是已存在的历史数据的转换，二是在 Schema Change 执行过程中，新到达的导入数据的转换。

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

在开始转换历史数据之前，Doris 会获取一个最新的 Transaction ID。并等待这个 Transaction ID 之前的所有导入事务完成。这个 Transaction ID 成为分水岭。意思是，Doris 保证在分水岭之后的所有导入任务，都会同时为原表 /Index 和新表 /Index 生成数据。这样当历史数据转换完成后，可以保证新的表中的数据是完整的。

创建 Schema Change 的具体语法可以查看帮助 [ALTER TABLE COLUMN](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN) 中 Schema Change 部分的说明。

## 向指定 Index 的指定位置添加一列

### 语法

```sql
ALTER TABLE table_name ADD COLUMN column_name column_type [KEY | agg_type] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

-   聚合模型如果增加 Value 列，需要指定 `agg_type`

-   非聚合模型（如 DUPLICATE KEY）如果增加 Key 列，需要指定 `KEY` 关键字

-   不能在 Rollup Index 中增加 Base Index 中已经存在的列（如有需要，可以重新创建一个 Rollup Index）

### 示例

**1. 向 `example_rollup_index ` 的 col1 后添加一个 Key 列 `new_col` (非聚合模型)**

```sql
ALTER TABLE example_db.my_table
ADD COLUMN new_col INT KEY DEFAULT "0" AFTER col1
TO example_rollup_index;
```

**2. 向 `example_rollup_index` 的 col1 后添加一个 Value 列 `new_col` (非聚合模型)**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

**3. 向 `example_rollup_index` 的 col1 后添加一个 Key 列 `new_col` (聚合模型)**

```sql
ALTER TABLE example_db.my_table   
ADD COLUMN new_col INT DEFAULT "0" AFTER col1    
TO example_rollup_index;
```

**4. 向 `example_rollup_index` 的 col1 后添加一个 Value 列 `new_co``l` SUM 聚合类型 (聚合模型)**

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

- 不能在 Rollup Index 中增加 Base Index 中已经存在的列（如有需要，可以重新创建一个 Rollup Index）

### 示例

向 `example_rollup_index`添加多列 (聚合模型)

```sql
ALTER TABLE example_db.my_table
ADD COLUMN (col1 INT DEFAULT "1", col2 FLOAT SUM DEFAULT "2.3")
TO example_rollup_index;
```

## 从指定 Index 中删除一列

### 语法

```sql
ALTER TABLE table_name DROP COLUMN column_name
[FROM rollup_index_name]
```

-   不能删除分区列

-   如果是从 Base Index 中删除列，则如果 Rollup Index 中包含该列，也会被删除

### 示例

从 `example_rollup_index` 删除一列

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
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

-   聚合模型如果修改 Value 列，需要指定 `agg_type`

-   非聚合类型如果修改 Key 列，需要指定 **KEY** 关键字

-   只能修改列的类型，列的其他属性维持原样（即其他属性需在语句中按照原属性显式的写出，参见 Example 8）

-   分区列和分桶列不能做任何修改

-   目前支持以下类型的转换（精度损失由用户保证）

    -   TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE 类型向范围更大的数字类型转换

    -   TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL 转换成 VARCHAR

    -   VARCHAR 支持修改最大长度

    -   VARCHAR/CHAR 转换成 TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE

    -   VARCHAR/CHAR 转换成 DATE (目前支持"%Y-%m-%d", "%y-%m-%d", "%Y%m%d", "%y%m%d", "%Y/%m/%d, "%y/%m/%d" 六种格式化格式)

    -   DATETIME 转换成 DATE (仅保留年 - 月 - 日信息，例如： `2019-12-09 21:47:05` <--> `2019-12-09`)

    -   DATE 转换成 DATETIME (时分秒自动补零，例如： `2019-12-09` <--> `2019-12-09 00:00:00`)

    -   FLOAT 转换成 DOUBLE

    -   INT 转换成 DATE (如果 INT 类型数据不合法则转换失败，原始数据不变)

    -   除 DATE 与 DATETIME 以外都可以转换成 STRING，但是 STRING 不能转换任何其他类型

### 示例

**1.  修改 Base Index 的 Key 列 col1 的类型为 BIGINT，并移动到 col2 列后面。**

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
```

注意：无论是修改 Key 列还是 Value 列都需要声明完整的 Column 信息

**2. 修改 Base Index 的 val1 列最大长度。原 val1 为 (val1 VARCHAR(32) REPLACE DEFAULT "abc")**

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN val1 VARCHAR(64) REPLACE DEFAULT "abc";
```

注意：只能修改列的类型，列的其他属性维持原样

**3. 修改 Duplicate Key 表 Key 列的某个字段的长度**

```sql
alter table example_tbl modify column k3 varchar(50) key null comment 'to 50'
```

## 对指定 Index 的列进行重新排序

### 语法

```sql
ALTER TABLE table_name ORDER BY (column_name1, column_name2, ...)
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

-   Index 中的所有列都要写出来

-   Value 列在 Key 列之后

### 示例

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

```Plain
+-----------+-------+------+------+------+---------+-------+
| IndexName | Field | Type | Null | Key  | Default | Extra |
+-----------+-------+------+------+------+---------+-------+
| tbl1      | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
|           | k3    | INT  | No   | true | N/A     |       |
|           |       |      |      |      |         |       |
| rollup2   | k2    | INT  | No   | true | N/A     |       |
|           |       |      |      |      |         |       |
| rollup1   | k1    | INT  | No   | true | N/A     |       |
|           | k2    | INT  | No   | true | N/A     |       |
+-----------+-------+------+------+------+---------+-------+
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

```sql
ALTER TABLE example_db.my_table
ADD COLUMN v2 INT MAX DEFAULT "0" AFTER k2 TO example_rollup_index,
ORDER BY (k3,k1,k2,v2,v1) FROM example_rollup_index;
```

## 修改列名称

语法

```sql
ALTER TABLE RENAME COLUMN old_column_name new_column_name;    
```

## 查看作业

Schema Change 的创建是一个异步过程，作业提交成功后，用户需要通过 `SHOW ALTER TABLE COLUMN` 命令来查看作业进度。

`SHOW ALTER TABLE COLUMN` 可以查看当前正在执行或已经完成的 Schema Change 作业。当一次 Schema Change 作业涉及到多个 Index 时，该命令会显示多行，每行对应一个 Index。举例如下：

```sql
mysql SHOW ALTER TABLE COLUMN\G;
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

-   JobId：每个 Schema Change 作业的唯一 ID。

-   TableName：Schema Change 对应的基表的表名。

-   CreateTime：作业创建时间。

-   FinishedTime：作业结束时间。如未结束，则显示 "N/A"。

-   IndexName：本次修改所涉及的某一个 Index 的名称。

-   IndexId：新的 Index 的唯一 ID。

-   OriginIndexId：旧的 Index 的唯一 ID。

-   SchemaVersion：以 M:N 的格式展示。其中 M 表示本次 Schema Change 变更的版本，N 表示对应的 Hash 值。每次 Schema Change，版本都会递增。

-   TransactionId：转换历史数据的分水岭 Transaction ID。

-   State：作业所在阶段。

    -   PENDING：作业在队列中等待被调度。

    -   WAITING_TXN：等待分水岭 Transaction ID 之前的导入任务完成。

    -   RUNNING：历史数据转换中。

    -   FINISHED：作业成功。

    -   CANCELLED：作业失败。

-   Msg：如果作业失败，这里会显示失败信息。

-   Progress：作业进度。只有在 RUNNING 状态才会显示进度。进度是以 M/N 的形式显示。其中 N 为 Schema Change 涉及的总副本数。M 为已完成历史数据转换的副本数。

-   Timeout：作业超时时间。单位秒。

## 取消作业

在作业状态不为 FINISHED 或 CANCELLED 的情况下，可以通过以下命令取消 Schema Change 作业：

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## 注意事项

-   一张表在同一时间只能有一个 Schema Change 作业在运行。

-   Schema Change 操作不阻塞导入和查询操作。除非操作本身影响了表的元数据（例如自动分区表导入过程中创建了分区）

-   分区列和分桶列不能修改。

-   如果 Schema 中有 REPLACE 方式聚合的 Value 列，则不允许删除 Key 列。

-   如果删除 Key 列，Doris 无法决定 REPLACE 列的取值。

-   Unique 数据模型表的所有非 Key 列都是 REPLACE 聚合方式。

-   在新增聚合类型为 SUM 或者 REPLACE 的 Value 列时，该列的默认值对历史数据没有含义。

-   因为历史数据已经失去明细信息，所以默认值的取值并不能实际反映聚合后的取值。

-   当修改列类型时，除 Type 以外的字段都需要按原列上的信息补全。

-   如修改列 `k1 INT SUM NULL DEFAULT "1"` 类型为 BIGINT，则需执行命令如下：

-   `ALTER TABLE tbl1 MODIFY COLUMN `k1` BIGINT SUM NULL DEFAULT "1";`

-   注意，除新的列类型外，如聚合方式，Nullable 属性，以及默认值都要按照原信息补全。

-   不支持修改列名称、聚合类型、Nullable 属性、默认值以及列注释。

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

-   `alter_table_timeout_second`：作业默认超时时间，86400 秒。

### BE 配置

-   `alter_tablet_worker_count`：在 BE 端用于执行历史数据转换的线程数。默认为 3。如果希望加快 Schema Change 作业的速度，可以适当调大这个参数后重启 BE。但过多的转换线程可能会导致 IO 压力增加，影响其他操作。该线程和 Rollup 作业共用。

-   `alter_index_worker_count`：在 BE 端用于执行历史数据构建索引的线程数（注：当前只支持倒排索引）。默认为 3。如果希望加快 Index Change 作业的速度，可以适当调大这个参数后重启 BE。但过多的线程可能会导致 IO 压力增加，影响其他操作。

## 更多参考

关于 Schema Change 使用的更多详细语法及最佳实践，请参阅 [ALTER TABLE COLUMN](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN) 命令手册，你也可以在 MySQL 客户端命令行下输入 `HELP ALTER TABLE COLUMN` 获取更多帮助信息。