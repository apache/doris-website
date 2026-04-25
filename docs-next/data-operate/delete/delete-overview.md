---
{
    "title": "Delete Overview",
    "language": "en",
    "description": "In Apache Doris, the delete operation is essential for managing and cleaning data to meet the flexible needs of users in large-scale data analysis "
}
---

In Apache Doris, the delete operation is essential for managing and cleaning data to meet the flexible needs of users in large-scale data analysis scenarios.

Doris offers a variety of delete functionalities, including DELETE statements, delete sign, partition deletion, full table deletion, and atomic overwrite using temporary partitions. The following sections will detail each feature:

### DELETE Statement

The DELETE statement is the most commonly used method for deleting data and supports all table models. Users can use it to delete data that meets specific conditions.

The syntax of the DELETE statement is as follows:

```sql
DELETE FROM table_name WHERE condition;
```

While the DELETE statement can handle most deletion needs, it may not be the most efficient in some scenarios. To address various deletion requirements flexibly and efficiently, Doris also provides the following methods.

### Truncate Partition 

In Doris, managing data through date partitions and other methods is common. Many users only need to retain data for a recent period (e.g., 7 days). For expired data partitions, the truncate partition feature can be used for efficient deletion.

Compared to the DELETE statement, truncate partition only requires modifying some partition metadata to complete the deletion, making it the best method in this scenario.

The syntax of partition deletion is as follows:

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

### Truncate Table

Truncate table is suitable for quickly clearing a table while retaining its structure, such as when redoing data in offline analysis scenarios.

The syntax of full truncate table is as follows:

```sql
TRUNCATE TABLE table_name;
```

### Delete Sign 

Data deletion can be considered a type of data update. Therefore, on the primary key model (Unique Key) with update capabilities, users can use the delete sign feature to perform delete operations as data updates.

For example, in CDC data synchronization scenarios, the CDC program can mark a DELETE operation binlog with a delete sign. When this data is written to Doris, the corresponding primary key will be deleted.

This method can perform batch deletion of a large number of primary keys, which is more efficient than the DELETE statement.

The delete sign is an advanced feature and is more complex to use compared to the previous methods. For detailed usage, please refer to the document [Batch Deletion](./batch-delete-manual.md).

### Atomic Overwrite Using Temporary Partitions

In some cases, users want to rewrite the data of a partition. However, if the data is deleted and then loaded, there will be a period when the data is unavailable. In this case, users can first create a corresponding temporary partition, load the new data into the temporary partition, and then replace the original partition atomically. For detailed usage, please refer to the document [Atomic Table Replacement](./atomicity-replace.md).

## Precautions

1. The delete operation will generate new data versions, so frequent deletions may increase the number of versions, thereby affecting query performance.
2. Deleted data will still occupy storage until merge and compression are completed, so the delete operation itself will not immediately reduce storage usage.
