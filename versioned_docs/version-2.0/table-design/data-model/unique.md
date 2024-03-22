---
{
    "title": "Unique Key",
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


## Unique Model

When users have data update requirement, they can choose to use the Unique data model. The Unique model ensures the uniqueness of keys, and when a user updates a piece of data, the newly written data will overwrite the old data with the same key.

**Two Implementation Methods**

The Unique model provides two implementation methods:

- Merge-on-read: In the merge-on-read implementation, no data deduplication-related operations are triggered when writing data. All data deduplication operations occur during queries or compaction. Therefore, merge-on-read has better write performance, poorer query performance, and higher memory consumption.
- Merge-on-write: In version 1.2, we introduced the merge-on-write implementation, which performs all data deduplication during the data writing phase, providing excellent query performance.

Since version 2.0, merge-on-write has become a mature and stable, due to its excellent query performance, we recommend the majority of users to choose this implementation. Starting from version 2.1, merge-on-write has become the default implementation for the Unique model.
For detailed differences between the two implementation methods, refer to the subsequent sections in this chapter. For performance differences between the two implementation methods, see the description in the following section [Limitations of Aggregate Model](#limitations-of-aggregate-model).

**Semantic of Data Updates**

- The default update semantic for the Unique model is **whole-row `UPSERT`**, meaning UPDATE OR INSERT. If the key of a row of data exists, it is updated; if it does not exist, new data is inserted. Under the whole-row `UPSERT` semantic, even if users use `insert into` to write into specific columns, Doris will fill in the columns not provided with NULL values or default values in the Planner.
- Partial column updates: If users want to update only specific fields, they need to use the merge-on-write implementation and enable support for partial column updates through specific parameters. Refer to the documentation [Partial Column Updates](../data-operate/update-delete/partial-update.md) for relevant usage recommendations.

### Merge on Read ( Same Implementation as Aggregate Model)

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

This is a typical user basic information table. There is no aggregation requirement for such data. The only concern is to ensure the uniqueness of the primary key. (The primary key here is user_id + username). The CREATE TABLE statement for the above table is as follows:

```sql
CREATE TABLE IF NOT EXISTS example_db.example_tbl_unique
(
`user_id` LARGEINT NOT NULL COMMENT "User ID",
`username` VARCHAR (50) NOT NULL COMMENT "Username",
`city` VARCHAR (20) COMMENT "User location city",
`age` SMALLINT COMMENT "User age",
`sex` TINYINT COMMENT "User sex",
`phone` LARGEINT COMMENT "User phone number",
`address` VARCHAR (500) COMMENT "User address",
`register_time` DATETIME COMMENT "User registration time"
)
UNIQUE KEY (`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

This is the same table schema and the CREATE TABLE statement as those of the Aggregate Model:

| ColumnName    | Type          | AggregationType | Comment                |
| ------------- | ------------- | --------------- | ---------------------- |
| user_id       | BIGINT        |                 | User ID                |
| username      | VARCHAR (50)  |                 | Username               |
| city          | VARCHAR (20)  | REPLACE         | User location city     |
| age           | SMALLINT      | REPLACE         | User age               |
| sex           | TINYINT       | REPLACE         | User gender            |
| phone         | LARGEINT      | REPLACE         | User phone number      |
| address       | VARCHAR (500) | REPLACE         | User address           |
| register_time | DATETIME      | REPLACE         | User registration time |

```sql
CREATE TABLE IF NOT EXISTS example_db.example_tbl_agg3
(
`user_id` LARGEINT NOT NULL COMMENT "User ID",
`username` VARCHAR (50) NOT NULL COMMENT "Username",
`city` VARCHAR (20) REPLACE COMMENT "User location city",
`sex` TINYINT REPLACE COMMENT "User gender",
`phone` LARGEINT REPLACE COMMENT "User phone number",
`address` VARCHAR(500) REPLACE COMMENT "User address",
`register_time` DATETIME REPLACE COMMENT "User registration time"
)
AGGREGATE KEY(`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

That is to say, the Merge on Read implementation of the Unique Model is equivalent to the REPLACE aggregation type in the Aggregate Model. The internal implementation and data storage are exactly the same.

<version since="1.2">

### Merge on Write

The Merge on Write implementation of the Unique Model can deliver better performance in aggregation queries with primary key limitations.

In Doris 1.2.0, as a new feature, Merge on Write is disabled by default(before version 2.1), and users can enable it by adding the following property:

```
"enable_unique_key_merge_on_write" = "true"
```

In Doris 2.1, Merge on Write is enabled by default.

> Note:
>
> 1. For users on version 1.2:
>    1. It is recommended to use version 1.2.4 or above, as this version addresses some bugs and stability issues.
>    2. Add the configuration item `disable_storage_page_cache=false` in `be.conf`. Failure to add this configuration item may significantly impact data import performance.
> 2. For new users, it is strongly recommended to use version 2.0 or above. In version 2.0, there has been a significant improvement and optimization in the performance and stability of merge-on-write.

Take the previous table as an example, the corresponding to CREATE TABLE statement should be:

```sql
CREATE TABLE IF NOT EXISTS example_db.example_tbl_unique_merge_on_write
(
`user_id` LARGEINT NOT NULL COMMENT "User ID",
`username` VARCHAR (50) NOT NULL COMMENT "Username",
`city` VARCHAR (20) COMMENT "User location city",
`age` SMALLINT COMMENT "Userage",
`sex` TINYINT COMMENT "User gender",
`phone` LARGEINT COMMENT "User phone number",
`address` VARCHAR (500) COMMENT "User address",
`register_time` DATETIME COMMENT "User registration time"
)
UNIQUE KEY (`user_id`, `username`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
"enable_unique_key_merge_on_write" = "true"
);
```

The table schema produced by the above statement will be different from that of the Aggregate Model.


| ColumnName    | Type          | AggregationType | Comment                |
| ------------- | ------------- | --------------- | ---------------------- |
| user_id       | BIGINT        |                 | User ID                |
| username      | VARCHAR (50)  |                 | Username               |
| city          | VARCHAR (20)  | NONE            | User location city     |
| age           | SMALLINT      | NONE            | User age               |
| sex           | TINYINT       | NONE            | User gender            |
| phone         | LARGEINT      | NONE            | User phone number      |
| address       | VARCHAR (500) | NONE            | User address           |
| register_time | DATETIME      | NONE            | User registration time |

On a Unique table with the Merge on Write option enabled, during the import stage, the data that are to be overwritten and updated will be marked for deletion, and new data will be written in. When querying, all data marked for deletion will be filtered out at the file level, and only the latest data would be readed. This eliminates the data aggregation cost while reading, and supports many types of predicate pushdown now. Therefore, it can largely improve performance in many scenarios, especially in aggregation queries.

[NOTE]

1. The implementation method of a Unique table can only be determined during table creation and cannot be modified through schema changes.
2. The old Merge on Read cannot be seamlessly upgraded to the Merge on Write implementation (since they have completely different data organization). If you want to switch to the Merge on Write implementation, you need to manually execute `insert into unique-mow-table select * from source table` to load data to new table.

</version>