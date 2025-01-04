---
{
    "title": "Recover from Recycle Bin",
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

## Data Lifecycle

When a user executes the `DROP DATABASE/TABLE/PARTITION` command without `FORCE`, Doris moves the deleted database, table, or partition to the recycle bin. The `RECOVER` command can be used to restore all data of the deleted database, table, or partition from the recycle bin, making them visible again.

## Recover from Recycle Bin

In order to avoid disasters caused by misoperation, Doris supports data recovery of accidentally deleted databases, tables, and partitions. After dropping a table or database, Doris does not physically delete the data immediately. Instead, it is moved to the trash for a certain period of time (the default is 1 day, which can be configured through the `catalog_trash_expire_second` parameter in `fe.conf`). The administrator can use the `RECOVER` command to restore accidentally deleted data.

**Note:** If the deletion was performed using `DROP FORCE`, the data will be immediately deleted and cannot be recovered.

### Query Recycle Bin

You can query the Recycle Bin with the following command:

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

For more detailed syntax and best practices, please refer to the [SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/Show-Statements/SHOW-CATALOG-RECYCLE-BIN.md) command manual, You can also type `help SHOW CATALOG RECYCLE BIN` on the MySql client command line for more help.


### Start Data Recovery

To recover deleted data, you can use the following commands:

1. *Recover the database* named `example_db`:

```sql
RECOVER DATABASE example_db;
```

2. *Recover the table* named `example_tbl`:

```sql
RECOVER TABLE example_db.example_tbl;
```

3. *Recover partition* named p1 in table example_tbl:

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

For more detailed syntax and best practices used by RECOVER, please refer to the [RECOVER](../../sql-manual/sql-statements/Database-Administration-Statements/RECOVER.md) command manual, You can also type `HELP RECOVER` on the MySql client command line for more help.
