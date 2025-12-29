---
{
    "title": "Table Type Overview",
    "language": "en",
    "description": "When creating a table in Doris, it is necessary to specify the Table Type to define how data is stored and managed."
}
---

When creating a table in Doris, it is necessary to specify the Table Type to define how data is stored and managed. Doris provides three Table Types: the **Duplicate Key Table**, **Unique Key Table** and **Aggregate Key Table**, which cater to different application scenarios. Each type has corresponding mechanisms for data deduplication, aggregation, and updates. Choosing the appropriate Table Type helps achieve business objectives while ensuring flexibility and efficiency in data processing.

## Table Type Classification

Doris supports three types of Table Types:

* [Duplicate Key Table](./duplicate): Allows the specified Key columns to be duplicated, and Doris's storage layer retains all written data. This type is suitable for situations where all original data records must be preserved.

* [Unique Key Table](./unique): Ensures that each row has a unique Key value, and guarantees that there are no duplicate rows for a given Key column. The Doris storage layer retains only the latest written data for each key, making this type suitable for scenarios that involve data updates.

* [Aggregate Key Table](./aggregate): Allows data to be aggregated based on the Key columns. The Doris storage layer retains aggregated data, reducing storage space and improving query performance. This type is typically used in situations where summary or aggregated information (such as totals or averages) is required.

After creating the table, the properties of the Table Type are confirmed and cannot be modified. Choosing the right type for the business is crucial:

* **Duplicate Key Table** is suitable for ad-hoc queries with any dimensions. Although it cannot leverage the benefits of pre-aggregation, it is not constrained by aggregation tables and can take advantage of the columnar storage (only reading relevant columns without needing to read all key columns).

* **Unique Key Table** is designed for scenarios where a unique key constraint is needed, ensuring the uniqueness of the key. However, it cannot utilize the query benefits brought by pre-aggregations such as ROLLUP.

* **Aggregate Key Table** can greatly reduce the data and computation required for aggregation queries through pre-aggregation, making it ideal for fixed-schema reporting queries. However, this type is not friendly to `count(*)` queries. Also, because the aggregation method for the Value columns is fixed, when performing other types of aggregation queries, semantic correctness must be considered.

* **Update partial columns**, please refer to the documentation for [Partial Column Updates in Unique Key Table](../../data-operate/update/update-of-aggregate-model) and [Partial Column Updates in Aggregate Key Table](../../data-operate/update/update-of-aggregate-model) for relevant usage advice.



## Sort Key

In Doris, data is stored in a columnar format, and a table can be divided into Key columns and Value columns. The Key columns are used for grouping and sorting, while the Value columns are used for aggregation. Key columns can consist of one or more fields, and when creating a table, data is sorted and stored according to the columns of Aggregate Key, Unique Key, and Duplicate Key Tables.

Different Table Types require the specification of Key columns during table creation, each with a different significance: for the Duplicate Key Table, the Key columns represent sorting, without any uniqueness constraints. In the Aggregate Key and Unique Key Tables, aggregation is performed based on the Key columns, which not only have sorting capabilities but also enforce uniqueness constraints.

Proper use of the Sort Key can provide the following benefits:

* **Accelerated Query Performance**: Sort keys help reduce the amount of data that needs to be scanned. For range queries or filtering queries, the sort key can directly locate the data. For queries that require sorting, the sort key can also accelerate the sorting process.

* **Data Compression Optimization**: Storing data in an ordered fashion based on the sort key improves compression efficiency, as similar data will be grouped together, significantly increasing the compression ratio and reducing storage space.

* **Reduced Deduplication Costs**: When using the Unique Key Table, the sort key allows Doris to perform deduplication more efficiently, ensuring data uniqueness.

When selecting a sort key, the following recommendations can be followed:

* The Key columns must come before all Value columns.

* Preferably choose integer types. This is because integer types are much more efficient in computation and lookup than strings.

* For selecting different lengths of integer types, follow the principle of choosing what is sufficient.

* For the length of `VARCHAR` and `STRING` types, follow the principle of choosing enough...

## Table Type Comparison

|           | Duplicate Key Table       | Unique Key Table | Aggregate Key Table |
| --------- | ------------------ | ----------------- | --------------- |
| Key Column Uniqueness | Not Supported, Key columns can be duplicated | Supported | Supported |
| Synchronous Materialized View | Supported | Supported | Supported |
| Asynchronous Materialized View | Supported | Supported | Supported |
| UPDATE Statement | Not Supported | Supported | Not Supported |
| DELETE Statement | Partially Supported | Supported | Not Supported |
| Full Row Update on Import | Not Supported | Supported | Not Supported |
| Partial Column Update on Import | Not Supported | Supported | Partially Supported |
