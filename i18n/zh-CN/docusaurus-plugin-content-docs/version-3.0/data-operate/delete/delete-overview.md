---
{
    "title": "删除操作概述",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

In Apache Doris, the delete operation is a critical feature used to manage and clean data to meet the flexibility needs of users in large-scale data analysis scenarios.

Doris provides a rich variety of delete functionalities, including DELETE statements, delete signs, partition deletion, full table deletion, and atomic overwrite using temporary partitions. The following sections will introduce each feature in detail:

### DELETE Statement

The most commonly used method for deleting data is the DELETE statement, which supports all table models. Users can use it to delete data that meets certain conditions.

The syntax of the DELETE statement is as follows:

```sql
DELETE FROM table_name WHERE condition;
```

The DELETE statement can meet most of the deletion needs of users when using Doris, but it is not the most efficient in some scenarios. To flexibly and efficiently meet the deletion needs of users in various scenarios, Doris also provides the following deletion methods.

### Partition Deletion

In Doris, it is common practice to manage data through date partitions and other methods. Many users only need to retain data for a recent period (e.g., 7 days). For expired data partitions, the partition deletion (truncate partition) feature can be used for efficient deletion.

Compared to the DELETE statement, partition deletion only needs to modify some partition metadata to complete the deletion, making it the best deletion method in this scenario.

The syntax of partition deletion is as follows:

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

### Full Table Deletion

Full table deletion is suitable for quickly clearing a table while retaining the table structure, such as when redoing data in offline analysis scenarios.

The syntax of full table deletion is as follows:

```sql
TRUNCATE TABLE table_name;
```

### Delete Sign

Data deletion can be considered a type of data update. Therefore, on the primary key model (Unique Key) with update capabilities, users can use the delete sign feature to perform delete operations in the form of data updates.

For example, in CDC data synchronization scenarios, the CDC program can mark a DELETE operation binlog with a delete sign. When this data is written to Doris, the corresponding primary key will be deleted.

This method can perform batch deletion of a large number of primary keys, which is more efficient than the DELETE statement.

The delete sign is an advanced feature and is more complex to use compared to the previous methods. For detailed usage, please refer to the document [Batch Deletion](./delete-overview.md).

### Atomic Overwrite Using Temporary Partitions

In some cases, users want to rewrite the data of a partition. However, if the data is deleted and then imported, there will be a period when the data cannot be viewed. In this case, users can first create a corresponding temporary partition, import the new data into the temporary partition, and then replace the original partition atomically to achieve the goal. For detailed usage, please refer to the document [Atomic Table Replacement](./atomicity-replace.md).

## Precautions

1. The delete operation will generate new data versions, so frequent deletions may increase the number of versions, thereby affecting query performance.
2. Deleted data will still occupy storage until the merge and compression are completed, so the delete operation itself will not immediately reduce storage usage.
