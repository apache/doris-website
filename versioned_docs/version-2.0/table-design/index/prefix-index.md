---
{
    "title": "Sort Key and Prefix Index",
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


Doris stores data in a data structure similar to SSTable (Sorted String Table), which is an ordered data structure that can sort and store data according to specified columns. Performing queries based on sorted columns in this data structure is highly efficient.

In the three data models of Aggregate, Unique, and Duplicate, the underlying data storage is sorted and stored according to the columns specified in the AGGREGATE KEY, UNIQUE KEY, and DUPLICATE KEY of their respective table creation statements. These keys are referred to as Sort Keys. With the help of Sort Keys, Doris can quickly find the data to be processed by specifying conditions on the sorted columns during queries, reducing the complexity of searching and thus accelerating the queries without the need to scan the entire table.

Based on the Sort Keys, Prefix Indexes are introduced. A Prefix Index is a sparse index. In the table, a logical data block is formed according to the corresponding number of rows. Each logical data block stores an index entry in the Prefix Index table. The length of the index entry does not exceed 36 bytes, and its content is the prefix composed of the sorted columns of the first row of data in the data block. When searching the Prefix Index table, it can help determine the starting row number of the logical data block where the row data is located. Because the Prefix Index is relatively small, it can be fully cached in memory, allowing for rapid data block localization and significantly improving query efficiency.

:::tip

The first 36 bytes of a row of data in a data block serve as the prefix index for that row. When encountering a `VARCHAR` type, the prefix index will be truncated directly. If the first column is of the `VARCHAR` type, truncation will occur even if the length does not reach 36 bytes.

:::

## Example

- If the sort keys of the table are as follows: 5 columns, then the prefix index would be: user_id (8 Bytes), age (4 Bytes), message (prefix 20 Bytes).

| ColumnName     | Type         |
| -------------- | ------------ |
| user_id        | BIGINT       |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

- If the sort keys of the table consist of 5 columns and the first column is `user_name` of the VARCHAR type, then the prefix index would be `user_name` (truncated to 20 Bytes). Even though the total size of the prefix index has not reached 36 bytes, truncation occurs because it encounters a VARCHAR column, and no further columns are included.

| ColumnName     | Type         |
| -------------- | ------------ |
| user_name      | VARCHAR(20)  |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

- When our query conditions match the prefix index, it can greatly accelerate the query speed. For example, in the first case, executing the following query:

```
SELECT * FROM table WHERE user_id=1829239 and age=20；
```

The efficiency of that query would be much higher than the following query:

```
SELECT * FROM table WHERE age=20；
```

Therefore, when creating a table, selecting the correct order of columns can greatly enhance query efficiency.

## Multiple prefix indexes

Due to the specified column order during table creation, a table typically has only one type of prefix index. This may not meet the efficiency requirements for queries that use other columns as conditions, which do not hit the prefix index. In such cases, multiple prefix indexes can be indirectly implemented by creating corresponding strongly consistent materialized views of the single table with adjusted column orders. For more details, please refer to  [Materialized Views](../../query/view-materialized-view/materialized-view).