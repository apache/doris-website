---
{
    "title": "Temporary Partition",
    "language": "en"
}
---

Apache Doris supports adding temporary partitions to partitioned tables. Temporary partitions differ from regular partitions in that they are not retrieved by standard queries and can only be accessed through specific query statements.

- Temporary partition columns must match those of regular partitions and cannot be modified.
- Temporary partition ranges cannot overlap with each other, but they can overlap with regular partition ranges.
- Temporary partition names must be unique and cannot duplicate regular partition names or other temporary partition names.

## Use Cases

**Temporary partitions are primarily used for:**

- **Atomic overwrite operations**: You can rewrite partition data without losing data between deletion and import operations. Create a temporary partition, import new data into it, then atomically replace the original partition through a replace operation. For atomic overwrite operations on non-partitioned tables, see the [replace table documentation](../../data-operate/delete/atomicity-replace).

- **Bucket count modification**: If an inappropriate bucket count was used when creating a partition, you can create a new temporary partition with the desired bucket count. Import the regular partition data into the temporary partition using the `INSERT INTO` command, then atomically replace the original partition through a replace operation.

- **Partition merging or splitting**: You can modify partition ranges, such as merging two partitions or splitting a large partition into multiple smaller ones. Create a new temporary partition, import the regular partition data using the `INSERT INTO` command, then atomically replace the original partition through a replace operation.

## Adding Temporary Partitions

Use the `ALTER TABLE ADD TEMPORARY PARTITION` statement to add temporary partitions:

```sql
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01");

ALTER TABLE tbl2 ADD TEMPORARY PARTITION tp1 VALUES [("2020-01-01"), ("2020-02-01"));

ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;

ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai");

ALTER TABLE tbl4 ADD TEMPORARY PARTITION tp1 VALUES IN ((1, "Beijing"), (1, "Shanghai"));

ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;
```

## Dropping Temporary Partitions

Use the `ALTER TABLE DROP TEMPORARY PARTITION` statement to drop temporary partitions:

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```

## Replacing Regular Partitions

Use the `ALTER TABLE REPLACE PARTITION` statement to replace regular partitions with temporary partitions:

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
  "strict_range" = "false",
  "use_temp_partition_name" = "true"
);
```

The replace operation supports two optional parameters:

### 1. `strict_range`

**Default value**: `true`

**For Range partitions**: When `true`, the union of all replaced regular partition ranges must exactly match the union of the replacing temporary partition ranges. When `false`, only ensure that the new regular partition ranges don't overlap after replacement.

**For List partitions**: This parameter is always `true`. The enumeration values of all replaced regular partitions must exactly match the enumeration values of the replacing temporary partitions.

**Example 1: Range partitions with matching unions**

```sql
-- The range of partitions p1, p2, p3 to be replaced (=> union):
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- The range of replacing partitions tp1, tp2 (=> union):
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

-- Range unions match, so tp1 and tp2 can replace p1, p2, p3.
```

**Example 2: Range partitions with non-matching unions**

```sql
-- The range of partition p1 to be replaced (=> union):
[10, 50) => [10, 50)

-- The range of replacing partitions tp1, tp2 (=> union):
[10, 30), [40, 50) => [10, 30), [40, 50)

-- The union of ranges is not the same. If strict_range is true, tp1 and tp2 cannot replace p1. If it is false, and the ranges of the two partitions after replacement [10, 30), [40, 50) do not overlap with other regular partitions, they can replace p1.
```

**Example 3: List partitions with matching unions**

```sql
-- The enumeration values of partitions p1, p2 to be replaced (=> union):
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- The enumeration values of replacing partitions tp1, tp2, tp3 (=> union):
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- Enumeration unions match, so tp1, tp2, tp3 can replace p1, p2.
```

**Example 4: Multi-column list partitions with matching unions**

```sql
-- The enumeration values of partitions p1, p2, p3 to be replaced (=> union):
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai")), (("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The enumeration values of replacing partitions tp1, tp2 (=> union):
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- Enumeration unions match, so tp1, tp2 can replace p1, p2, p3.
```

### 2. `use_temp_partition_name`

**Default value**: `false`

When `false` and the number of partitions to replace equals the number of replacing partitions, partition names remain unchanged after replacement.

When `true`, partition names after replacement become the names of the replacing partitions.

**Example 1: Same partition count**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```

- With `use_temp_partition_name` defaulting to `false`, the partition name remains `p1` after replacement, but data and properties are replaced with those of `tp1`.
- With `use_temp_partition_name` set to `true`, the partition name becomes `tp1` after replacement, and `p1` no longer exists.

**Example 2: Different partition counts**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```

- With `use_temp_partition_name` defaulting to `false`, but since partition counts differ, this parameter is ignored. After replacement, the partition name becomes `tp1`, and `p1` and `p2` no longer exist.

:::warning
**Important**: After successful partition replacement, the replaced partitions are permanently deleted and cannot be recovered.
:::

## Importing Data into Temporary Partitions

The syntax for importing data into temporary partitions varies slightly depending on the import method:

```sql
INSERT INTO tbl TEMPORARY PARTITION(tp1, tp2, ...) SELECT ....

curl --location-trusted -u root: -H "label:123" -H "temporary_partitions: tp1, tp2, ..." -T testData http://host:port/api/testDb/testTbl/_stream_load    

LOAD LABEL example_db.label1
(
DATA INFILE("hdfs://hdfs_host:hdfs_port/user/palo/data/input/file")
INTO TABLE my_table
TEMPORARY PARTITION (tp1, tp2, ...)
...
)
WITH BROKER hdfs ("username"="hdfs_user", "password"="hdfs_password");

CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
TEMPORARY PARTITIONS(tp1, tp2, ...),
WHERE k1 > 100
PROPERTIES
(...)
FROM KAFKA
(...);
```

## Querying Temporary Partitions

```sql
SELECT ... FROM
tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```

## Interaction with Other Operations

### DROP Operations

- **Database/Table DROP**: After dropping a database or table, you can recover it using the Recover command (within time limits), but temporary partitions are not recovered.
- **Regular Partition DROP**: After dropping a regular partition, you can recover it using the Recover command (within time limits). This operation doesn't affect temporary partitions.
- **Temporary Partition DROP**: After dropping a temporary partition, it cannot be recovered using the Recover command.

### TRUNCATE Operations

- **Table TRUNCATE**: Truncating a table removes all temporary partitions, and they cannot be recovered.
- **Regular Partition TRUNCATE**: Truncating a regular partition doesn't affect temporary partitions.
- **Temporary Partition TRUNCATE**: The TRUNCATE command cannot be used on temporary partitions.

### ALTER Operations

- **Schema Changes**: When a table has temporary partitions, you cannot perform Schema Change, Rollup, or other modification operations.
- **Adding Temporary Partitions**: You cannot add temporary partitions to a table that is undergoing modification operations.