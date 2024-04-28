---
{
    "title": "View",
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

## View

Views (logical views) are stored queries that encapsulate one or multiple SELECT statements. Views dynamically access and compute database data when executed. Views are read-only and can reference any combination of tables and other views.

Views can be used for the following purposes:

- To simplify access or provide secure access by hiding complex SELECT statements from users. For example, you can create a view that displays only the data users need from various tables while hiding sensitive data in those tables.
- To encapsulate details of table structures that may change over time behind a consistent user interface.

Unlike materialized views, logical views are not materialized, which means they do not store data on disk. Therefore, they have the following limitations:

- When the underlying table data changes, Doris does not need to refresh the view data. However, accessing and computing data through views can incur some overhead.
- Views do not support insert, delete, or update operations.

## Creating View

The syntax for creating a logical view is as follows:

```
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt
```

Explanation:

- Views are logical and have no physical storage. All queries on views are equivalent to queries on the corresponding subquery of the view.
- query_stmt is any supported SQL statement.

Example:

- Creating a view named `example_view` in the `example_db` database:

```
CREATE VIEW example_db.example_view (k1, k2, k3, v1)
AS
SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
WHERE k1 = 20160112 GROUP BY k1,k2,k3;
```

- Creating a view with comments:

```
CREATE VIEW example_db.example_view
(
    k1 COMMENT "first key",
    k2 COMMENT "second key",
    k3 COMMENT "third key",
    v1 COMMENT "first value"
)
COMMENT "my first view"
AS
SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
WHERE k1 = 20160112 GROUP BY k1,k2,k3;
```