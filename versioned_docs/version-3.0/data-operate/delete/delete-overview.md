---
{
    "title": "Delete Overview",
    "language": "en"
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

In Apache Doris, the delete operation is a key feature for managing and cleaning data to meet the flexibility needs of users in large-scale data analysis scenarios. Doris's deletion mechanism supports efficient logical deletion and multi-version data management, achieving a good balance between performance and flexibility.

## Implementation Mechanism of Deletion

Doris's delete operation uses **logical deletion** rather than directly physically deleting data. The core implementation mechanisms are as follows:

1. **Logical Deletion**. The delete operation does not directly remove data from storage but adds a delete marker to the target data. There are two main ways to implement logical deletion: delete predicate and delete sign.

    1. Delete predicate is used for Duplicate and Aggregate models. Each deletion directly records a conditional predicate on the corresponding dataset to filter out the deleted data during queries.
    2. Delete sign is used for the Unique Key model. Each deletion writes a new batch of data to overwrite the data to be deleted, and the hidden column `__DORIS_VERSION_COL__` of the new data is set to 1, indicating that the data has been deleted.
    3. Performance comparison: The operation speed of "delete predicate" is very fast, whether deleting 1 row or 100 million rows, the speed is almost the same, it just write a conditional predicate to the dataset; the write speed of delete sign is proportional to the amount of data.

2. **Multi-Version Data Management**. Doris supports multi-version data (MVCC, Multi-Version Concurrency Control), allowing concurrent operations on the same dataset without affecting query results. The delete operation creates a new version containing the delete marker, while the old version data is still retained.

3. **Physical Deletion (Compaction)**. The periodically executed compaction process cleans up data marked for deletion, thereby freeing up storage space. This process is automatically completed by the system without user intervention. Note that only Base Compaction will physically delete data, while Cumulative Compaction only merges and reorders data, reducing the number of rowsets and segments.

## Use Cases for Delete Operations

Doris provides various deletion methods to meet different needs:

### Conditional Deletion

Users can delete rows that meet specified conditions. For example:

```sql
DELETE FROM table_name WHERE condition;
```

### Batch Deletion via data loading

During data loading, logical deletion can be achieved by overwriting. This method is suitable for batch deletion of a large number of keys or synchronizing TP database deletions during CDC binlog synchronization.

### Deleting All Data

In some cases, data can be deleted by directly truncating the table or partition. For example:

```sql
TRUNCATE TABLE table_name;
```

### Atomic Overwrite Using Temporary Partitions

In some cases, users may want to rewrite the data of a partition. If the data is deleted and then imported, there will be a period when the data is unavailable. In this case, users can create a corresponding temporary partition, import the new data into the temporary partition, and then replace the original partition atomically to achieve the goal.

## Notes

1. The delete operation generates new data versions, so frequent deletions may increase the number of versions, affecting query performance.
2. Compaction is a key step in freeing up storage space. Users are advised to adjust the compaction strategy based on system load.
3. Deleted data will still occupy storage until compaction is completed, so the delete operation itself will not immediately reduce storage usage.

