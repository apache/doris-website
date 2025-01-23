---
{
    "title": "SHOW PROCESSLIST",
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

Displays the thread that the user is running

## Syntax

```sql
SHOW [FULL] PROCESSLIST
```

## Optional Parameters

**1. `FULL`**

> Indicates whether to view the connection information of other users

## Return Value

| column           | Instructions                                   |
|------------------|--------------------------------------|
| CurrentConnected | Whether the connection is current                              |
| Id               | The unique identification of this thread                            |
| User             | The user who started this thread                            |
| Host             | The IP address and port number of the client sending the request are recorded                |
| LoginTime        | Time to establish a connection                              |
| Catalog          | In which data directory is the command currently executed                    |
| Db               | On which database is the command being executed? If no database is specified, the value is NULL |
| Command          | The command that the thread is executing at this moment                         |
| Time             | Time when the previous command is submitted to the current status, in seconds                 |
| State            | State of thread                                |
| QueryId          | ID of the current query statement                           |
| Info             | Generally, the statement executed by the thread is recorded, and only the first 100 characters are displayed by default         |

Common Command types are as follows:

| column | Instructions |
| -- | -- |
| Query | The thread is executing a statement |
| Sleep | Waiting for the client to send it an execution statement |
| Quit | The thread is exiting |
| Kill | Executing the kill statement |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege    | Object    | Notes                      |
|:-------------|:----------|:---------------------------|
| ADMIN_PRIV        | DATABASE  | If you want to view the connection information of other users, you need the ADMIN permission |

## Examples

```sql
SHOW PROCESSLIST
```

```text
+------------------+------+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+-----------------------+
| CurrentConnected | Id   | User | Host            | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info                  |
+------------------+------+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+-----------------------+
| Yes              |    0 | root | 127.0.0.1:34650 | 2025-01-21 12:01:02 | internal | test | Query   |    0 | OK    | c84e397193a54fe7-bbe9bc219318b75e | select 1              |
|                  |    1 | root | 127.0.0.1:34776 | 2025-01-21 12:01:07 | internal |      | Sleep   |   29 | EOF   | 886ffe2894314f50-8dd73a6ca06699e4 | show full processlist |
+------------------+------+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+-----------------------+
```


