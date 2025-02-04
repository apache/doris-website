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

Use this statement to clear data from a specified table and its partitions.

## Syntax

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)];
```

- This statement clears the data but retains the table or partition structure.

- Unlike DELETE, TRUNCATE only performs metadata operations, making it faster and not affecting query performance.

- Data removed by this operation cannot be recovered.

- The table status must be NORMAL, and there should be no ongoing SCHEMA CHANGE operations.

- This command may cause ongoing import tasks to fail.

## Examples

**1. Clear the table `tbl` in the `example_db` database**

```sql
TRUNCATE TABLE example_db.tbl;
```

**2. Clear the `p1` and `p2` partitions of the table `tbl`**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```
