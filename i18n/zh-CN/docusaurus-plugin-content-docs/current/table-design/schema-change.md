---
{
    "title": "Schema 变更",
    "language": "zh-CN",
    "description": "Doris 通过 ALTER TABLE 修改表 Schema。本文介绍轻量与重量级 Schema Change 差异、使用示例、类型转换支持与作业管理。",
    "keywords": [
        "Doris Schema Change",
        "ALTER TABLE",
        "轻量级 Schema Change",
        "重量级 Schema Change",
        "添加列",
        "删除列",
        "修改列类型",
        "VARCHAR 修改长度",
        "列重排序",
        "数据类型转换"
    ]
}
---

<!-- 知识类型: 操作步骤 / 配置参数 / 限制说明 -->
<!-- 适用场景: 表结构变更 / 字段调整 / 类型转换 -->

用户可以通过 [`ALTER TABLE`](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md) 修改 Doris 表的 Schema。本文聚焦**列相关**的 Schema 变更；关于索引相关的变更，请参考 [表索引](./index/index-overview.md) 了解不同索引的变更方法。

## 两种 Schema Change 类型

Doris 支持两种类型的 Schema Change 操作：**轻量级**与**重量级**。两者在执行复杂度、速度与资源消耗上差异显著，选择前可先参考下表快速判断：

| 特性             | 轻量级 Schema Change                              | 重量级 Schema Change                                         |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| 执行速度         | 秒级（几乎实时）                                    | 分钟级 / 小时级 / 天级（依赖数据量，量越大越慢）                |
| 是否需要数据重写 | 不需要，仅修改元数据                               | 需要，涉及数据文件的重写                                      |
| 系统性能影响     | 影响较小                                          | 可能影响系统性能，尤其在数据转换过程中                        |
| 资源消耗         | 较低                                              | 较高，占用计算资源；过程中表数据占用的存储空间会翻倍           |
| 典型操作         | 增加 / 删除 Value 列、修改列名、修改 VARCHAR 长度 | 修改列的数据类型、更改主键、修改列的顺序等                   |

### 轻量级 Schema Change

**仅修改元数据，不涉及数据文件的物理修改**，通常秒级完成，对系统性能影响极小。包括：

- 增加或删除 Value 列。
- 修改列名。
- 修改 VARCHAR 列的长度（UNIQUE 和 DUP 表的 Key 列除外）。

### 重量级 Schema Change

**涉及数据文件的重写或转换**，由 Backend（BE）在后台完成实际修改或重新组织。所有不属于轻量级范围的操作都属于重量级，例如：

- 修改列的数据类型。
- 修改列的排序顺序。

执行流程：

1. 后台启动数据转换任务，按 tablet 为单位，将原始数据重写到新的数据文件中。
2. 转换期间会出现"双写"现象——新数据同时写入新 tablet 与旧 tablet。
3. 转换完成后，旧 tablet 被删除，新 tablet 接管。

## 使用示例

下表列出常见操作场景与对应入口，可按需查阅：

| 用户场景          | 操作语法           |
| ----------------- | ------------------ |
| 重命名某一列      | `RENAME COLUMN`    |
| 添加 Key/Value 列 | `ADD COLUMN`       |
| 一次添加多列      | `ADD COLUMN (...)` |
| 删除某一列        | `DROP COLUMN`      |
| 修改列类型 / 位置 | `MODIFY COLUMN`    |
| 重新排列列顺序    | `ORDER BY`         |

### 修改列名

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```

具体语法参考 [ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME.md)。

### 添加列

注意事项：

- 聚合模型增加 Value 列时，需要指定 `agg_type`。
- 非聚合模型（如 DUPLICATE KEY）增加 Key 列时，需要指定 `KEY` 关键字。

#### 示例一：向非聚合表添加列

1. 建表语句：

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

2. 在 `col1` 后添加 Key 列 `key_col`：

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT KEY DEFAULT "0" AFTER col1;
    ```

3. 在 `col4` 后添加 Value 列 `value_col`：

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT DEFAULT "0" AFTER col4;
    ```

#### 示例二：向聚合表添加列

1. 建表语句：

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

2. 在 `col1` 后添加 Key 列 `key_col`：

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
    ```

