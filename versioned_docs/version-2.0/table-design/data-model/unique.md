---
{
    "title": "Unique Key Model",
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



When users have data update requirements, they can choose to use the Unique data model. The unique model can ensure the uniqueness of the primary key. When a user updates a piece of data, the newly written data will overwrite the old data with the same primary key.

The Unique data model provides two implementation methods:

- Merge-on-read. In the merge-on-read implementation, users will not trigger any data deduplication-related operations when writing data. All data deduplication operations are performed during queries or compaction. Therefore, the write performance of merge-on-read is better, the query performance is poor, and the memory consumption is also higher.

- Merge-on-write. Starting from version 1.2, Doris has introduced the merge-on-write implementation, which completes all data deduplication work during the data write phase, thus providing excellent query performance. On a Unique table with the merge-on-write option enabled, data that will be overwritten and updated during the import phase will be marked for deletion, and new data will be written to a new file. During a query, all marked data will be filtered out at the file level, and the read data will be the latest data, eliminating the data aggregation process in merge-on-read and supporting the pushdown of various predicates in many cases. Therefore, it can bring significant performance improvements in many scenarios, especially when there are aggregated queries.

Let's look at how to create a Unique model table with merge-on-read and merge-on-write using a typical user basic information table as an example. This table does not have aggregation requirements and only needs to ensure the uniqueness of the primary key (The primary key is user_id + username).

| ColumnName    | Type          | IsKey | Comment                |
| ------------- | ------------- | ----- | ---------------------- |
| user_id       | BIGINT        | Yes   | User ID                |
| username      | VARCHAR (50)  | Yes   | Username               |
| city          | VARCHAR (20)  | No    | User location city     |
| age           | SMALLINT      | No    | User age               |
| sex           | TINYINT       | No    | User gender            |
| phone         | LARGEINT      | No    | User phone number      |
| address       | VARCHAR (500) | No    | User address           |
| register_time | DATETIME      | No    | User registration time |

## Merge-on-Read

The table creation statement for Merge-on-read is as follows:

```
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    `user_id` LARGEINT NOT NULL COMMENT "User ID",
    `username` VARCHAR(50) NOT NULL COMMENT "Username",
    `city` VARCHAR(20) COMMENT "User location city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `phone` LARGEINT COMMENT "User phone number",
    `address` VARCHAR(500) COMMENT "User address",
    `register_time` DATETIME COMMENT "User registration time"
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

## Merge-on-Write

The table creation statement for Merge-on-write is as follows:

```
CREATE TABLE IF NOT EXISTS example_tbl_unique_merge_on_write
(
    `user_id` LARGEINT NOT NULL COMMENT "User ID",
    `username` VARCHAR(50) NOT NULL COMMENT "Username",
    `city` VARCHAR(20) COMMENT "User location city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `phone` LARGEINT COMMENT "User phone number",
    `address` VARCHAR(500) COMMENT "User address",
    `register_time` DATETIME COMMENT "User registration time"
)
UNIQUE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"enable_unique_key_merge_on_write" = "true"
);
```

Users need to add the property with **enable_unique_key_merge_on_write" = "true"** when creating the table to enable Merge-on-write.

```
"enable_unique_key_merge_on_write" = "true"
```

In version 2.1, Merge-on-Write will be the default behavior for the unique key model. Therefore, if you are using Doris version 2.1, it is important to read the relevant table creation documentation.

## Use attention

- The implementation of the Unique model can only be determined during table creation and cannot be modified through schema changes.

- The Merge-on-read table cannot be seamlessly upgraded to the Merge-on-write table (due to completely different data organization methods). If you need to switch to Merge-on-write, you must manually perform an `INSERT INTO unique-mow-table SELECT * FROM source_table` to re-import the data.

- **Whole-row Updates**: The default update semantics for the Unique model is a whole-row UPSERT, which stands for UPDATE OR INSERT. If the key for a row of data exists, it will be updated; if it does not exist, new data will be inserted. Under the whole-row UPSERT semantics, even if the user specifies only certain columns for insertion using `INSERT INTO`, Doris will fill in the unprovided columns with NULL values or default values during the planning phase.

- **Partial Column Updates**: If the user wishes to update only certain fields, they must use Merge-on-write and enable support for partial column updates through specific parameters. Please refer to the documentation on [partial column updates](../../data-operate/update/update-of-unique-model) for relevant usage recommendations.