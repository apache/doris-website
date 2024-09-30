---
title: Temporary Table
language: en
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

:::note
Supported since Doris version 2.1.8 / 3.0.3
:::

When handling complex data processing, saving intermediate calculation results as physical tables is a great method to significantly reduce SQL complexity and improve data debuggability. However, such tables need to be manually cleaned up after use. Currently, Doris only supports defining non-physical temporary tables through the WITH clause.

To address this issue, Doris introduces the concept of temporary tables. A temporary table is a materialized internal table that exists temporarily and is primarily different from internal tables in that it only exists in the session that created it. Its lifecycle is bound to the current session, and the temporary table will be automatically deleted when the session ends. Moreover, the visibility of a temporary table is restricted to the session in which it was created, meaning it is not visible to another session of the same user at the same time.


:::note

Similar to internal tables, temporary tables must be created under a Database within the Internal Catalog. However, since temporary tables are session-based, their naming is not subject to uniqueness constraints. You can create temporary tables with the same name in different sessions or create temporary tables with the same names as other internal tables.

If a temporary table and a non-temporary table with the same name exist simultaneously in the same Database, the temporary table has the highest access priority. Within that session, all queries and operations on the table with the same name will only affect the temporary table (except for creating materialized views).
:::

## Usage

### Creating a Temporay Table

Tables of various models can be defined as temporary tables, whether they are Unique, Aggregate, or Duplicate models. You can create temporary tables by adding the TEMPORARY keyword in the following SQL statements:
-  [CREATE TABLE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE)
-  [CREATE TABLE AS SELECT](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-AS-SELECT)
-  [CREATE TABLE LIKE](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE-LIKE)

The other uses of temporary tables are basically the same as regular internal tables. Except for the above-mentioned Create statement, other DDL and DML statements do not require adding the TEMPORARY keyword.

## Notes

- Temporary tables can only be created in the Internal Catalog.
- The ENGINE must be set to OLAP when creating a table.
- Alter statements are not supported for modifying temporary tables.
- Due to their temporary nature, creating views and materialized views based on temporary tables is not supported.
- Temporary tables cannot be backed up and are not supported for synchronization using CCR/Sync Job.
- Export, Stream Load, Broker Load, S3 Load, MySQL Load, Routine Load, and Spark Load are not supported.
- When a temporary table is deleted, it does not go to the recycle bin but is permanently deleted immediately.