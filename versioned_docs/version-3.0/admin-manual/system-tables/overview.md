---
{
    "title": "Overview",
    "language": "zh-CN"
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

Apache Doris cluster has multiple built-in system databases to store metadata information about the Doris system itself.

### information_schema

All tables under the `information_schema` database are virtual tables and do not have physical entities. These system tables contain metadata about the Doris cluster and all its database objects, including databases, tables, columns, permissions, etc. They also include functional status information like Workload Group, Task, etc.

There is an `information_schema` database under each Catalog, containing metadata only for the corresponding Catalog's databases and tables.

All tables in the `information_schema` database are read-only, and users cannot modify, drop, or create tables in this database.

By default, all users have read permissions for all tables in this database, but the query results will vary based on the user's actual permission. For example, if User A only has permissions for `db1.table1`, querying the `information_schema.tables` table will only return information related to `db1.table1`.

### mysql

All tables under the `mysql` database are virtual tables and do not have physical entities. These system tables contain information such as permissions and are mainly used for MySQL ecosystem compatibility.

There is a `mysql` database under each Catalog, but the content of tables is identical.

All tables in the `mysql` database are read-only, and users cannot modify, delete, or create tables in this database.

### __internal_schema

All tables under the `__internal_schema` database are actual tables in Doris, stored similarly to user-created data tables. When a Doris cluster is created, all system tables under this database are automatically created.

By default, common users have read-only permissions for tables in this database. However, once granted, they can modify, delete, or create tables under this database.
