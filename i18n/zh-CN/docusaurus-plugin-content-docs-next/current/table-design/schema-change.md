---
{
    "title": "Schema 变更",
    "language": "zh-CN",
    "description": "用户可以通过Alter Table 操作来修改 Doris 表的 Schema。Schema 变更主要涉及列的修改和索引的变化。本文主要介绍列相关的 Schema 变更，关于索引相关的变更，请参考表索引 了解不同索引的变更方法。"
}
---

用户可以通过[Alter Table](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md) 操作来修改 Doris 表的 Schema。Schema 变更主要涉及列的修改和索引的变化。本文主要介绍列相关的 Schema 变更，关于索引相关的变更，请参考[表索引](./index/index-overview.md) 了解不同索引的变更方法。

## 原理介绍

Doris 支持两种类型的 Schema Change 操作：轻量级 Schema Change 和重量级 Schema Change。它们的区别主要体现在执行过程的复杂性、执行速度和资源消耗上。

| 特性               | 轻量级 Schema Change | 重量级 Schema Change |
|--------------------|----------------------|----------------------|
| 执行速度           | 秒级（几乎实时）     | 分钟级、小时级、天级（依赖表的数据量，数据量越大，执行越慢） |
| 是否需要数据重写   | 不需要               | 需要，涉及数据文件的重写 |
| 系统性能影响       | 影响较小             | 可能影响系统性能，尤其是在数据转换过程中 |
| 资源消耗           | 较低                 | 较高，会占用计算资源重新组织数据，过程中涉及到的表的数据占用的存储空间翻倍。 |
| 操作类型           | 增加、删除 Value 列，修改列名，修改 VARCHAR 长度 | 修改列的数据类型、更改主键、修改列的顺序等 |

### 轻量级 Schema Change

轻量级 Schema Change 是指不涉及数据重写的简单模式更改操作。这些操作通常在元数据级别进行，仅需要修改表的元数据，而不涉及数据文件的物理修改。轻量级 Schema Change 操作通常能够在秒级别完成，不会对系统性能造成显著影响。轻量级 Schema Change 包括：

- 增加或删除 value 列
- 更改列名
- 修改 VARCHAR 列的长度（UNIQUE 和 DUP 表 Key 列除外）。

### 重量级 Schema Change

重量级 Schema Change 涉及到数据文件的重写或转换，这些操作相对复杂，通常需要借助 Doris 的 Backend（BE）进行数据的实际修改或重新组织。重量级 Schema Change 操作通常涉及对表数据结构的深度变更，可能会影响到存储的物理布局。所有不支持轻量级 Schema Change 的操作，均属于重量级 Schema Change，比如：

- 更改列的数据类型
- 修改列的排序顺序

重量级操作会在后台启动一个任务进行数据转换。后台任务会对表的每个 tablet 进行转换，按 tablet 为单位，将原始数据重写到新的数据文件中。数据转换过程中，可能会出现数据"双写"现象，即在转换期间，新数据同时写入新 tablet 旧 tablet 中。完成数据转换后，旧 tablet 会被删除，新 tablet 将取而代之。

## 作业管理
### 查看作业

用户可以通过 [`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md) 命令查看 Schema Change 作业进度。可以查看当前正在执行或已经完成的 Schema Change 作业。当一次 Schema Change 作业涉及到物化视图时，该命令会显示多行，每行对应一个物化视图。举例如下：

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

### 取消作业

在作业状态不为 FINISHED 或 CANCELLED 的情况下，可以通过以下命令取消 Schema Change 作业：

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## 使用举例

### 修改列名称

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```
具体语法参考[ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME)。

### 添加一列

- 聚合模型如果增加 Value 列，需要指定 `agg_type`。

- 非聚合模型（如 DUPLICATE KEY）如果增加 Key 列，需要指定 KEY 关键字。

*往非聚合表添加列*

1. 建表语句

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int,
    col5 int
) DUPLICATE KEY(col1, col2, col3)
DISTRIBUTED BY RANDOM BUCKETS 10;
```

2. 向 `example_db.my_table` 的 col1 后添加一个 Key 列 `key_col`

```sql
ALTER TABLE example_db.my_table ADD COLUMN key_col INT KEY DEFAULT "0" AFTER col1;
```

3. 向 `example_db.my_table` 的 col4 后添加一个 Value 列 `value_col`

```sql
ALTER TABLE example_db.my_table ADD COLUMN value_col INT DEFAULT "0" AFTER col4;
```

*往聚合表添加列*

1. 建表语句

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```

