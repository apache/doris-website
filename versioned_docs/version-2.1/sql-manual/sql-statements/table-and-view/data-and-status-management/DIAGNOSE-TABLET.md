---
{
    "title": "DIAGNOSE TABLET",
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

In the compute-storage coupled mode, this statement is used to diagnose a specified tablet. The result will display information about the tablet and some potential issues.

This command is not supported in the compute-storage coupled mode.

## Syntax

```sql
SHOW TABLET DIAGNOSIS <tablet_id>;
```

## Required Parameters

<tablet_id>

> The ID of the tablet to be diagnosed

## Return Value (Return Value)

Returns information about the tablet

- TabletExist

  > Whether the tablet exists

- TabletId

    > Tablet ID

- Database

  > The DB and its ID that the tablet belongs to

- Table

  > The Table and its ID that the tablet belongs to

- Partition

  > The Partition and its ID that the tablet belongs to

- MaterializedIndex

  > The materialized view and its ID that the tablet belongs to

- Replicas

  > The replicas of the tablet and their corresponding BEs

- ReplicasNum

  > Whether the number of replicas is correct

- ReplicaBackendStatus

  > Whether the BE nodes where the replicas are located are normal

- ReplicaVersionStatus

  > Whether the version numbers of the replicas are normal

- ReplicaStatus

  > Whether the status of the replicas is normal

- ReplicaCompactionStatus

  > Whether the compaction status of the replicas is normal

## Examples

1. Diagnose the information of the tablet with the specified tablet id 10078

  ```sql
  show tablet diagnosis 10078;
  +----------------------------------+---------------------------------------------+------------+
  | Item                             | Info                                        | Suggestion |
  +----------------------------------+---------------------------------------------+------------+
  | TabletExist                      | Yes                                         |            |
  | TabletId                         | 10078                                       |            |
  | Database                         | __internal_schema: 10005                    |            |
  | Table                            | audit_log: 10058                            |            |
  | Partition                        | p20241109: 10075                            |            |
  | MaterializedIndex                | audit_log: 10059                            |            |
  | Replicas(ReplicaId -> BackendId) | {"10099":10003,"10116":10002,"10079":10004} |            |
  | ReplicasNum                      | OK                                          |            |
  | ReplicaBackendStatus             | OK                                          |            |
  | ReplicaVersionStatus             | OK                                          |            |
  | ReplicaStatus                    | OK                                          |            |
  | ReplicaCompactionStatus          | OK                                          |            |
  +----------------------------------+---------------------------------------------+------------+
  ```

## Access Control Requirements (Access Control Requirements)

The prerequisite for successfully executing this SQL command is to have ADMIN_PRIV privileges. Please refer to the privilege documentation.

| Privilege (Privilege) | Object (Object)                      | Notes (Notes)                   |
| :-------------------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV            | Entire cluster management privileges | All privileges except NODE_PRIV |

## Usage Note (Usage Note)

1. This command is not supported in the storage-computing separation mode. Executing it in this mode will result in an error, for example:

  ```sql
  show tablet diagnosis 15177;
  ```

  The error message is as follows:

  ```Plain
  ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
  ```