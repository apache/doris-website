---
{
    "title": "SHOW TABLET DIAGNOSIS",
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

This statement is used to diagnose the specified tablet. The result will display information about the tablet along with any potential issues.


## Syntax

```sql
SHOW TABLET DIAGNOSIS <tablet_id>
```

## Required Parameters

**1. `<tablet_id>`**

The ID of the tablet to be diagnosed.

## Return Value

| Column                           | DataType | Note                                                                                |
|----------------------------------|----------|-------------------------------------------------------------------------------------|
| TabletExist                      | String   | Indicates whether the tablet exists.                                                |
| TabletId                         | String   | The ID of the tablet.                                                               |
| Database                         | String   | The database the tablet belongs to, along with its ID.                              |
| Table                            | String   | The table the tablet belongs to, along with its ID.                                 |
| Partition                        | String   | The partition the tablet belongs to, along with its ID.                             |
| MaterializedIndex                | String   | The materialized index the tablet belongs to, along with its ID.                    |
| Replicas(ReplicaId -> BackendId) | String   | The replicas of the tablet and their respective BE nodes.                           |
| ReplicasNum                      | String   | Indicates whether the number of replicas is correct.                                |
| ReplicaBackendStatus             | String   | Indicates whether the BE node where the replica is located is functioning properly. |
| ReplicaVersionStatus             | String   | Indicates whether the version number of the replica is correct.                     |
| ReplicaStatus                    | String   | Indicates whether the replica status is normal.                                     |
| ReplicaCompactionStatus          | String   | Indicates whether the compaction status of the replica is normal.                   |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                                                            |
|:-----------|:---------|:---------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv | Database | Required to execute administrative operations on the database, including managing tables, partitions, and system-level commands. |

## Examples

```sql
SHOW TABLET DIAGNOSIS 10145;
```

```text
+----------------------------------+------------------+------------+
| Item                             | Info             | Suggestion |
+----------------------------------+------------------+------------+
| TabletExist                      | Yes              |            |
| TabletId                         | 10145            |            |
| Database                         | test: 10103      |            |
| Table                            | sell_user: 10143 |            |
| Partition                        | sell_user: 10142 |            |
| MaterializedIndex                | sell_user: 10144 |            |
| Replicas(ReplicaId -> BackendId) | {"10146":10009}  |            |
| ReplicasNum                      | OK               |            |
| ReplicaBackendStatus             | OK               |            |
| ReplicaVersionStatus             | OK               |            |
| ReplicaStatus                    | OK               |            |
| ReplicaCompactionStatus          | OK               |            |
+----------------------------------+------------------+------------+
```