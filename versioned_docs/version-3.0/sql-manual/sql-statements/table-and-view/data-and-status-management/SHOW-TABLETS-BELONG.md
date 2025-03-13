---
{
    "title": "SHOW TABLETS BELONG",
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

This statement is used to show tablets and information of their belonging table.

## Syntax

```sql
SHOW TABLETS BELONG <tablet_id> [, <tablet_id>]...;
```

## Required Parameters

**1. `<tablet_id>`**

> One or more tablet IDs, separated by commas. Duplicate IDs will be deduplicated in the result.

## Return Value

When using `SHOW TABLETS BELONG <tablet_id> [, <tablet_id>]...`, the following columns are returned:

| Column        | DataType | Note                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | The name of the database that contains the tablet.                     |
| TableName     | String   | The name of the table that contains the tablet.                        |
| TableSize     | String   | The size of the table (e.g., "8.649 KB").                              |
| PartitionNum  | Int      | The number of partitions in the table.                                 |
| BucketNum     | Int      | The number of buckets in the table.                                    |
| ReplicaCount  | Int      | The number of replicas in the table.                                   |
| TabletIds     | Array    | The list of tablet IDs that belong to the table.                       |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |

## Examples

Show information about a specific tablet:

```sql
SHOW TABLETS BELONG 10145;
```

```text
+--------+-----------+-----------+--------------+-----------+--------------+-----------+
| DbName | TableName | TableSize | PartitionNum | BucketNum | ReplicaCount | TabletIds |
+--------+-----------+-----------+--------------+-----------+--------------+-----------+
| test   | sell_user | 8.649 KB  | 1            | 4         | 4            | [10145]   |
+--------+-----------+-----------+--------------+-----------+--------------+-----------+
```

Show information about multiple tablets:

```sql
SHOW TABLETS BELONG 27028,78880,78382,27028;
```

```text
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
| DbName              | TableName | TableSize | PartitionNum | BucketNum | ReplicaCount | TabletIds      |
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
| default_cluster:db1 | kec       | 613.000 B | 379          | 604       | 604          | [78880, 78382] |
| default_cluster:db1 | test      | 1.874 KB  | 1            | 1         | 1            | [27028]        |
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
```
