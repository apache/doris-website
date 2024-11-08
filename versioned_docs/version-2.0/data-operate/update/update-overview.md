---
{
    "title": "Updating Overview",
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

Data update primarily refers to the modification of the value column of data with the same key. For the primary(unique) key model, this update involves replacing the existing value, while for the aggregate model, it involves aggregating the values in the value column.

## Update in Primary Key (Unique) Model

Starting from Doris 2.0, Doris primary key (unique) model supports both Merge-on-Read (MoR) and Merge-on-Write (MoW) storage modes. MoR is optimized for write operations, while MoW is optimized for faster analysis performance. In actual tests, the analysis performance of MoW storage can be 5-10 times faster than MoR.

By default, in Doris 2.0, the unique key model is still based on MoR. To create a MoW model, you need to manually specify the parameter "enable_unique_key_merge_on_write" as "true". Here's an example:

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique_merge_on_write
(
    `user_id` LARGEINT NOT NULL,
    `username` VARCHAR(50) NOT NULL ,
    `city` VARCHAR(20),
    `age` SMALLINT,
    `sex` TINYINT,
    `phone` LARGEINT,
    `address` VARCHAR(500),
    `register_time` DATETIME
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"enable_unique_key_merge_on_write" = "true"
);
```

:::caution
Starting from Doris 2.1, MoW is the default mode for the unique key model. So, if you are using Doris 2.1 or higher version, make sure to read the relevant table creation documentation.
:::

### Two Update Methods in Unique Key Model

#### `UPDATE` statement

Whether it is MoR or MoW, the semantics ensure that the specified columns are updated. The time taken for a single UPDATE operation increases with the amount of data being updated.

#### Batch update based on load

Doris supports multiple data load methods, including Stream Load, Broker Load, Routine Load, and Insert Into. For primary key tables, all load operations default to "UPSERT" semantics: if a record with the same key does not exist, it is inserted; if it already exists, it is updated. There are two types of updates: full row updates and partial column updates.

- **Full Row Update**: Updates for Unique Key tables default to full row updates. During data loading, users can choose to provide either all fields or only part of them. If only partial fields are provided, Doris will fill in the missing fields with default values to form a complete record for updating.

- **Partial Column Update**: Unique Key MoW supports partial column updates. Users can enable this feature by setting the session variable `enable_unique_key_partial_update = true` or by specifying `partial_columns:true` in the HTTP Header. When enabled, if a record with the given primary key exists, only the specified fields are updated; if the primary key does not exist, the missing fields are filled with default values.

We will provide detailed explanations of these two update methods in the documentation: [Update in Unique Key Model](../update/unique-update) and [Load Update in Unique Key Model](../update/update-of-unique-model).

### Update Transactions in Unique Key Model

#### Updating Data Using the `UPDATE` Statement

By default, Doris does not allow multiple `UPDATE` operations on the same table to occur concurrently. The `UPDATE` statement uses table-level locking to ensure transactional consistency.

Users can adjust concurrency limits by modifying the FE configuration `enable_concurrent_update=true`. When concurrency limits are relaxed, the `UPDATE` statement will no longer provide transactional guarantees.

#### Batch Updates Based on Load

Doris provides atomicity for all load update operations—each data load will either be fully applied or fully rolled back.

For concurrent load updates, Doris determines the order of concurrent updates using an internal version control system (assigned based on the order of completed loading), using an MVCC mechanism.

Since the commit order of multiple concurrent load updates may be unpredictable, if these concurrent load jobs involve updates to the same primary key, the order in which they take effect is also uncertain. As a result, the final visible outcome may be indeterminate. To address this issue, Doris provides a `sequence` column mechanism, allowing users to specify a version for each row in concurrent load updates, thus ensuring determinism in the outcome of concurrent updates.

For more detailed information on transaction mechanisms, refer to the documentation on [Transactional Updates in the Primary Key Model](../update/unique-update-transaction.md).

## Update in Aggregate Model

The update in the aggregate model refers to the process of generating new aggregate values by combining new column values with existing aggregate values, according to the requirements of the aggregate functions.

New Agg Value = Agg Func ( Old Agg Value, New Column Value)

The update in the aggregate model is only supported through load methods and does not support the use of Update statements. When defining a table in the aggregate model, if the aggregation function for the value column is defined as REPLACE_IF_NULL, it indirectly achieves partial column update capabilities similar to the unique key model. For more details, please refer to the documentation on [Load Update in the Aggregate Model](../update/update-of-aggregate-model).

## Comparison of Update Capabilities for Different Models/Implementations

### Performance Comparison
|                | Unique Key MoW                                                                                                                                                               | Unique Key MoR | Aggregate Key |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------|---------------|
| Import Speed   | Deduplication is performed during import. Small-batch real-time writes incur approximately 10%-20% performance loss compared to MoR, while large-batch imports (e.g., tens or hundreds of millions of records) have about 30%-50% performance loss compared to MoR. | Similar to Duplicate Key | Similar to Duplicate Key |
| Query Speed    | Similar to Duplicate Key                                                                                                                                                      | Requires deduplication during queries, with query time approximately 3-10 times that of MoW | If the aggregation function is REPLACE/REPLACE_IF_NOT_NULL, query speed is similar to MoR |
| Predicate Pushdown | Supported                                                                                                                                                                | Not Supported  | Not Supported |
| Resource Consumption | - **Import Resource Consumption**: Consumes approximately 10%-30% more CPU compared to Duplicate Key/Unique Key MoR.<br /> - **Query Resource Consumption**: Similar to Duplicate Key with no additional resource consumption.<br /> - **Compaction Resource Consumption**: Higher memory and CPU usage compared to Duplicate Key, specific usage depends on data characteristics and volume. | - **Import Resource Consumption**: Similar to Duplicate Key with no additional resource consumption.<br /> - **Query Resource Consumption**: Higher CPU and memory consumption during queries compared to Duplicate Key/Unique Key MoW.<br /> - **Compaction Resource Consumption**: Higher memory and CPU usage than Duplicate Key, specific usage depends on data characteristics and volume. | Same as Unique Key MoR |

### Feature Support Comparison
|                | Unique Key MoW | Unique Key MoR | Aggregate Key |
|----------------|----------------|----------------|---------------|
| UPDATE         | Supported       | Supported      | Not Supported |
| DELETE         | Supported       | Supported      | Not Supported |
| sequence column| Supported       | Supported      | Not Supported |
| delete_sign    | Supported       | Supported      | Not Supported |
| Partial Column Updates | Supported | Not Supported | Supported(can't update null value) |
| Inverted Index | Supported       | Not Supported  | Not Supported |
