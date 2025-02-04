---
{
    "title": "Replacing Atomic Table",
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

Doris supports atomic replacement operations between two tables, applicable only to OLAP tables.

## Applicable Scenarios

Sometimes, users need to rewrite table data, but deleting and then importing the data would result in a period of unavailability. In such cases, users can create a new table with the same structure using the `CREATE TABLE LIKE` statement, import the new data into the new table, and then perform an atomic replacement of the old table. For partition-level atomic overwrite operations, refer to the [temporary partition documentation](../delete/table-temp-partition).

## Syntax

```Plain
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```

Replace table `tbl1` with table `tbl2`.

If the `swap` parameter is `true`, after the replacement, the data in `tbl1` will be the original data in `tbl2`, and the data in `tbl2` will be the original data in `tbl1`, meaning the data in the two tables will be swapped.

If the `swap` parameter is `false`, after the replacement, the data in `tbl1` will be the original data in `tbl2`, and `tbl2` will be deleted.

## Principle

The table replacement function turns the following set of operations into an atomic operation.

Assuming table A is replaced with table B, and `swap` is `true`, the operations are as follows:

1. Rename table B to table A.
2. Rename table A to table B.

If `swap` is `false`, the operations are as follows:

1. Delete table A.
2. Rename table B to table A.

## Notes

- If the `swap` parameter is `false`, the replaced table (table A) will be deleted and cannot be recovered.
- The replacement operation can only occur between two OLAP tables and does not check if the table structures are consistent.
- The replacement operation will not change the original permission settings, as permission checks are based on table names.