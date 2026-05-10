---
{
    "title": "Delete 操作",
    "language": "zh-CN",
    "description": "Apache Doris DELETE 语句使用指南：按条件删除表或分区数据，支持 USING 多表关联删除，覆盖语法、参数、限制与性能优化。",
    "keywords": [
        "Doris DELETE",
        "删除数据",
        "条件删除",
        "USING 多表删除",
        "Unique Key 删除",
        "分区删除",
        "delete_without_partition",
        "SHOW DELETE"
    ]
}
---

<!-- 知识类型: 操作步骤 + 配置参数 -->
<!-- 适用场景: 数据清理 / 按条件删除 / 多表关联删除 -->

Apache Doris 通过 MySQL 协议执行 `DELETE` 语句，按条件删除指定表或分区中的数据。支持两种使用方式：

- **谓词条件删除**：通过简单的 `WHERE` 谓词组合删除符合条件的数据。
- **多表关联删除（USING）**：在主键表（Unique Key）上使用 `USING` 子句关联其他表进行删除。

## 快速导航

| 使用场景 | 推荐方式 | 适用表模型 |
|----------|----------|------------|
| 按列值条件删除 | [谓词条件删除](#通过指定过滤谓词删除) | Duplicate / Aggregate / Unique |
| 按分区批量删除 | [谓词条件删除 + PARTITION](#通过指定过滤谓词删除) | 所有模型 |
| 关联多表精确删除 | [USING 子句删除](#通过-using-子句删除) | 仅 Unique Key |
| 查看删除历史 | [SHOW DELETE](#查看删除历史) | 所有模型 |

## 通过指定过滤谓词删除

<!-- 知识类型: 操作步骤 -->

### 语法

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### 参数说明

**必选参数**

| 参数 | 说明 |
|------|------|
| `table_name` | 需要删除数据的目标表 |
| `column_name` | 属于 `table_name` 的列 |
| `op` | 逻辑比较操作符，支持：`=`、`>`、`<`、`>=`、`<=`、`!=`、`in`、`not in` |
| `value \| value_list` | 用于逻辑比较的单个值或值列表 |

**可选参数**

| 参数 | 说明 |
|------|------|
| `PARTITION` / `PARTITIONS` | 指定执行删除的分区名；若表不存在该分区则报错 |
| `table_alias` | 表的别名 |

### 使用限制

- **聚合表（Aggregate Key）**：只能在 Key 列上指定条件；若选定的 Key 列不存在于某个 Rollup 中，则无法执行删除。
- **分区表**：需要指定分区，或由 Doris 从条件中推断分区。以下两种情况无法推断：
    1. 条件中不包含分区列。
    2. 分区列的 `op` 为 `not in`。
- **非 Unique 分区表**：当未指定分区且无法推断分区时，需要设置会话变量 `delete_without_partition = true`，此时删除操作会应用到所有分区。

### 示例

**示例 1：删除指定分区中某列等于固定值的数据**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 = 3;
```

**示例 2：删除指定分区中满足复合条件的数据**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 >= 3 AND status = "outdated";
```

**示例 3：删除多个分区中按时间区间过滤的数据**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 >= 3 AND dt >= "2024-10-01" AND dt <= "2024-10-31";
```

## 通过 USING 子句删除

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 多表关联删除 -->

当需要关联多张表才能精确确定要删除的数据时，可使用 `USING` 子句。

### 语法

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition;
```

### 参数说明

**必选参数**

| 参数 | 说明 |
|------|------|
| `table_name` | 需要删除数据的目标表 |
| `WHERE condition` | 用于选择删除行的条件 |

**可选参数**

| 参数 | 说明 |
|------|------|
| `PARTITION` / `PARTITIONS` | 指定执行删除的分区名；若表不存在该分区则报错 |
| `table_alias` | 表的别名 |
| `USING additional_tables` | 用于关联的其他表 |

### 使用限制

- 仅支持在 **Unique Key** 模型表上使用。

### 示例

下例展示了如何通过 `t2` 与 `t3` 表的连接结果，删除 `t1` 中的数据。

**步骤 1：创建表**

```sql
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
```

**步骤 2：插入测试数据**

```sql
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
```

**步骤 3：执行关联删除**

```sql
DELETE FROM t1
    USING t2 INNER JOIN t3 ON t2.id = t3.id
    WHERE t1.id = t2.id;
```

**预期结果**：`t1` 表中 `id = 1` 的行被删除。

```Plain
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## 相关配置

<!-- 知识类型: 配置参数 -->

| 配置项 | 作用域 | 说明 | 默认值 |
|--------|--------|------|--------|
| `insert_timeout` | Session | 删除作为特殊导入处理，受该值限制；可通过 `SET insert_timeout = xxx` 调整，单位秒 | - |
| `max_allowed_in_element_num_of_delete` | Global | `IN` 谓词中允许携带的元素数量上限 | 1024 |

## 查看删除历史

<!-- 知识类型: 操作步骤 -->

通过 `SHOW DELETE` 语句可以查看历史上已执行完成的删除记录。

**语法**

```sql
SHOW DELETE [FROM db_name];
```

**示例**

```sql
mysql> SHOW DELETE FROM test_db;
+-----------+---------------+---------------------+-----------------+----------+
| TableName | PartitionName | CreateTime          | DeleteCondition | State    |
+-----------+---------------+---------------------+-----------------+----------+
| empty_tbl | p3            | 2020-04-15 23:09:35 | k1 EQ "1"       | FINISHED |
| test_tbl  | p4            | 2020-04-15 23:09:53 | k1 GT "80"      | FINISHED |
+-----------+---------------+---------------------+-----------------+----------+
2 rows in set (0.00 sec)
```

## 性能建议

<!-- 知识类型: 架构选型决策 -->

不同表模型上 `DELETE` 操作的性能特征如下：

| 表模型 | 执行速度 | 对查询的影响 | 适用场景建议 |
|--------|----------|--------------|--------------|
| 明细表（Duplicate Key） | 快 | 短时间内大量删除会影响查询性能 | 控制删除频率 |
| 聚合表（Aggregate Key） | 快 | 短时间内大量删除会影响查询性能 | 控制删除频率 |
| 主键表（Unique Key） | 大范围删除较慢（被转换为 `INSERT INTO`） | 短时间内大量删除对查询性能影响较小 | 适合频繁删除场景 |

## FAQ

**Q1：执行 DELETE 时报错提示需要指定分区，怎么办？**

对于非 Unique 分区表，若条件中不含分区列或使用 `not in`，Doris 无法推断分区。可以：

- 在 `DELETE` 语句中显式指定 `PARTITION`。
- 或设置会话变量 `SET delete_without_partition = true`，使删除作用于所有分区。

**Q2：聚合表上能否对非 Key 列执行删除？**

不可以。聚合表只能在 Key 列上指定删除条件。

**Q3：USING 子句支持哪些表模型？**

仅支持 **Unique Key** 模型表作为删除目标。

**Q4：IN 谓词中元素过多导致报错怎么办？**

调整 `max_allowed_in_element_num_of_delete` 配置项，提高允许的元素数量上限（默认 1024）。

**Q5：删除超时怎么办？**

通过 `SET insert_timeout = xxx`（单位秒）增加超时时间。

## 相关文档

- [DELETE 语法手册](../../sql-manual/sql-statements/data-modification/DML/DELETE)
