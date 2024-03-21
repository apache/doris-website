---
{
    "title": "Bitmap Index",
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

# Bitmap index

Bitmap Index is an index represented by bitmaps, where a bitmap is created for each key value in a column. Compared to other indexes, it occupies very little storage space and is very fast to create and use. However, it has a disadvantage of having a large lock granularity for modification operations, making it unsuitable for frequent updates.

![bitmap index](/images/Bitmap-index.png)

### Applicable scenarios

- Columns with high value repetition, recommended to be between 100 and 100,000, such as occupation, city, etc. If the repetition is too high, there is no significant advantage compared to other types of indexes; if the repetition is too low, space efficiency and performance will be greatly reduced.
- Specific types of queries such as `count`, `or`, `and` logical operations that only require bitwise operations. For example: querying with multiple conditions combined, `select count(*) from table where city = 'Nanjing' and job = 'Doctor' and phonetype = 'iphone' and gender = 'Male'.` If bitmap indexes are established on each query condition column, the database can perform efficient bit operations, accurately locate the required data, reduce disk IO, and the smaller the filtered result set, the more obvious the advantage of bitmap indexes.
- Suitable for ad-hoc queries, multi-dimensional analysis, and other analytical scenarios. If a table has 100 columns and users use 20 of them as query conditions (arbitrarily using several columns from these 20 columns), creating 20 bitmap indexes on these columns will allow all queries to utilize the indexes.

### Inapplicable scenarios

- Columns with low value repetition, such as ID cards, phone numbers, etc.
- Columns with excessively high repetition, such as gender. Although bitmap indexes can be established, it is not recommended to use them as query conditions alone. It is recommended to filter them together with other conditions.
- Columns that often need to be updated.

### Creating bitmap index

Creating a bitmap index named index_name on the column siteid in the table named table_name:

```
CREATE INDEX [IF NOT EXISTS] index_name ON table1 (siteid) USING BITMAP;
```

## Viewing bitmap index

Displaying indexes under the specified table_name:

```
SHOW INDEX FROM table_name;
```

### Deleting index

Deleting the index named index_name under the specified table_name:

```
DROP INDEX [IF EXISTS] index_name ON table_name;
```

### Notes:

- Bitmap indexes are only created on single columns.
- Bitmap indexes can be applied to all columns in Duplicate and Uniq data models and key columns in the Aggregate model.
- The data types supported by bitmap indexes are as follows: 
  - `TINYINT`
  - `SMALLINT`
  - `INT`
  - `BIGINT`
  - `CHAR`
  - `VARCHAR`
  - `DATE`
  - `DATETIME`
  - `LARGEINT`
  - `DECIMAL`
  - `BOOL`