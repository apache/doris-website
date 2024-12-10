---
{
    "title": "ALTER STATS",
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

## Description

Manually modify the statistics of a specified column in a specified table. Please refer to the "Statistics" chapter.

## Syntax

```sql
ALTER TABLE <table_name>
  [ INDEX <index_name> ]
  MODIFY COLUMN <column_name>
  SET STATS (<column_stats>)
```

Where:

```sql
column_stats
  : -- column stats value
  ("key1" = "value1", "key2" = "value2" [...])
```
# Required Parameters

**<table_name>**

> Specifies the identifier (i.e., name) of the table.

**<column_name>**

> Specifies the column identifier (i.e., name). When <index_name> is not specified, it is the column name of the base table.

**<column_stats>**

> The statistics value to be set, given in the form of key = value, where both key and value need to be enclosed in quotation marks, and key-value pairs are separated by commas. The statistics that can be set include:

> row_count, total number of rows

> ndv, cardinality of the column

> num_nulls, number of null values in the column

> data_size, total size of the column

> min_value, minimum value of the column

> max_value, maximum value of the column

> Among them, row_count must be specified, and other attributes are optional. If not set, the corresponding statistic attribute value for that column will be empty.

# Optional Parameters

**<index_name>**

> Synchronized materialized view (please refer to the "Synchronized Materialized Views" chapter) identifier (i.e., name). A table can have 0 to multiple materialized views. If you need to set the statistics of a column in a materialized view, you need to use <index_name> to specify the name of the materialized view. If not specified, the properties of the column in the base table are set.

# Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes |
| :--------- | :----- | :---- |
| ALTER_PRIV | Table  |       |

# Usage Notes

After a user manually injects statistics into a table, the table will no longer participate in the automatic collection of statistics (please refer to the "Automatic Collection of Statistics" chapter) to avoid overwriting the statistics manually injected by the user. If the injected statistics are no longer used, the drop stats statement can be used to delete the already injected information, which allows the table to re-enable automatic collection.

# Examples

- Inject statistics into the p_partkey column of the part table (base table column, as no index_name is specified).

  ```sql
  alter 
      table part
      modify column p_partkey 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```

- Inject statistics into the col1 column of the index1 materialized view of the part table (materialized view column, as index_name is specified).

  ```sql
  alter 
      table part index index1
      modify column col1 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```