---
{
    "title": "FRONTENDS",
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

The table function generates the frontends temporary table, which allows you to view the FE node information in the current doris cluster.

## Syntax
```sql
FRONTENDS()
```

## Access Control Requirements

| Privilege  | Object | Notes |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |

## Return Value
| Field                    | Description                                                                                             |
|--------------------------|---------------------------------------------------------------------------------------------------------|
| **Name**                 | The unique name of the frontend node.                                                                   |
| **Host**                 | The IP address or hostname of the frontend node.                                                        |
| **EditLogPort**          | The port used for edit log communication.                                                               |
| **HttpPort**             | The HTTP port for the frontend node.                                                                    |
| **QueryPort**            | The port used for query execution on the frontend node.                                                 |
| **RpcPort**              | The port used for RPC communication.                                                                    |
| **ArrowFlightSqlPort**   | The Arrow Flight SQL port (used for integration with Apache Arrow for high-performance data transport). |
| **Role**                 | The role of the frontend node (e.g., `FOLLOWER`).                                                       |
| **IsMaster**             | Indicates whether the node is a master node (true/false).                                               |
| **ClusterId**            | The identifier for the cluster to which the frontend node belongs.                                      |
| **Join**                 | Indicates if the frontend node is part of the cluster (true/false).                                     |
| **Alive**                | Indicates if the frontend node is alive (true/false).                                                   |
| **ReplayedJournalId**    | The last journal ID that was replayed by the frontend node.                                             |
| **LastStartTime**        | The timestamp of the last start time of the frontend node.                                              |
| **LastHeartbeat**        | The timestamp for the last heartbeat received from the frontend node.                                   |
| **IsHelper**             | Indicates whether the frontend node is a helper node (true/false).                                      |
| **ErrMsg**               | Any error messages reported by the frontend node.                                                       |
| **Version**              | The version of the frontend node.                                                                       |


## Examples
show frontends cluster information
```sql
select * from frontends();
```

```text
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
| Name                                    | Host       | EditLogPort | HttpPort | QueryPort | RpcPort | ArrowFlightSqlPort | Role     | IsMaster | ClusterId | Join | Alive | ReplayedJournalId | LastStartTime       | LastHeartbeat       | IsHelper | ErrMsg | Version                 | CurrentConnected |
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.xx.xx.90 | 9010        | 8030     | 9030      | 9020    | -1               | FOLLOWER | true     | 917153130 | true | true  | 555248            | 2025-01-13 14:11:31 | 2025-01-16 14:27:56 | true     |        | doris-0.0.0--83f899b32b | Yes              |
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
```