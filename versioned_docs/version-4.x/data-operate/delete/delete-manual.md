---
{
    "title": "Delete Operation",
    "language": "en",
    "description": "Apache Doris DELETE statement guide: delete table or partition data by condition, supports USING multi-table joined deletes, covering syntax, parameters, limitations, and performance tuning.",
    "keywords": [
        "Doris DELETE",
        "delete data",
        "conditional delete",
        "USING multi-table delete",
        "Unique Key delete",
        "partition delete",
        "delete_without_partition",
        "SHOW DELETE"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data cleanup / Conditional delete / Multi-table joined delete -->

Apache Doris executes the `DELETE` statement through the MySQL protocol to remove data from a specified table or partition based on conditions. Two usage forms are supported:

- **Predicate-based delete**: Delete data matching simple `WHERE` predicate combinations.
- **Multi-table joined delete (USING)**: On a primary-key table (Unique Key), use the `USING` clause to join other tables for deletion.

## Quick Navigation

| Scenario | Recommended approach | Applicable table model |
|----------|----------------------|------------------------|
| Delete by column value condition | [Predicate-based delete](#delete-by-specifying-filter-predicates) | Duplicate / Aggregate / Unique |
| Bulk delete by partition | [Predicate-based delete + PARTITION](#delete-by-specifying-filter-predicates) | All models |
| Precise delete via multi-table join | [Delete with USING clause](#delete-with-the-using-clause) | Unique Key only |
| View delete history | [SHOW DELETE](#viewing-delete-history) | All models |

## Delete by Specifying Filter Predicates

<!-- Knowledge type: Operation steps -->

### Syntax

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### Parameter Description

**Required parameters**

| Parameter | Description |
|-----------|-------------|
| `table_name` | The target table from which to delete data |
| `column_name` | A column belonging to `table_name` |
| `op` | Logical comparison operator. Supported: `=`, `>`, `<`, `>=`, `<=`, `!=`, `in`, `not in` |
| `value \| value_list` | A single value or value list used for the logical comparison |

**Optional parameters**

| Parameter | Description |
|-----------|-------------|
| `PARTITION` / `PARTITIONS` | Specifies the partition name on which to perform the delete. If the table does not have the specified partition, an error is reported |
| `table_alias` | Alias of the table |

### Limitations

- **Aggregate Key tables**: Conditions can only be specified on Key columns. If a selected Key column does not exist in a Rollup, the delete cannot be executed.
- **Partitioned tables**: A partition must be specified, or Doris must be able to infer the partition from the conditions. The partition cannot be inferred in the following two cases:
    1. The conditions do not include the partition column.
    2. The `op` for the partition column is `not in`.
- **Non-Unique partitioned tables**: When no partition is specified and the partition cannot be inferred, the session variable `delete_without_partition = true` must be set. In this case, the delete operation applies to all partitions.

### Examples

The examples below use `my_table`, a Unique-Key list-partitioned table on `k1` with partitions `p1` and `p2`:

```sql
CREATE TABLE my_table (
  k1 INT,
  status VARCHAR(32),
  dt DATE
)
UNIQUE KEY (k1)
PARTITION BY LIST (k1) (
  PARTITION p1 VALUES IN (1, 2, 3, 4, 5),
  PARTITION p2 VALUES IN (6, 7, 8, 9, 10)
)
DISTRIBUTED BY HASH (k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO my_table VALUES
  (1, 'active',   '2024-09-01'),
  (3, 'outdated', '2024-10-15'),
  (5, 'active',   '2024-10-20'),
  (6, 'outdated', '2024-10-05'),
  (8, 'outdated', '2024-10-25'),
  (10, 'active',  '2024-11-10');
```

**Example 1: Delete data in a specified partition where a column equals a fixed value**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 = 3;
```

**Example 2: Delete data in a specified partition that satisfies a compound condition**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 >= 3 AND status = "outdated";
```

**Example 3: Delete data in multiple partitions filtered by a time range**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 >= 3 AND dt >= "2024-10-01" AND dt <= "2024-10-31";
```

## Delete with the USING Clause

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Multi-table joined delete -->

When multiple tables must be joined to precisely identify the data to be deleted, use the `USING` clause.

### Syntax

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition;
```

### Parameter Description

**Required parameters**

| Parameter | Description |
|-----------|-------------|
| `table_name` | The target table from which to delete data |
| `WHERE condition` | The condition used to select rows for deletion |

**Optional parameters**

| Parameter | Description |
|-----------|-------------|
| `PARTITION` / `PARTITIONS` | Specifies the partition name on which to perform the delete. If the table does not have the specified partition, an error is reported |
| `table_alias` | Alias of the table |
| `USING additional_tables` | Other tables used for joining |

### Limitations

- Only supported on **Unique Key** model tables.

### Example

The following example shows how to delete data from `t1` based on the join result of `t2` and `t3`.

**Step 1: Create tables**

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

**Step 2: Insert test data**

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

**Step 3: Execute the joined delete**

```sql
DELETE FROM t1
    USING t2 INNER JOIN t3 ON t2.id = t3.id
    WHERE t1.id = t2.id;
```

**Expected result**: The row with `id = 1` in `t1` is deleted.

```sql
SELECT * FROM t1 ORDER BY id;
```

```text
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## Related Configuration

<!-- Knowledge type: Configuration parameters -->

| Configuration | Scope | Description | Default |
|---------------|-------|-------------|---------|
| `insert_timeout` | Session | A delete is treated as a special load and is bounded by this value. Adjust it with `SET insert_timeout = xxx`, in seconds | - |
| `max_allowed_in_element_num_of_delete` | Global | Maximum number of elements allowed in an `IN` predicate | 1024 |

## Viewing Delete History

<!-- Knowledge type: Operation steps -->

Use the `SHOW DELETE` statement to view records of completed delete operations.

**Syntax**

```sql
SHOW DELETE [FROM db_name];
```

**Example**

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

## Performance Recommendations

<!-- Knowledge type: Architecture decision -->

The performance characteristics of `DELETE` on different table models are as follows:

| Table model | Execution speed | Impact on queries | Recommended scenarios |
|-------------|-----------------|-------------------|------------------------|
| Detail table (Duplicate Key) | Fast | A large number of deletes in a short time affects query performance | Control delete frequency |
| Aggregate table (Aggregate Key) | Fast | A large number of deletes in a short time affects query performance | Control delete frequency |
| Primary-key table (Unique Key) | Slow for large-range deletes (converted to `INSERT INTO`) | A large number of deletes in a short time has limited impact on query performance | Suitable for frequent delete scenarios |

## FAQ

**Q1: When I run DELETE, an error reports that a partition must be specified. What should I do?**

For non-Unique partitioned tables, when the conditions do not include the partition column or use `not in`, Doris cannot infer the partition. You can:

- Explicitly specify `PARTITION` in the `DELETE` statement.
- Or set the session variable `SET delete_without_partition = true` so that the delete applies to all partitions.

**Q2: Can I delete on non-Key columns of an aggregate table?**

No. Aggregate tables only allow delete conditions on Key columns.

**Q3: Which table models does the USING clause support?**

Only **Unique Key** model tables are supported as the delete target.

**Q4: What if there are too many elements in an IN predicate and an error is reported?**

Adjust the `max_allowed_in_element_num_of_delete` configuration to raise the maximum allowed number of elements (default 1024).

**Q5: What if a delete times out?**

Use `SET insert_timeout = xxx` (in seconds) to increase the timeout.

## Related Documents

- [DELETE Syntax Manual](../../sql-manual/sql-statements/data-modification/DML/DELETE)
