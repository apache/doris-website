---
{
    "title": "ALTER TABLE DISTRIBUTION",
    "language": "en",
    "description": "This statement is used to modify the default distribution bucket configuration of a partitioned table."
}
---

## Description

This statement is used to modify the default distribution bucket configuration of a partitioned table. This operation is synchronous, and the return of the command indicates the completion of the execution.

This statement only changes the default bucket count for **newly created partitions**. Existing partitions retain their original bucket count unchanged.

grammar:

```sql
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(column1[, column2, ...]) BUCKETS { num | AUTO };
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS { num | AUTO };
```

Note:

- `num`: A positive integer specifying a fixed number of buckets for new partitions.
- `AUTO`: Let the system automatically determine the number of buckets for new partitions based on data volume and cluster configuration.
- The distribution type (HASH or RANDOM) and distribution columns must remain the same as the original table definition. Only the bucket count can be changed.
- This statement only applies to **partitioned tables** (RANGE or LIST partitioned). Unpartitioned tables are not supported.
- This statement is not supported on **Colocate** tables.
- You can switch freely between a fixed bucket count and `AUTO`, and perform multiple modifications in sequence.

### Interaction with AUTO PARTITION

For tables using [AUTO PARTITION](../../../../table-design/data-partitioning/auto-partitioning), new partitions that are automatically created by data insertion after executing `ALTER TABLE MODIFY DISTRIBUTION` will use the new bucket configuration. Partitions that were already auto-created before the modification remain unchanged.

For example, if an AUTO PARTITION table originally uses `BUCKETS 5` and you modify it to `BUCKETS 8`, any subsequent INSERT that triggers the creation of a new auto partition will assign 8 buckets to that partition. If you further modify it to `BUCKETS AUTO`, newly auto-created partitions will have their bucket count determined automatically by the system.

### Interaction with Dynamic Partition

For tables using [Dynamic Partition](../../../../table-design/data-partitioning/dynamic-partitioning), new partitions that are automatically created by the dynamic partition scheduler after executing `ALTER TABLE MODIFY DISTRIBUTION` will use the new bucket configuration. Existing dynamic partitions remain unchanged.

Note that Dynamic Partition tables also support the `dynamic_partition.buckets` property. If both are configured, the `dynamic_partition.buckets` property takes precedence for dynamically created partitions. To use the table-level default bucket count (set by `MODIFY DISTRIBUTION`) for dynamic partitions, ensure that `dynamic_partition.buckets` is not explicitly set, or update it accordingly via `ALTER TABLE ... SET ("dynamic_partition.buckets" = "...")`.

## Example

1. Modify the default bucket count of a RANGE partitioned table with HASH distribution from the original value to 10

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

After this, any newly added partition will use 10 buckets:

```sql
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 will have 10 buckets; existing partitions remain unchanged
```

2. Switch from a fixed bucket count to AUTO

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
```

After this, newly created partitions will have their bucket count automatically determined by the system.

3. Switch from AUTO back to a fixed bucket count

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 3;
```

4. Modify the default bucket count of a LIST partitioned table

```sql
ALTER TABLE example_db.my_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;
```

5. Modify the default bucket count of a table with RANDOM distribution

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 12;
```

6. Switch a RANDOM distribution table to AUTO buckets

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS AUTO;
```

7. Modify the default bucket count of an AUTO PARTITION table (RANGE)

```sql
-- Original table uses AUTO PARTITION BY RANGE with BUCKETS 5
ALTER TABLE example_db.my_auto_range_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;

-- New auto-created partitions from subsequent INSERT will use 8 buckets
INSERT INTO example_db.my_auto_range_table VALUES ('2024-01-03', 3);
```

8. Modify the default bucket count of an AUTO PARTITION table (LIST)

```sql
-- Original table uses AUTO PARTITION BY LIST with BUCKETS 4
ALTER TABLE example_db.my_auto_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 7;

-- New auto-created partitions from subsequent INSERT will use 7 buckets
INSERT INTO example_db.my_auto_list_table VALUES ('ccc', 3);
```

9. Switch an AUTO PARTITION table from AUTO buckets to fixed, and back

```sql
-- Table originally created with BUCKETS AUTO
ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 5;
-- New partitions will use 5 buckets

ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
-- New partitions will return to system-determined bucket count
```

10. Multiple sequential modifications

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 4;
ALTER TABLE example_db.my_table ADD PARTITION p2 VALUES LESS THAN ('20');
-- p2 has 4 buckets

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 has system-determined bucket count

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 6;
ALTER TABLE example_db.my_table ADD PARTITION p4 VALUES LESS THAN ('40');
-- p4 has 6 buckets
```

11. Error cases

Colocate tables are not supported:

```sql
-- This will fail with: "Cannot change default bucket number of colocate table"
ALTER TABLE example_db.my_colocate_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

Unpartitioned tables are not supported:

```sql
-- This will fail with: "Only support change partitioned table's distribution"
ALTER TABLE example_db.my_unpartitioned_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

Cannot change the distribution type:

```sql
-- Original table uses HASH distribution; changing to RANDOM will fail
-- Error: "Cannot change distribution type"
ALTER TABLE example_db.my_hash_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 10;
```

Cannot change the distribution columns:

```sql
-- Original table uses HASH(k1); changing to HASH(k2) will fail
-- Error: "Cannot assign hash distribution with different distribution cols"
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k2) BUCKETS 10;
```

## Keywords

```text
ALTER, TABLE, DISTRIBUTION, MODIFY DISTRIBUTION, BUCKETS, ALTER TABLE
```