2. 向 `example_db.my_table` 的 col1 后添加一个 Key 列 `key_col`

```sql
ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
```

3. 向 `example_db.my_table` 的 col4 后添加一个 Value 列 `value_col` SUM 聚合类型

```sql
ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
```

### 添加多列

- 聚合模型如果增加 Value 列，需要指定 `agg_type`

- 聚合模型如果增加 Key 列，需要指定 KEY 关键字

*向聚合表添加多列*

1. 建表语句

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```

2. 向 `example_db.my_table`添加多列 (聚合模型)

```sql
ALTER TABLE example_db.my_table
ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0");
```

### 删除列

- 不能删除分区列

- 不能删除 UNIQUE 的 KEY 列。

从 `example_db.my_table` 删除一列

1. 建表语句

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```

2. 从 `example_db.my_table` 删除`col3`列

```sql
ALTER TABLE example_db.my_table DROP COLUMN col4;
```

### 修改列类型和列位置

- 聚合模型如果修改 Value 列，需要指定 `agg_type`

- 非聚合类型如果修改 Key 列，需要指定 **KEY** 关键字

- 只能修改列的类型，列的其他属性维持原样

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


1. 建表语句

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col0 int,
    col1 int DEFAULT "1",
    col2 int,
    col3 varchar(32),
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col0, col1, col2, col3)
DISTRIBUTED BY HASH(col0) BUCKETS 10;
```

2. 修改 Key 列 col1 的类型为 BIGINT，并移动到 col2 列后面

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
```

注意：无论是修改 Key 列还是 Value 列都需要声明完整的 Column 信息

2. 修改 Base Table 的 val1 列最大长度。原 val1 为 (val1 VARCHAR(32) REPLACE DEFAULT "abc")

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
```

注意：只能修改列的类型，列的其他属性需要维持原样

3. 修改 Key 列的某个字段的长度

```sql
ALTER TABLE example_db.my_table
MODIFY COLUMN col3 varchar(50) KEY NULL comment 'to 50';
```

### 重新排序

- 所有列都要写出来
- Value 列在 Key 列之后

1. 建表语句
```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    k1 int DEFAULT "1",
    k2 int,
    k3 varchar(32),
    k4 date,
    v1 int SUM,
    v2 int MAX,
) AGGREGATE KEY(k1, k2, k3, k4)
DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

2. 重新排序 `example_db.my_table` 中的列

```sql
ALTER TABLE example_db.my_table
ORDER BY (k3,k1,k2,k4,v2,v1);
```

## 限制

- 一张表在同一时间只能有一个 Schema Change 作业在运行。

- 分区列和分桶列不能修改。

- 如果聚合表中有 REPLACE 方式聚合的 Value 列，则不允许删除 Key 列。

- Unique 表不允许删除 Key 列。

- 在新增聚合类型为 SUM 或者 REPLACE 的 Value 列时，该列的默认值对历史数据没有含义。

- 因为历史数据已经失去明细信息，所以默认值的取值并不能实际反映聚合后的取值。

- 当修改列类型时，除 Type 以外的字段都需要按原列上的信息补全。

- 注意，除新的列类型外，如聚合方式，Nullable 属性，以及默认值都要按照原信息补全。

- 不支持修改聚合类型、Nullable 属性和默认值。

## 相关配置

### FE 配置

- `alter_table_timeout_second`：作业默认超时时间，86400 秒。

### BE 配置

- `alter_tablet_worker_count`：在 BE 端用于执行历史数据转换的线程数。默认为 3。如果希望加快 Schema Change 作业的速度，可以适当调大这个参数后重启 BE。但过多的转换线程可能会导致 IO 压力增加，影响其他操作。

- `alter_index_worker_count`：在 BE 端用于执行历史数据构建索引的线程数（注：当前只支持倒排索引）。默认为 3。如果希望加快 Index Change 作业的速度，可以适当调大这个参数后重启 BE。但过多的线程可能会导致 IO 压力增加，影响其他操作。
