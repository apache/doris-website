---
{
    "title": "Temporary Partition",
    "language": "en",
    "description": "Apache Doris temporary partition guide: use temporary partitions to atomically overwrite data, change bucket counts, and merge or split partitions with zero-downtime partition data switching.",
    "keywords": [
        "Doris temporary partition",
        "Temporary Partition",
        "atomic overwrite",
        "REPLACE PARTITION",
        "change bucket count",
        "partition merge",
        "partition split"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenarios: Atomic data overwrite / Partition structure adjustment / Bucket count change -->

A **temporary partition** is a category of partition in a Doris partitioned table that is independent of formal partitions. It is not hit by regular queries and must be accessed explicitly through dedicated syntax. It is mainly used to perform atomic data switching and partition structure adjustments without affecting online reads and writes.

## Applicable Scenarios

| Scenario | Description | Key Capability |
| --- | --- | --- |
| Atomic overwrite | Rewrite the data of a partition without producing a "delete old data, then load new data" gap window | Atomic replacement via `REPLACE PARTITION` |
| Change bucket count | The current bucket count of an existing partition is suboptimal and needs to be adjusted | Specify a new bucket count on the temporary partition and then replace |
| Merge / split partitions | Adjust partition granularity by merging multiple partitions into one or splitting one large partition into many | Redistribute data with `INSERT INTO` and then replace |

> Tip: For atomic overwrite of a **non-partitioned table**, refer to the [Replace Table documentation](../../data-operate/delete/atomicity-replace).

## Core Constraints

A temporary partition shares the same table schema as a formal partition, but has the following independence:

- The **partition columns** of a temporary partition are the same as those of formal partitions and cannot be modified.
- The partition ranges of all **temporary partitions** must not overlap with each other.
- The ranges of a temporary partition and a **formal partition** **may overlap**.
- The name of a temporary partition cannot be the same as any formal partition or other temporary partition.

## Operation Workflow Overview

A typical workflow consists of the following four steps:

1. **Add** a temporary partition (specify range / enumerated values / bucket count)
2. **Load** data into the temporary partition (`INSERT INTO` / Stream Load / Broker Load / Routine Load)
3. **Replace** the formal partition (`REPLACE PARTITION`, an atomic operation)
4. (Optional) **Drop** any unused temporary partitions

---

## Add a Temporary Partition

Use the `ALTER TABLE ADD TEMPORARY PARTITION` statement to create a temporary partition. Both Range and List partitions are supported, and you can independently specify the replica count and bucketing rule.

```sql
-- Range partition: LESS THAN form
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01");

-- Range partition: fixed-interval form
ALTER TABLE tbl2 ADD TEMPORARY PARTITION tp1 VALUES [("2020-01-01"), ("2020-02-01"));

-- Range partition: custom replica count and bucketing
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;

-- List partition: single-column enumeration
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai");

-- List partition: multi-column enumeration
ALTER TABLE tbl4 ADD TEMPORARY PARTITION tp1 VALUES IN ((1, "Beijing"), (1, "Shanghai"));

-- List partition: custom replica count and bucketing
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;
```

## Load Data into a Temporary Partition

The syntax for specifying a temporary partition differs slightly across load methods:

```sql
-- INSERT INTO
INSERT INTO tbl TEMPORARY PARTITION(tp1, tp2, ...) SELECT ...;
```

```bash
# Stream Load
curl --location-trusted -u root: \
     -H "label:123" \
     -H "temporary_partitions: tp1, tp2, ..." \
     -T testData \
     http://host:port/api/testDb/testTbl/_stream_load
```

```sql
-- Broker Load
LOAD LABEL example_db.label1
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/user/palo/data/input/file")
    INTO TABLE my_table
    TEMPORARY PARTITION (tp1, tp2, ...)
    ...
)
WITH BROKER hdfs ("username"="hdfs_user", "password"="hdfs_password");

-- Routine Load
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
TEMPORARY PARTITIONS(tp1, tp2, ...),
WHERE k1 > 100
PROPERTIES (...)
FROM KAFKA (...);
```

## Query a Temporary Partition

Temporary partitions cannot be reached by regular SQL. You must declare them explicitly with the `TEMPORARY PARTITION` keyword:

```sql
SELECT ... FROM
    tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
    tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```

## Replace a Formal Partition

Use `ALTER TABLE REPLACE PARTITION` to atomically replace formal partitions with temporary partitions.

```sql
-- Equal-count replacement
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

-- Many-to-many replacement
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

-- Replace with explicit parameters
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
    "strict_range" = "false",
    "use_temp_partition_name" = "true"
);
```

### Replacement Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `strict_range` | `true` | Controls how strictly partition ranges / enumerated values must match before and after replacement (see below) |
| `use_temp_partition_name` | `false` | Controls how formal partitions are named after replacement |

#### `strict_range`

- **Range partition**:
    - `true`: The **union of ranges** of the formal partitions being replaced must be **exactly the same** as the union of ranges of the temporary partitions used for replacement.
    - `false`: It is sufficient that, after replacement, the new formal partitions do not overlap with each other.
- **List partition**: Always `true`. The **union of enumerated values** of the formal partitions being replaced must be exactly the same as the union of enumerated values of the temporary partitions used for replacement.

**Example 1: Range unions are equal (allowed)**

```sql
-- Ranges (=> union) of partitions p1, p2, p3 to be replaced:
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- Ranges (=> union) of replacement partitions tp1, tp2:
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

-- The unions are equal, so tp1 and tp2 can replace p1, p2, and p3.
```

**Example 2: Range unions differ (depends on strict_range)**

```sql
-- Range (=> union) of partition p1 to be replaced:
[10, 50) => [10, 50)

-- Ranges (=> union) of replacement partitions tp1, tp2:
[10, 30), [40, 50) => [10, 30), [40, 50)

-- strict_range = true: replacement is rejected.
-- strict_range = false: if the resulting [10, 30) and [40, 50) do not overlap with other formal partitions, the replacement is allowed.
```

**Example 3: List single-column enumeration unions are equal**

```sql
-- Enumerated values (=> union) of partitions p1, p2 to be replaced:
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- Enumerated values (=> union) of replacement partitions tp1, tp2, tp3:
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- The unions are equal, so tp1, tp2, and tp3 can replace p1 and p2.
```

**Example 4: List multi-column enumeration unions are equal**

```sql
-- Enumerated values (=> union) of partitions p1, p2, p3 to be replaced:
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai")),
(("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- Enumerated values (=> union) of replacement partitions tp1, tp2:
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The unions are equal, so tp1 and tp2 can replace p1, p2, and p3.
```

#### `use_temp_partition_name`

Controls the naming behavior of formal partitions after replacement:

| Scenario | `use_temp_partition_name = false` (default) | `use_temp_partition_name = true` |
| --- | --- | --- |
| Number of partitions to be replaced = number of replacement partitions | Keep the original formal partition name (only data and properties are replaced) | Use the temporary partition name as the new formal partition name |
| Number of partitions to be replaced != number of replacement partitions | The parameter has no effect; the temporary partition name is forced | Use the temporary partition name |

**Example 1: Equal-count replacement**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name = false` (default): After replacement, the partition is still named `p1`, but its data and properties come from `tp1`.
- `use_temp_partition_name = true`: After replacement, the partition is renamed to `tp1`, and `p1` no longer exists.

**Example 2: Unequal-count replacement**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```

- Because the number of partitions to be replaced (2) is not equal to the number of replacement partitions (1), `use_temp_partition_name` has no effect.
- After replacement, the partition is named `tp1`, and the original `p1` and `p2` no longer exist.

:::tip Replacement notes
Once the replacement succeeds, **the formal partitions that were replaced are dropped and cannot be recovered**. Always verify that the data in the temporary partitions is correct before performing the replacement.
:::

## Drop a Temporary Partition

Use `ALTER TABLE DROP TEMPORARY PARTITION` to drop temporary partitions that are no longer needed:

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```

> Note: After a temporary partition is dropped, it **cannot be recovered with the `RECOVER` command**.

---

## Relationship with Other Operations

### DROP Operations

| Operation | Effect on Temporary Partitions | Recoverable |
| --- | --- | --- |
| `DROP DATABASE` / `DROP TABLE` | Temporary partitions in the database or table are dropped together | The database or table itself can be recovered with `RECOVER` within the retention window, but **temporary partitions are not recovered** |
| `ALTER ... DROP PARTITION` (formal partition) | Has no effect on temporary partitions | The formal partition can be recovered with `RECOVER` within the retention window |
| `ALTER ... DROP TEMPORARY PARTITION` | Drops the specified temporary partition | **Not recoverable** |

### TRUNCATE Operations

| Operation | Effect |
| --- | --- |
| `TRUNCATE TABLE` | Temporary partitions of the table **are dropped and cannot be recovered** |
| `TRUNCATE TABLE ... PARTITION` (truncate a formal partition) | Does not affect temporary partitions |
| Running `TRUNCATE` on a temporary partition | **Not supported** |

### ALTER Operations

- While a table has temporary partitions, **schema changes, rollups, and similar alteration operations cannot be executed**.
- While a table is undergoing an alteration operation, **temporary partitions cannot be added**.

---

## FAQ

**Q1: Are temporary partitions hit by regular `SELECT` queries?**

No. A temporary partition can only be accessed explicitly through a `TEMPORARY PARTITION(...)` clause. Regular queries, reports, and views do not read data from temporary partitions.

**Q2: Must the replica count and bucket count of a temporary partition match those of the formal partitions?**

No. This is one of the core values of temporary partitions: you can specify a different `replication_num` and `BUCKETS` for the new partition and then perform an atomic switch with `REPLACE PARTITION`.

**Q3: How do you achieve "zero-data-gap" partition data rewriting?**

Follow this order:
1. Run `ALTER TABLE ... ADD TEMPORARY PARTITION` to create the temporary partition.
2. Use `INSERT INTO` or a load job to write the new data into the temporary partition.
3. Verify that the data in the temporary partition is correct.
4. Run `ALTER TABLE ... REPLACE PARTITION ... WITH TEMPORARY PARTITION ...` to perform the atomic replacement.

Throughout the process, the formal partition remains readable from outside.

**Q4: What if the replacement fails or the data is incorrect?**

Before replacement, the data is still in the temporary partition and the formal partition is unaffected. If you find a data issue, run `ALTER TABLE ... DROP TEMPORARY PARTITION` to drop the temporary partition and reload. **Once a replacement succeeds, the original formal partition data cannot be recovered.**

**Q5: Can multiple temporary partitions be added to a single table at the same time?**

Yes. As long as the temporary partitions do not overlap in range or enumerated values and their names are unique, you can add as many as you need.

## Common Errors

| Error / Symptom | Possible Cause | Resolution |
| --- | --- | --- |
| Adding a temporary partition fails: partition already exists | The name conflicts with an existing formal or temporary partition | Change the temporary partition name |
| Adding a temporary partition fails: range overlap | The range or enumerated values overlap with an existing temporary partition | Adjust the range or drop the conflicting temporary partition first |
| Replacement fails: `strict_range` check fails | The range unions of the Range partitions are not equal | Make sure the unions match, or set `strict_range = false` explicitly |
| Replacement fails: List partition enumerated values do not match | `strict_range` is always `true` for List partitions | Adjust the temporary partitions so that their enumerated-value union exactly matches that of the formal partitions |
| Schema change cannot be executed | The table contains temporary partitions | Drop or replace all temporary partitions first |
| Temporary partition was dropped by mistake | `RECOVER` does not support recovering temporary partitions | Recreate the partition and reload the data |

## Related Documents

- [Atomic overwrite for non-partitioned tables: Replace Table](../../data-operate/delete/atomicity-replace)
