---
{
    "title": "Update Overview",
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
Starting from Doris 2.1, write merge will be the default mode for the unique key model. So, if you are using Doris 2.1, make sure to read the relevant table creation documentation.
:::

### Two Update Methods in Unique Key Model

- Update statement: This method is used to update a specific column and is suitable for infrequent updates with a small amount of data.

- Batch update based on load: Doris supports various load methods such as Stream Load, Broker Load, Routine Load, and Insert Into. For unique key tables, all load have the "UPSERT" semantics, meaning that if a row with the same key does not exist, it will be inserted, and if it already exists, it will be updated.

- If all columns are updated, MoR and MoW have the same semantics, which is to replace all value columns for the same key.

- If only some columns are updated, the default semantics for MoR and MoW are the same. In this case, the missing columns in the table schema will be updated with their default values, overwriting the old records.

- If only some columns are updated and MoW is used in the unique key model, and the MySQL session variable "partial_columns" is set to true, or the HTTP header "partial_columns" is set to true, the missing columns will be updated with the corresponding missing column values from the existing record, instead of using the default values from the table schema.

We will provide detailed explanations of these two update methods in the documentation: [Update in Unique Key Model](../update/unique-update) and [Load Update in Unique Key Model](../update/unique-load-update).

### Update Transactions in Unique Key Model

Whether you use the update statement or the batch update based on load, there may be multiple update statements or load jobs in progress. In such cases, it is important to ensure the effectiveness of multiple updates, maintain atomicity, and prevent data inconsistency. This is where update transactions in the unique key model come into play.

The documentation on update transactions in the unique key model will cover these aspects. In this document, we will focus on how to control the effectiveness of updates by introducing the hidden column __**DORIS_SEQUENCE_COL__, allowing developers to coordinate and achieve better update transactions.

## Update in Aggregate Model

The update in the aggregate model refers to the process of generating new aggregate values by combining new column values with existing aggregate values, according to the requirements of the aggregate functions.

New Agg Value = Agg Func ( Old Agg Value + New Column Value)

The update in the aggregate model is only supported through load methods and does not support the use of Update statements.

When defining a table in the aggregate model, if the aggregation function for the value column is defined as REPLACE_IF_NULL, it indirectly achieves partial column update capabilities similar to the unique key model.

For more details, please refer to the documentation on [Load Update in the Aggregate Model](../update/aggregate-load-update).