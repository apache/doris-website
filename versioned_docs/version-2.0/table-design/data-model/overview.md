---
{
    "title": "Table Model Overview",
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

When creating a table in Doris, it is necessary to specify the table model to define how data is stored and managed. Doris provides three table models: the **Duplicate Key Model**, **Unique Key Model** and **Aggregate Key Model**, which cater to different application scenarios. Each model has corresponding mechanisms for data deduplication, aggregation, and updates. Choosing the appropriate table model helps achieve business objectives while ensuring flexibility and efficiency in data processing.

## Table Model Classification

Doris supports three types of table models:

* [Duplicate Key Model](./duplicate): Allows the specified Key columns to be duplicated, and Doris's storage layer retains all written data. This model is suitable for situations where all original data records must be preserved.

* [Unique Key Model](./unique): Ensures that each row has a unique Key value, and guarantees that there are no duplicate rows for a given Key column. The Doris storage layer retains only the latest written data for each key, making this model suitable for scenarios that involve data updates.

* [Aggregate Key Model](./aggregate): Allows data to be aggregated based on the Key columns. The Doris storage layer retains aggregated data, reducing storage space and improving query performance. This model is typically used in situations where summary or aggregated information (such as totals or averages) is required.

After creating the table, the properties of the table model are confirmed and cannot be modified. Choosing the right model for the business is crucial:

* **Duplicate Key Model** is suitable for ad-hoc queries with any dimensions. Although it cannot leverage the benefits of pre-aggregation, it is not constrained by aggregation models and can take advantage of the columnar storage model (only reading relevant columns without needing to read all key columns).

* **Unique Key Model** is designed for scenarios where a unique key constraint is needed, ensuring the uniqueness of the key. However, it cannot utilize the query benefits brought by pre-aggregations such as ROLLUP. 

* **Aggregate Key Model** can greatly reduce the data and computation required for aggregation queries through pre-aggregation, making it ideal for fixed-schema reporting queries. However, this model is not friendly to `count(*)` queries. Also, because the aggregation method for the Value columns is fixed, when performing other types of aggregation queries, semantic correctness must be considered.

* **Update partial columns**, please refer to the documentation for [Partial Column Updates in Unique Key Model](../../data-operate/update/update-of-aggregate-model) and [Partial Column Updates in Aggregate Model](../../data-operate/update/update-of-aggregate-model) for relevant usage advice.



## Sort Key

In Doris, data is stored in a columnar format, and a table can be divided into Key columns and Value columns. The Key columns are used for grouping and sorting, while the Value columns are used for aggregation. Key columns can consist of one or more fields, and when creating a table, data is sorted and stored according to the columns of Aggregate Key, Unique Key, and Duplicate Key models.

Different table models require the specification of Key columns during table creation, each with a different significance: for the Duplicate Key model, the Key columns represent sorting, without any uniqueness constraints. In the Aggregate Key and Unique Key models, aggregation is performed based on the Key columns, which not only have sorting capabilities but also enforce uniqueness constraints.

Proper use of the Sort Key can provide the following benefits:

* **Accelerated Query Performance**: Sort keys help reduce the amount of data that needs to be scanned. For range queries or filtering queries, the sort key can directly locate the data. For queries that require sorting, the sort key can also accelerate the sorting process.

* **Data Compression Optimization**: Storing data in an ordered fashion based on the sort key improves compression efficiency, as similar data will be grouped together, significantly increasing the compression ratio and reducing storage space.

* **Reduced Deduplication Costs**: When using the Unique Key Model, the sort key allows Doris to perform deduplication more efficiently, ensuring data uniqueness.

When selecting a sort key, the following recommendations can be followed:

* The Key columns must come before all Value columns.

* Preferably choose integer types. This is because integer types are much more efficient in computation and lookup than strings.

* For selecting different lengths of integer types, follow the principle of choosing what is sufficient.

* For the length of `VARCHAR` and `STRING` types, follow the principle of choosing enough...

## Table Model Comparison

|           | Duplicate Key Model       | Unique Key Model | Aggregate Key Model |
| --------- | ------------------ | ----------------- | --------------- |
| Key Column Uniqueness | Not Supported, Key columns can be duplicated | Supported | Supported |
| Synchronous Materialized View | Supported | Supported | Supported |
| Asynchronous Materialized View | Supported | Supported | Supported |
| UPDATE Statement | Not Supported | Supported | Not Supported |
| DELETE Statement | Partially Supported | Supported | Not Supported |
| Full Row Update on Import | Not Supported | Supported | Not Supported |
| Partial Column Update on Import | Not Supported | Supported | Partially Supported |