3. 在 `col4` 后添加 Value 列 `value_col`，聚合类型为 SUM：

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
    ```

### 添加多列

注意事项：

- 聚合模型增加 Value 列时，需要指定 `agg_type`。
- 聚合模型增加 Key 列时，需要指定 `KEY` 关键字。

向聚合表添加多列：

1. 建表语句：

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

2. 一次添加多列：

    ```sql
    ALTER TABLE example_db.my_table
    ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0");
    ```

### 删除列

注意事项：

- 不能删除分区列。
- 不能删除 UNIQUE 表的 Key 列。

从 `example_db.my_table` 删除一列：

1. 建表语句：

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

2. 从 `example_db.my_table` 删除 `col4` 列：

    ```sql
    ALTER TABLE example_db.my_table DROP COLUMN col4;
    ```

### 修改列类型与位置

注意事项：

- 聚合模型修改 Value 列时，需要指定 `agg_type`。
- 非聚合模型修改 Key 列时，需要指定 `KEY` 关键字。
- 只能修改列的类型，列的其他属性需要维持原样。
- **分区列和分桶列不能做任何修改**。
- 修改列时需注意精度损失，支持的类型转换详见下文 [支持的类型转换](#支持的类型转换)。

示例：

1. 建表语句：

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

2. 将 Key 列 `col1` 类型修改为 `BIGINT`，并移动到 `col2` 之后（无论修改 Key 列还是 Value 列，都需要声明完整的 Column 信息）：

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
    ```

3. 修改 Base Table 的 `col5` 列最大长度，原 `col5` 为 `VARCHAR(32) REPLACE DEFAULT "abc"`（只能修改列的类型，其他属性需维持原样）：

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
    ```

4. 修改 Key 列某个字段的长度：

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col3 varchar(50) KEY NULL COMMENT 'to 50';
    ```

#### 支持的类型转换

修改列类型时请注意精度损失，目前支持以下转换：

| 源类型                                                   | 目标类型                                          | 说明                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE        | 范围更大的数字类型                                | —                                                                                          |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL | VARCHAR                                           | —                                                                                          |
| VARCHAR                                                  | VARCHAR                                           | 仅支持修改最大长度                                                                         |
| VARCHAR/CHAR                                             | TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE | —                                                                                          |
| VARCHAR/CHAR                                             | DATE                                              | 支持 `%Y-%m-%d`、`%y-%m-%d`、`%Y%m%d`、`%y%m%d`、`%Y/%m/%d`、`%y/%m/%d` 六种格式            |
| DATETIME                                                 | DATE                                              | 仅保留年-月-日，例如 `2019-12-09 21:47:05` → `2019-12-09`                                    |
| DATE                                                     | DATETIME                                          | 时分秒自动补零，例如 `2019-12-09` → `2019-12-09 00:00:00`                                    |
| FLOAT                                                    | DOUBLE                                            | —                                                                                          |
| INT                                                      | DATE                                              | 若 INT 数据不合法则转换失败，原始数据不变                                                    |
| 除 DATE 与 DATETIME 以外的类型                           | STRING                                            | STRING 不能再转换为其他任何类型                                                             |

### 重新排序

注意事项：

- 必须列出表中所有列。
- Value 列必须排在 Key 列之后。

示例：

1. 建表语句：

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

2. 重新排序 `example_db.my_table` 中的列：

    ```sql
    ALTER TABLE example_db.my_table
    ORDER BY (k3, k1, k2, k4, v2, v1);
    ```

## 作业管理

### 查看作业

通过 [`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md) 命令查看 Schema Change 作业进度，可显示当前正在执行或已完成的作业。当一次作业涉及到物化视图时，该命令会显示多行，每行对应一个物化视图。示例如下：

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

在作业状态不为 `FINISHED` 或 `CANCELLED` 时，可通过以下命令取消 Schema Change 作业：

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## 限制

| 类别             | 限制说明                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **并发**         | 一张表在同一时间只能有一个 Schema Change 作业在运行                                                       |
| **不可变列**     | 分区列和分桶列不能修改                                                                                    |
| **Key 列删除**   | 聚合表中含 REPLACE 方式聚合的 Value 列时，不允许删除 Key 列；Unique 表也不允许删除 Key 列                   |
| **聚合默认值**   | 新增 SUM 或 REPLACE 类型 Value 列时，因历史数据已失去明细信息，默认值无法实际反映聚合后的取值，对历史数据没有含义 |
| **类型修改**     | 只能修改列的 Type；聚合方式、Nullable、默认值等其余字段必须按原列信息补全                                  |
| **不支持的修改** | 不支持修改聚合类型、Nullable 属性和默认值                                                                 |

## 相关配置

### FE 配置

| 配置项                       | 默认值     | 说明             |
| ---------------------------- | ---------- | ---------------- |
| `alter_table_timeout_second` | 86400（秒） | 作业默认超时时间 |

### BE 配置

| 配置项                      | 默认值 | 说明                                                                                              |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `alter_tablet_worker_count` | 3      | BE 端用于执行历史数据转换的线程数。可适当调大以加快 Schema Change 作业速度，但过多线程可能增加 IO 压力，影响其他操作 |
| `alter_index_worker_count`  | 3      | BE 端用于执行历史数据构建索引的线程数（当前仅支持倒排索引）。调整建议同上                          |

> 调整 BE 配置后需要重启 BE 生效。
