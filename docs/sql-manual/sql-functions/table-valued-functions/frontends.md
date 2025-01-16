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
frontends()
```

## Access Control Requirements

| Privilege  | Object | Notes |
| :--------- |:-------|:------|
| ALTER_PRIV | global |       |

## Examples
show frontends cluster information
```sql
show frontends();
select * from frontends();
```

```text
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
| Name                                    | Host       | EditLogPort | HttpPort | QueryPort | RpcPort | ArrowFlightSqlPort | Role     | IsMaster | ClusterId | Join | Alive | ReplayedJournalId | LastStartTime       | LastHeartbeat       | IsHelper | ErrMsg | Version                 | CurrentConnected |
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.xx.xx.90 | 9010        | 8030     | 9030      | 9020    | -1               | FOLLOWER | true     | 917153130 | true | true  | 555248            | 2025-01-13 14:11:31 | 2025-01-16 14:27:56 | true     |        | doris-0.0.0--83f899b32b | Yes              |
+-----------------------------------------+------------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-------------------------+------------------+
```

frontends() table schema
```sql
desc function frontends();
```
```
+--------------------+------+------+-------+---------+-------+
| Field              | Type | Null | Key   | Default | Extra |
+--------------------+------+------+-------+---------+-------+
| Name               | text | No   | false | NULL    | NONE  |
| Host               | text | No   | false | NULL    | NONE  |
| EditLogPort        | text | No   | false | NULL    | NONE  |
| HttpPort           | text | No   | false | NULL    | NONE  |
| QueryPort          | text | No   | false | NULL    | NONE  |
| RpcPort            | text | No   | false | NULL    | NONE  |
| ArrowFlightSqlPort | text | No   | false | NULL    | NONE  |
| Role               | text | No   | false | NULL    | NONE  |
| IsMaster           | text | No   | false | NULL    | NONE  |
| ClusterId          | text | No   | false | NULL    | NONE  |
| Join               | text | No   | false | NULL    | NONE  |
| Alive              | text | No   | false | NULL    | NONE  |
| ReplayedJournalId  | text | No   | false | NULL    | NONE  |
| LastStartTime      | text | No   | false | NULL    | NONE  |
| LastHeartbeat      | text | No   | false | NULL    | NONE  |
| IsHelper           | text | No   | false | NULL    | NONE  |
| ErrMsg             | text | No   | false | NULL    | NONE  |
| Version            | text | No   | false | NULL    | NONE  |
| CurrentConnected   | text | No   | false | NULL    | NONE  |
+--------------------+------+------+-------+---------+-------+
```