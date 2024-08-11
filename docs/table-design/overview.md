---
{
    "title": "Overview",
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

## Creating tables

Users can use the [CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md) statement to create a table in Doris. You can also use the [LIKE](./sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-LIKE.md) or [AS](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-AS-SELECT.md) clause to derive the table definition from another table.

## Table name

In Doris, table names are case-sensitive by default. You can configure [lower_case_table_names](../admin-manual/config/fe-config.md)to make them case-insensitive during the initial cluster setup. The default maximum length for table names is 64 bytes, but you can change this by configuring [table_name_length_limit](../admin-manual/config/fe-config.md). It is not recommended to set this value too high. For syntax on creating tables, please refer to [CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md).

## Table property

In the Doris CREATE TABLE statement, you can specify various [table properties](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE.md#properties). Among them, the number of buckets (buckets), storage medium (storage_medium), replication num (replication_num), and hot/cold storage policy (storage_policy) properties apply to the partitions. That is, once a partition is created, it will have its own set of properties. Modifying the table properties will only affect partitions created in the future, and will not apply retroactively to partitions that have already been created. For more information about these properties, please refer to [modifying table properties](../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-PROPERTY.md)


## Notes

1. The data model cannot be changed, so you need to choose an appropriate [data model](../table-design/data-model/overview.md) when creating the table.

2. The number of buckets for an existing partition cannot be modified. You can change the number of buckets by [replacing the partition](../data-operate/delete/table-temp-partition.md). However, you can modify the number of buckets for partitions that have not yet been created under dynamic partitioning.

3. Adding or removing VALUE columns is a lightweight operation and can be completed in seconds. Adding or removing KEY columns or modifying data types is a heavyweight operation, and the completion time depends on the amount of data. It is best to avoid adding or removing KEY columns or modifying data types with large amounts of data.

4. You can use tiered storage to save cold data to HDD or S3 / HDFS.