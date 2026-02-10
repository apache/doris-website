---
{
    "title": "Temporary Partition",
    "language": "en",
    "description": "Doris supports adding temporary partitions to partitioned tables."
}
---

Doris supports adding temporary partitions to partitioned tables. Temporary partitions differ from regular partitions in that they are not retrieved by regular queries and can only be queried through special query statements.

- The partition columns of temporary partitions are the same as those of regular partitions and cannot be modified.

- The partition ranges of all temporary partitions cannot overlap, but the ranges of temporary partitions and regular partitions can overlap.

- The names of temporary partitions cannot duplicate those of regular partitions or other temporary partitions.

**Main application scenarios for temporary partitions:**

- **Atomic overwrite operation**: Users can rewrite the data of a partition without data loss between deleting old data and importing new data. In this case, a temporary partition can be created, new data can be imported into the temporary partition, and then the original partition can be atomically replaced through a replace operation. For atomic overwrite operations on non-partitioned tables, refer to the [replace table documentation](../../data-operate/delete/atomicity-replace).

- **Modify the number of buckets**: If an inappropriate number of buckets was used when creating a partition, a new temporary partition can be created with the specified new number of buckets. Then, the data of the regular partition can be imported into the temporary partition using the `INSERT INTO` command, and the original partition can be atomically replaced through a replace operation.

- **Merge or split partitions**: Users can modify the partition range, such as merging two partitions or splitting a large partition into multiple smaller partitions. A new temporary partition can be created, the data of the regular partition can be imported into the temporary partition using the `INSERT INTO` command, and the original partition can be atomically replaced through a replace operation.

## Add Temporary Partition

Use the `ALTER TABLE ADD TEMPORARY PARTITION` statement to add a temporary partition:

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

## Drop Temporary Partition

Use the `ALTER TABLE DROP TEMPORARY PARTITION` statement to drop a temporary partition:

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```

## Replace Regular Partition

Use the `ALTER TABLE REPLACE PARTITION` statement to replace a regular partition with a temporary partition:

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
  "strict_range" = "false",
  "use_temp_partition_name" = "true"
);
```

There are two special optional parameters for the replace operation:

**1. `strict_range`**

Default is true.

For Range partitions, when this parameter is true, the union of the ranges of all replaced regular partitions must be exactly the same as the union of the ranges of the replacing temporary partitions. When set to false, it only needs to ensure that the ranges of the new regular partitions do not overlap after replacement.

For List partitions, this parameter is always true. The enumeration values of all replaced regular partitions must be exactly the same as the enumeration values of the replacing temporary partitions.

**Example 1**

```sql
-- The range of partitions p1, p2, p3 to be replaced (=> union):
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- The range of replacing partitions tp1, tp2 (=> union):
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

-- The union of ranges is the same, so tp1 and tp2 can replace p1, p2, p3.
```

**Example 2**

```sql
-- The range of partition p1 to be replaced (=> union):
[10, 50) => [10, 50)

-- The range of replacing partitions tp1, tp2 (=> union):
[10, 30), [40, 50) => [10, 30), [40, 50)

-- The union of ranges is not the same. If strict_range is true, tp1 and tp2 cannot replace p1. If it is false, and the ranges of the two partitions after replacement [10, 30), [40, 50) do not overlap with other regular partitions, they can replace p1.
```

**Example 3**

```sql
-- The enumeration values of partitions p1, p2 to be replaced (=> union):
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- The enumeration values of replacing partitions tp1, tp2, tp3 (=> union):
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- The union of enumeration values is the same, so tp1, tp2, tp3 can replace p1, p2.
```

**Example 4**

```sql
-- The enumeration values of partitions p1, p2, p3 to be replaced (=> union):
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai")), (("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The enumeration values of replacing partitions tp1, tp2 (=> union):
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The union of enumeration values is the same, so tp1, tp2 can replace p1, p2, p3.
```

**2. `use_temp_partition_name`**

Default is false.

When this parameter is false, and the number of partitions to be replaced is the same as the number of replacing partitions, the names of the partitions remain unchanged after replacement.

If it is true, the names of the partitions after replacement will be the names of the replacing partitions. Examples are as follows:

**Example 1**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name` defaults to false, so after replacement, the partition name remains p1, but the data and properties are replaced with those of tp1.
- If `use_temp_partition_name` is true, after replacement, the partition name is tp1, and p1 no longer exists.

**Example 2**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name` defaults to false, but since the number of partitions to be replaced is different from the number of replacing partitions, this parameter is invalid. After replacement, the partition name is tp1, and p1 and p2 no longer exist.

:::tip
**Explanation of the replace operation:**

After the partition replacement is successful, the replaced partitions will be deleted and cannot be recovered.
:::

## Import Temporary Partition

The syntax for specifying the import of temporary partitions varies slightly depending on the import method. Examples are as follows:

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

## Query Temporary Partition

```sql
SELECT ... FROM
tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```

## Relationship with Other Operations

**DROP**

- After using the Drop operation to directly delete a database or table, the database or table can be recovered using the Recover command (within a limited time), but temporary partitions will not be recovered.

- After using the Alter command to delete a regular partition, the partition can be recovered using the Recover command (within a limited time). This operation is unrelated to temporary partitions.

- After using the Alter command to delete a temporary partition, the temporary partition cannot be recovered using the Recover command.

**TRUNCATE**

- Using the Truncate command to empty a table will delete the table's temporary partitions, and they cannot be recovered.

- Using the Truncate command to empty a regular partition does not affect temporary partitions.

- The Truncate command cannot be used to empty temporary partitions.

**ALTER**

- When a table has temporary partitions, the Alter command cannot be used to perform Schema Change, Rollup, or other change operations on the table.

- When a table is undergoing change operations, temporary partitions cannot be added to the table.
```