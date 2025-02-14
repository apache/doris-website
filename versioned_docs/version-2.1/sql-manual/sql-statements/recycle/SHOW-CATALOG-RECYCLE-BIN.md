---
{
  "title": "SHOW CATALOG RECYCLE BIN",
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

This statement is used to display the recoverable metadata of databases, tables, or partitions in the recycle bin.

## Syntax

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "<name>" | LIKE "<name_matcher>"] ]
```

## Optional Parameters

Filter by name

**1. `<name>`**
> The name of the database, table, or partition.

Filter by pattern matching

**1. `<name_matcher>`**
> The pattern matching for the name of the database, table, or partition.

## Return Values

| Column         | Type     | Note                                                                                                                                                                             |
|----------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Type           | String   | Metadata type: Database, Table, Partition                                                                                                                                        |
| Name           | String   | Metadata name                                                                                                                                                                    |
| DbId           | Bigint   | ID of the database                                                                                                                                                               |
| TableId        | Bigint   | ID of the table                                                                                                                                                                  |
| PartitionId    | Bigint   | ID of the partition                                                                                                                                                              |
| DropTime       | DateTime | Time when the metadata was moved to the recycle bin                                                                                                                              |
| DataSize       | Bigint   | Data size. If the metadata type is database, this value includes the data size of all tables and partitions in the recycle bin                                                   |
| RemoteDataSize | Decimal  | Data size on remote storage (HDFS or object storage). If the metadata type is database, this value includes the remote data size of all tables and partitions in the recycle bin |

## Access Control Requirements

| Privilege   | Object | Notes |
|-------------|--------|-------|
| ADMIN_PRIV  |        |       |

## Examples

1. Display all metadata in the recycle bin

    ```sql
    SHOW CATALOG RECYCLE BIN;
    ```

2. Display metadata with the name 'test' in the recycle bin

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
    ```

3. Display metadata with names starting with 'test' in the recycle bin

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME LIKE 'test%';
    ```
