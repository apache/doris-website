---
{
    "title": "Atomicity Replace",
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

# Atomicity Replace

Doris supports atomic table replacement operations for two tables. This is only applicable to OLAP tables.

## Applicable scenarios

- Atomic overwrite operations
- In certain cases, users may want to rewrite data in a table. However, the "delete and load" approach causes a data invisibility window. To solve that, Doris allows users to create a new table of the same schema using the CREATE TABLE LIKE statement, import the new data into this new table, and then atomically replace the old table with the new table. For atomic replacement at the partition level, please refer to the [temporary partition](https://doris.apache.org/docs/2.0/data-operate/delete/table-temp-partition/)documentation.

## Syntax

```Plain
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```

Replace table tbl1 with table tbl2.

If `swap` is `true`, after the replacement, data in `tbl1` will be replaced by that in `tbl2`, while data in `tbl2` will be replaced by that in `tbl1`. In other words, the two tables will swap data.

If `swap` is `false`, after the replacement, data in `tbl1` will be replaced by that in `tbl2` and `tbl2` will be deleted.

## Implementation

In fact, table replacement is to combine the following operations into one atomic operation.

Assuming that table A is to be replaced with table B, and `swap` is set to `true`. The operations to be implemented are as follows:

1. Rename table B to table A.
2. Rename table A to table B.

If `swap` is set to `false`, the operations are as follows:

1. Delete table A.
2. Rename table B to table A.

## Note

- `swap` defaults to `true`, meaning to swap the data between two tables.
- If `swap` is set to `false`, the table being replaced (table A) will be deleted and cannot be recovered.
- The replacement operation can only be implemented between two OLAP tables and it does not check for table schema consistency.
- The replacement operation does not change the existing privilege settings because privilege checks are based on table names.
