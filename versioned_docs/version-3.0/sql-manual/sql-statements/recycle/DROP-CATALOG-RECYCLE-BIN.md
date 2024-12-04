---
{
    "title": "DROP CATALOG RECYCLE BIN",
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



## Description

This statement is used to delete db/table/partition in catalog recycle bin instantly.

You can get all meta informations that can be deleted by statement `SHOW CATALOG RECYCLE BIN`.

grammar:

1. delete database by DbId

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'DbId' = db_id;
  ```

2. delete table by TableId

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'TableId' = table_id;
  ```

 3. delete partition by PartitionId

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = partition_id;
  ```

illustrate:

- When drop db/table/partition, the catalog recycle bin will delete them after catalog_trash_expire_second(in fe.conf) seconds. This statement will delete them to free disk usage timely.
- `'DbId'`, `'TableId'` and `'PartitionId'` will be case-insensitive and not distinguish between `'` and `''`.
- When drop a database which is not in catalog recycle bin, it will also delete all tables and partitions with same DbId in catalog recycle bin. Only if nothing is deleted, it will report an error. When drop a table which is not in catalog recycle bin, the treatment is similar.

## Example

1. Delete the database(include tables and partitions with same DbId) with id example_db_id

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
  ```

2. Delete the table(include partitions with same TableId) with id example_tbl_id

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
  ```

3. Delete the partition with id p1_id

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
  ```

## Keywords

DROP, CATALOG, RECYCLE, BIN

## Best Practice

