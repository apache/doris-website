---
{
    "title": "Usage Guidelines",
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



## Suggestions for column types

Suggestions for column types when creating a table:

1. The Key column should precede all Value columns.
2. Whenever possible, choose integer types. This is because the calculation and search efficiency of integer types are much higher than that of strings.
3. For selecting integer types of different lengths, follow the principle of sufficiency.
4. For the lengths of VARCHAR and STRING types, also follow the principle of sufficiency.



## Limitations of aggregate model

This section is about the limitations of the Aggregate Model.

The Aggregate Model only presents the aggregated data. That means we have to ensure the presentation consistency of data that has not yet been aggregated (for example, two different import batches). The following provides further explanation with examples.

Suppose that you have the following table schema:

| ColumnName | Type     | AggregationType | Comment                         |
| ---------- | -------- | --------------- | ------------------------------- |
| user\_id   | LARGEINT |                 | User ID                         |
| date       | DATE     |                 | Date when the data are imported |
| cost       | BIGINT   | SUM             | Total user consumption          |

Assume that there are two batches of data that have been imported into the storage engine as follows:

**batch 1**

| user\_id | date       | cost |
| -------- | ---------- | ---- |
| 10001    | 2017-11-20 | 50   |
| 10002    | 2017-11-21 | 39   |

**batch 2**

| user\_id | date       | cost |
| -------- | ---------- | ---- |
| 10001    | 2017-11-20 | 1    |
| 10001    | 2017-11-21 | 5    |
| 10003    | 2017-11-22 | 22   |

As you can see, data about User 10001 in these two import batches have not yet been aggregated. However, in order to ensure that users can only query the aggregated data as follows:

| user\_id | date       | cost |
| -------- | ---------- | ---- |
| 10001    | 2017-11-20 | 51   |
| 10001    | 2017-11-21 | 5    |
| 10002    | 2017-11-21 | 39   |
| 10003    | 2017-11-22 | 22   |

We have added an aggregation operator to the  query engine to ensure the presentation consistency of data.

In addition, on the aggregate column (Value), when executing aggregate class queries that are inconsistent with the aggregate type, please pay attention to the semantics. For example, in the example above, if you execute the following query:

`SELECT MIN(cost) FROM table;`

The result will be 5, not 1.

Meanwhile, this consistency guarantee could considerably reduce efficiency in some queries.

Take the basic count (*) query as an example:

`SELECT COUNT(*) FROM table;`

In other databases, such queries return results quickly. Because in actual implementation, the models can get the query result by counting rows and saving the statistics upon import, or by scanning only one certain column of data to get count value upon query, with very little overhead. But in Doris's Aggregation Model, the overhead of such queries is **large**.

For the previous example:

**batch 1**

| user\_id | date       | cost |
| -------- | ---------- | ---- |
| 10001    | 2017-11-20 | 50   |
| 10002    | 2017-11-21 | 39   |

**batch 2**

| user\_id | date       | cost |
| -------- | ---------- | ---- |
| 10001    | 2017-11-20 | 1    |
| 10001    | 2017-11-21 | 5    |
| 10003    | 2017-11-22 | 22   |

Since the final aggregation result is:

| user\_id | date       | cost |
| -------- | ---------- | ---- |
| 10001    | 2017-11-20 | 51   |
| 10001    | 2017-11-21 | 5    |
| 10002    | 2017-11-21 | 39   |
| 10003    | 2017-11-22 | 22   |

The correct result of  `select count (*) from table;`  should be **4**. But if the model only scans the `user_id` 
column and operates aggregation upon query, the final result will be **3** (10001, 10002, 10003). 
And if it does not operate aggregation, the final result will be **5** (a total of five rows in two batches). Apparently, both results are wrong.

In order to get the correct result, we must read both the  `user_id` and `date` column, and **performs aggregation** when querying.
That is to say, in the `count (*)` query, Doris must scan all AGGREGATE KEY columns (in this case, `user_id` and `date`) 
and aggregate them to get the semantically correct results. That means if there are many aggregated columns, `count (*)` queries could involve scanning large amounts of data.

Therefore, if you need to perform frequent `count (*)` queries, we recommend that you simulate `count (*)` by adding a 
column of value 1 and aggregation type SUM. In this way, the table schema in the previous example will be modified as follows:

| ColumnName | Type   | AggregationType | Comment                         |
| ---------- | ------ | --------------- | ------------------------------- |
| user ID    | BIGINT |                 | User ID                         |
| date       | DATE   |                 | Date when the data are imported |
| Cost       | BIGINT | SUM             | Total user consumption          |
| count      | BIGINT | SUM             | For count queries               |

The above adds a count column, the value of which will always be **1**, so the result of `select count (*) from table;`
is equivalent to that of `select sum (count) from table;` The latter is much more efficient than the former. However,
this method has its shortcomings, too. That is, it  requires that users will not import rows with the same values in the
AGGREGATE KEY columns. Otherwise, `select sum (count) from table;` can only express the number of rows of the originally imported data, instead of the semantics of `select count (*) from table;`

Another method is to add a `cound` column of value 1 but aggregation type of REPLACE. Then `select sum (count) from table;`
and `select count (*) from table;`  could produce the same results. Moreover, this method does not require the absence of same AGGREGATE KEY columns in the import data.

### Merge on write of unique model

The Merge on Write implementation in the Unique Model does not impose the same limitation as the Aggregate Model. 
In Merge on Write, the model adds a  `delete bitmap` for each imported rowset to mark the data being overwritten or deleted. With the previous example, after Batch 1 is imported, the data status will be as follows:

**batch 1**

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017-11-20 | 50   | false      |
| 10002   | 2017-11-21 | 39   | false      |

After Batch 2 is imported, the duplicate rows in the first batch will be marked as deleted, and the status of the two batches of data is as follows

**batch 1**

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017-11-20 | 50   | **true**   |
| 10002   | 2017-11-21 | 39   | false      |

**batch 2**

| user\_id | date       | cost | delete bit |
| -------- | ---------- | ---- | ---------- |
| 10001    | 2017-11-20 | 1    | false      |
| 10001    | 2017-11-21 | 5    | false      |
| 10003    | 2017-11-22 | 22   | false      |

In queries, all data marked `true` in the `delete bitmap` will not be read, so there is no need for data aggregation.
Since there are 4 valid rows in the above data, the query result should also be 4.  This also enables minimum overhead since it only scans one column of data.

In the test environment, `count(*)` queries in Merge on Write of the Unique Model deliver 10 times higher performance than that of the Aggregate Model.

### Duplicate model

The Duplicate Model does not impose the same limitation as the Aggregate Model because it does not involve aggregation semantics.
For any columns, it can return the semantically correct results in  `count (*)` queries.

## Key columns

For the Duplicate, Aggregate, and Unique Models, the Key columns will be specified when the table is created,
but there exist some differences: In the Duplicate Model, the Key columns of the table can be regarded as just "sorting columns",
but not unique identifiers. In Aggregate and Unique Models, the Key columns are both "sorting columns" and "unique identifier columns".

## Suggestions for choosing data model

Since the data model was established when the table was built, and **irrevocable thereafter, it is very important to select the appropriate data model**.

1. The Aggregate Model can greatly reduce the amount of data scanned and query computation by pre-aggregation. Thus, it is very suitable for report query scenarios with fixed patterns. But this model is unfriendly to `count (*)` queries. Meanwhile, since the aggregation method on the Value column is fixed, semantic correctness should be considered in other types of aggregation queries.
2. The Unique Model guarantees the uniqueness of primary key for scenarios requiring a unique primary key. The downside is that it cannot exploit the advantage brought by pre-aggregation such as ROLLUP in queries. Users who have high-performance requirements for aggregate queries are recommended to use the newly added Merge on Write implementation since version 1.2.
3. The Duplicate Model is suitable for ad-hoc queries of any dimensions. Although it may not be able to take advantage of the pre-aggregation feature, it is not limited by what constrains the Aggregate Model and can give full play to the advantage of columnar storage (reading only the relevant columns, but not all Key columns).
4. If user need to use partial-update, please refer to document [partial-update](../../data-operate/update/update-of-unique-model)