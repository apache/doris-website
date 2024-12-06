---
{
    "title": "Deleting Data with TRUNCATE Command",
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

# Truncate

This statement is used to clear the data of a specified table or partition in Doris.

## Syntax

```sql
TRUNCATE TABLE [db.]tbl[ PARTITION(p1, p2, ...)];
```

- This statement only clears the data within a table or partition but preserves the table or partition itself.
- Unlike DELETE, this statement can only clear the specified table or partition as a whole and cannot be added with filter conditions.
- Unlike DELETE, truncating data will not affect query performance.
- The data deleted by this operation can't be recovered from the recycle bin.
- When using this command, the table status must be NORMAL, which means that tables undergoing SCHEMA CHANGE cannot be truncated.
- This command may cause ongoing imports to fail.

## Example

1. Truncate the table `tbl` under `example_db`.

```sql
TRUNCATE TABLE example_db.tbl;
```

2. Truncate partitions `p1` and `p2` of table `tbl`.

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

