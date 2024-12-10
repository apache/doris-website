---
{
    "title": "ALTER-TABLE-REPLACE",
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

## ALTER-TABLE-REPLACE

### Name

ALTER TABLE REPLACE

### Description

Atomic substitution of two tables. This operation applies only to OLAP tables.

```sql
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')] FORCE?;
```

Replace table tbl1 with table tbl2.

If the `swap` parameter is `true`, the data in the table named `tbl1` will be the data in the original table named `tbl2` after the replacement. The data in the table named `tbl2` is the data in the original `tbl1` table. That is, two tables of data have been swapped.

If the `swap` parameter is `false`, the data in the `tbl1` table will be the data in the `tbl2` table after the replacement. The table named `tbl2` is deleted.

#### Theory

The replace table function actually turns the following set of operations into an atomic operation.

If you want to replace table A with table B and `swap` is `true`, do the following:

1. Rename table B as table A.
2. Rename table A as table B.

If `swap` is `false`, do as follows:

1. Delete table A.
2. Rename table B as table A.

#### Notice
1. The default `swap` parameter is `true`. That is, a table replacement operation is equivalent to an exchange of data between two tables.
2. If the `swap` parameter is set to false, for a period of time, the replaced table (table A) can be recovered through the RECOVER statement. See [RECOVER](../../../../sql-manual/sql-statements/Database-Administration-Statements/RECOVER) statement for details. If you execute command with FORCE, the table will be deleted directly and cannot be recovered, this operation is generally not recommended.
3. The replacement operation can only occur between two OLAP tables and does not check whether the table structure of the two tables is consistent.
4. The original permission Settings are not changed. Because the permission check is based on the table name.

### Example

1. Atomic swap `tbl1` with `tbl2` without dropping any tables(Note: if you delete it, you actually delete tbl1 and rename tbl2 to tbl1.)

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2;
```
or
```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'true');
```

2. Atomic swap `tbl1` with `tbl2` and deleting the `tbl2` table(Keep `tbl1` and the data of the original `tbl2`)

```sql
ALTER TABLE tbl1 REPLACE WITH TABLE tbl2 PROPERTIES('swap' = 'false');
```

This case data in tb1 data will moved to recycle-bin and can be recovered using recover statement.
If you execute command with FORCE, the table data (tb1) will be deleted directly and cannot be recovered, this operation is generally not recommended.

### Keywords

```text
ALTER, TABLE, REPLACE, ALTER TABLE
```

### Best Practice
1. Atomic overlay write operations

  In some cases, the user wants to be able to rewrite the data of a certain table, but if the data is deleted first and then imported, the data cannot be viewed for a period of time in between. At this time, the user can first use the `CREATE TABLE LIKE` statement to create a new table with the same structure, import the new data into the new table, and use the replacement operation to atomically replace the old table to achieve the goal. Atomic overwrite write operations at the partition level, see [temp partition documentation](../../../../advanced/partition/table-temp-partition.md).
