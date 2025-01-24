---
{
    "title": "Primary Key Model",
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


When data updates are required, you can choose to use the **Unique Key Model**. The Unique Key Model ensures the uniqueness of the Key columns. When users insert or update data, the newly written data will overwrite the old data with the same Key columns, thus maintaining the most up-to-date records. Compared to other data models, the Unique Key Model is suitable for data update scenarios, allowing updates and overwrites at the primary key level during the insertion process.

The Unique Key Model has the following characteristics:

* **UPSERT based on Primary Key**: When inserting data, records with duplicate primary keys are updated, while records without a primary key are inserted.

* **Deduplication based on Primary Key**: The Key columns in the Unique Key Model are unique, and data is deduplicated based on the primary key columns.

* **Supports High-frequency Data Updates**: It supports high-frequency data update scenarios while balancing the performance of data updates and query performance.

## Use Cases

* **High-frequency Data Updates**: In upstream OLTP databases, where dimension tables are frequently updated, the primary key model can efficiently synchronize the upstream updated records and perform efficient UPSERT operations.

* **Efficient Data Deduplication**: In scenarios such as advertising campaigns or customer relationship management systems, where deduplication is required based on user IDs, the primary key model ensures efficient deduplication.

* **Partial Record Updates**: In some business scenarios, only certain columns need to be updated, such as in user profiling where dynamic tags change frequently, or in order consumption scenarios where the transaction status needs to be updated. The primary key model's partial column update capability allows for changes to specific columns.

## Implementation Methods

In Doris, the Unique Key Model has two implementation methods:

* **Merge-on-write**: Starting from version 1.2, the default implementation of the Unique Key Model in Doris is the merge-on-write mode. In this mode, data is immediately merged for the same Key upon writing, ensuring that the data storage state after each write is the final merged result of the unique key, and only the latest result is stored. Merge-on-write provides a good balance between query and write performance, avoiding the need to merge multiple versions of data during queries and ensuring predicate pushdown to the storage layer. The merge-on-write model is recommended for most scenarios.

* **Merge-on-read**: Prior to version 1.2, Doris's Unique Key Model defaulted to merge-on-read mode. In this mode, data is not merged upon writing but is appended incrementally, retaining multiple versions within Doris. During queries or Compaction, data is merged by the same Key version. Merge-on-read is suitable for write-heavy and read-light scenarios, but during queries, multiple versions must be merged, and predicates cannot be pushed down, which may affect query speed.

In Doris, there are two types of update semantics for the Unique Key Model:

* The default update semantic for the Unique Key Model is **full row UPSERT**, i.e., UPDATE OR INSERT. If the Key of the row exists, it will be updated; if it does not exist, new data will be inserted. In the full row UPSERT semantic, even if the user inserts data into specific columns using `INSERT INTO`, Doris will fill in the missing columns with NULL values or default values during the planner stage.

* **Partial column updates**. If users want to update specific fields, they need to use the merge-on-write implementation and enable partial column updates support via specific parameters. Please refer to the documentation on [Partial Column Updates](../../data-operate/update/update-of-unique-model).

## Merge-on-write

### Creating a Merge-on-write Table

When creating a table, the **UNIQUE KEY** keyword can be used to specify a Unique Key table. The merge-on-write mode can be enabled by explicitly setting the `enable_unique_key_merge_on_write` attribute. Since Doris version 2.1, the merge-on-write mode is enabled by default:


```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

## Merge-on-read

### Creating a Merge-on-read Table

When creating a table, the **UNIQUE KEY** keyword can be used to specify a Unique Key table. The merge-on-read mode can be enabled by explicitly disabling the `enable_unique_key_merge_on_write` attribute. Before Doris version 2.1, the merge-on-read mode was enabled by default:

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    username        VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, username)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false"
);
```

## Data Insertion and Storage

In a Unique Key table, the Key column is not only used for sorting but also for deduplication. After data insertion, new data will overwrite records with the same Key value.

![unique-key-model-insert](/images/table-desigin/unique-key-model-insert.png)

As shown in the example, there were 4 rows of data in the original table. After inserting 2 new rows, the newly inserted rows are updated based on the primary key:

```sql
-- insert into raw data
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- insert into data to update by key
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 27, 1),
(102, 'Jason', 'SH', 28, 1);

-- check updated data
SELECT * FROM example_tbl_unique;
+---------+----------+------+------+------+
| user_id | username | city | age  | sex  |
+---------+----------+------+------+------+
| 101     | Tom      | BJ   |   27 |    1 |
| 102     | Jason    | SH   |   28 |    1 |
| 104     | Olivia   | SZ   |   22 |    2 |
| 103     | Juice    | SH   |   20 |    2 |
+---------+----------+------+------+------+
```

## Notes

* It is recommended to use the merge-on-write mode after Doris 1.2.4. In version 1.2, enabling merge-on-write requires adding the configuration `disable_storage_page_cache=false` in the `be.conf` file. Not enabling this option may significantly impact import performance. This feature is enabled by default in version 2.0 and later.

* The implementation method for Unique tables can only be determined during table creation and cannot be changed through schema changes.

* In the full row `UPSERT` semantic, even if users insert into specific columns using `INSERT INTO`, Doris will fill in the missing columns with NULL values or default values during the planner stage.

* **Partial column updates**: If users want to update specific fields, they need to use the merge-on-write implementation and enable partial column updates via specific parameters. Please refer to the documentation on [Partial Column Updates](../../data-operate/update/update-of-unique-model) for related usage suggestions.

