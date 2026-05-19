---
title: Delete Operations Overview
language: en
description: What are the ways to delete data in Apache Doris? This article compares the DELETE statement, partition deletion, full-table deletion, delete sign, and atomic overwrite, helping you choose the most suitable deletion approach.
keywords:
    - Doris delete data
    - DELETE statement
    - TRUNCATE TABLE
    - partition deletion
    - delete sign
    - batch delete
    - temporary partition replacement
    - atomic overwrite
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Data cleanup / Data update / Partition management -->

Apache Doris provides multiple deletion methods, covering typical scenarios such as conditional deletion, partition-level deletion, full-table truncation, batch primary key deletion, and atomic overwrite. Starting from user scenarios, this article helps you quickly choose the most suitable deletion approach.

## Quick Navigation

Choose the corresponding deletion method based on your scenario:

| Use Case                                              | Recommended Method                                              | Applicable Model     | Characteristics                                |
| ----------------------------------------------------- | --------------------------------------------------------------- | -------------------- | ---------------------------------------------- |
| Delete part of the data by condition                  | [DELETE statement](./delete-manual.md)                          | All table models     | General-purpose, flexible                      |
| Delete expired partitions (for example, keep last 7 days) | [Partition deletion (TRUNCATE)](./truncate-manual.md)         | Partitioned tables   | Modifies metadata only, highest efficiency     |
| Empty an entire table while keeping the schema        | [Full-table deletion (TRUNCATE)](./truncate-manual.md)          | All table models     | Quickly resets data                            |
| Bulk delete a large number of primary keys (CDC sync, etc.) | [Delete Sign](./batch-delete-manual.md)                   | Unique Key model     | Implements bulk deletion through updates       |
| Rewrite partition data without interrupting queries   | [Atomic replacement with temporary partitions](./table-temp-partition.md) | Partitioned tables | Atomic overwrite, avoids query gaps           |

## Detailed Explanation of Deletion Methods

### 1. DELETE Statement: Conditional Deletion

<!-- Knowledge type: Operation steps -->

Suitable for the general scenario of deleting part of the data by condition, and supports all table models.

**Syntax:**

```sql
DELETE FROM table_name WHERE condition;
```

**Notes on applicability:**

- Meets most day-to-day deletion needs
- Less efficient than the methods below for bulk deletion or full-partition deletion scenarios

For detailed usage, see [Delete operation](./delete-manual.md).

### 2. Partition Deletion: Efficiently Cleaning Up Expired Data

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Data lifecycle management -->

In Doris, managing data by date partitions is a common practice. When you only need to keep data from a recent period (for example, the last 7 days), partition deletion (truncate partition) is recommended.

**Syntax:**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

**Advantages:**

- Modifies only the partition metadata, no data scan required
- Best practice for cleaning up expired partitions

For detailed usage, see [Truncate operation](./truncate-manual.md).

### 3. Full-Table Deletion: Quickly Empty a Table

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Offline analysis rerun / Data reset -->

Suitable for scenarios where you need to quickly empty an entire table while keeping its schema, such as redoing data in offline analysis.

**Syntax:**

```sql
TRUNCATE TABLE table_name;
```

For detailed usage, see [Truncate operation](./truncate-manual.md).

### 4. Delete Sign: Bulk Primary Key Deletion

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: CDC data sync / Bulk primary key deletion -->

Data deletion can be viewed as a special form of data update. On a primary key model with update capability (Unique Key), you can use a delete sign to perform deletion through update writes.

**Typical scenarios:**

- CDC (Change Data Capture) data sync: tag the binlog of a DELETE operation with a delete sign and write it into Doris to delete the data with the corresponding primary key.

**Advantages and limitations:**

- Supports bulk primary key deletion, more efficient than the DELETE statement
- An advanced feature, with relatively higher usage complexity

For detailed usage, see [Batch delete](./batch-delete-manual.md).

### 5. Atomic Replacement with Temporary Partitions: Overwrite Without Interrupting Queries

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Partition data rewrite / Business continuity -->

When you need to rewrite the data of a partition, directly using the "delete first, then load" approach leaves a window during which the data cannot be queried. Atomic replacement with temporary partitions avoids this issue.

**Procedure:**

1. Create a temporary partition that corresponds to the target partition
2. Load the new data into the temporary partition
3. Atomically replace the original partition through a replace operation

For detailed usage, see [Temporary partition](./table-temp-partition.md). If you need to atomically replace an entire table, see [Atomic table replacement](./atomicity-replace.md).

## Comparison of Deletion Methods

| Method                              | Syntax Keyword               | Deletion Granularity | Performance           | Supports All Table Models |
| ----------------------------------- | ---------------------------- | -------------------- | --------------------- | ------------------------- |
| DELETE statement                    | `DELETE FROM`                | By condition         | Medium                | Yes                       |
| Partition deletion                  | `TRUNCATE PARTITION`         | Entire partition     | High (metadata only)  | Partitioned tables only   |
| Full-table deletion                 | `TRUNCATE TABLE`             | Entire table         | High                  | Yes                       |
| Delete sign                         | Write `__DORIS_DELETE_SIGN__` | By primary key      | High (bulk)           | Unique Key model only     |
| Atomic replacement with temp partition | `REPLACE PARTITION`       | Entire partition     | High                  | Partitioned tables only   |

## Considerations

- **Impact on the number of versions**: Deletion operations generate new data versions. Frequent deletions may increase the version count and in turn affect query performance.
- **Storage release delay**: Deleted data still occupies storage until Compaction completes. The deletion operation itself does not immediately reduce storage usage.
- **Table model restrictions**: Delete sign applies only to the Unique Key primary key model. Partition-related deletion applies only to partitioned tables.

## Frequently Asked Questions (FAQ)

**Q1: What is the difference between the DELETE statement and TRUNCATE?**

The DELETE statement deletes data by a WHERE condition and can be used on any table. TRUNCATE directly deletes an entire table or an entire partition by modifying only the metadata, which is faster but coarser in granularity.

**Q2: Why is storage space not released immediately after deletion?**

After deletion, the data is truly removed from storage only after the background Compaction merge completes. This is normal behavior.

**Q3: How do I efficiently handle DELETE events in CDC sync scenarios?**

The Unique Key primary key model combined with the delete sign approach is recommended. It can process a large number of primary key deletions in bulk, with significantly higher efficiency than executing DELETE statements one by one.

**Q4: How do I keep queries uninterrupted while rewriting partition data?**

Use atomic replacement with temporary partitions: write the new data into a temporary partition first, then switch partitions through an atomic replacement operation. The whole process is transparent to queries.

## Related Documents

- [Delete operation](./delete-manual.md)
- [Load-based batch delete](./batch-delete-manual.md)
- [Truncate operation](./truncate-manual.md)
- [Atomic table replacement](./atomicity-replace.md)
- [Temporary partition](./table-temp-partition.md)
