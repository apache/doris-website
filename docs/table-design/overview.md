---
{
    "title": "Overview",
    "language": "en"
}
---

## Creating tables

Users can use the [CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) statement to create a table in Doris. You can also use the [CREATE TABLE LIKE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#create-table--like) or [CREATE TABLE AS](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#create-table--as-select-also-referred-to-as-ctas) clause to derive the table definition from another table.

## Table name

In Doris, table names are case-sensitive by default. You can configure [lower_case_table_names](../admin-manual/config/fe-config.md)to make them case-insensitive during the initial cluster setup. The default maximum length for table names is 64 bytes, but you can change this by configuring [table_name_length_limit](../admin-manual/config/fe-config.md). It is not recommended to set this value too high. For syntax on creating tables, please refer to [CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE).

## Table property

In Doris, the CREATE TABLE statement can specify [table properties](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE#properties), including:

- **buckets**: Determines the distribution of data within the table.

- **storage_medium**: Controls the storage method for data, such as using HDD, SSD, or remote shared storage.

- **medium_allocation_mode**: Controls how to handle storage medium allocation when the specified medium is unavailable.

- **replication_num**: Controls the number of data replicas to ensure redundancy and reliability.

- **storage_policy**: Controls the migration strategy for cold and hot data separation storage.

These properties apply to partitions, meaning that once a partition is created, it will have its own properties. Modifying table properties will only affect partitions created in the future and will not affect existing partitions. For more information about table properties, refer to [ALTER TABLE PROPERTY](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY).

## Notes

1. **Choose an appropriate data model**: The data model cannot be changed, so you need to select an appropriate [data model](../table-design/data-model/overview.md) when creating the table.

2. **Choose an appropriate number of buckets**: The number of buckets in an already created partition cannot be modified. You can modify the number of buckets by [replacing the partition](../data-operate/delete/table-temp-partition.md), or you can modify the number of buckets for partitions that have not yet been created in dynamic partitions.

3. **Column addition operations**: Adding or removing VALUE columns is a lightweight operation that can be completed in seconds. Adding or removing KEY columns or modifying data types is a heavyweight operation, and the completion time depends on the amount of data. For large datasets, it is recommended to avoid adding or removing KEY columns or modifying data types.

4. **Optimize storage strategy**: You can use tiered storage to store cold data on HDD or S3/HDFS.
