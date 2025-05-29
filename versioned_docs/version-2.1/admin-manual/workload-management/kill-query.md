---
{
"title": "Kill Query",
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

You can cancel currently executing operations or disconnect current connection sessions using the `KILL` command. This document introduces related operations and considerations.

## Getting Query Identifiers

`KILL` requires a query identifier to cancel the corresponding query request. Query identifiers include: Query ID, Connection ID, and Trace ID.

You can obtain query identifiers through the following methods.

### PROCESSLIST

Through the `processlist` system table, you can get all current session connections and query operations being executed in the connections. This includes the Query ID and Connection ID.

```sql
mysql> SHOW PROCESSLIST;
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+---------------+--------------+
| CurrentConnected | Id   | User | Host                | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             | FE            | CloudCluster |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+---------------+--------------+
| No               |    2 | root | 172.20.32.136:54850 | 2025-05-11 10:41:52 | internal |      | Query   |    6 | OK    | 12ccf7f95c1c4d2c-b03fa9c652757c15 | select sleep(20) | 172.20.32.152 | NULL         |
| Yes              |    3 | root | 172.20.32.136:54862 | 2025-05-11 10:41:55 | internal |      | Query   |    0 | OK    | b710ed990d4144ee-8b15bb53002b7710 | show processlist | 172.20.32.152 | NULL         |
| No               |    1 | root | 172.20.32.136:47964 | 2025-05-11 10:41:54 | internal |      | Sleep   |   11 | EOF   | b60daa992bac4fe4-b29466aacce67d27 |                  | 172.20.32.153 | NULL         |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+---------------+--------------+
```

- `CurrentConnected`: `Yes` indicates the connection corresponding to the current session.
- `Id`: The unique identifier of the connection, i.e., Connection ID.
- `QueryId`: The unique identifier of the Query. Displays the Query Id of the most recently executed or currently executing SQL command.

Note that by default, `SHOW PROCESSLIST` only displays all session connections on the FE node that the current session is connected to, and does not display session connections from other FE nodes.

If you want to display session connections from all FE nodes, you need to set the following session variable:

```
SET show_all_fe_connection=true;
```

Then execute the `SHOW PROCESSLIST` command again to display session connections from all FE nodes.

You can also view through the system table in `information_schema`:

```
SELECT * FROM information_schema.processlist;
```

By default, `processlist` displays session connections from all FE nodes without requiring additional settings.

### TRACE ID

> This feature is supported since versions 2.1.11 and 3.0.7.

By default, the system automatically generates a Query ID for each query. Users need to first obtain the Query ID through the `processlist` system table before performing a KILL operation.

In addition, users can also customize a Trace ID and perform KILL operations using the Trace ID.

```
SET session_context = "trace_id:your_trace_id";
```

Where `your_trace_id` is the user-defined Trace ID. It can be any string but cannot contain the `;` symbol.

Trace ID is a session-level parameter and only applies to the current session. Doris will map subsequent query requests in the current session to this Trace ID.

## Kill Requests

The `KILL` statement supports canceling specified query operations as well as disconnecting specified session connections.

Regular users can cancel queries sent by their own user through the `KILL` operation. ADMIN users can cancel queries sent by themselves and any other users.

### Kill Query

Syntax:

```sql
KILL QUERY "query_id" | "trace_id" | connection_id;
```

`KILL QUERY` is used to cancel a specified running query operation.

- `"query_id"`

	The Query ID obtained through the `processlist` system table. Must be wrapped in quotes. For example:
	
	`KILL QUERY "d36417cc05ff41ab-9d3afe49be251055";`
	
	This operation will attempt to find the Query ID on all FE nodes and cancel the corresponding query.
	
- `"trace_id"`

	The Trace ID customized through `session_context`. Must be wrapped in quotes. For example:

	`KILL QUERY "your_trace_id";`
	
	This operation will attempt to find the Trace ID on all FE nodes and cancel the corresponding query.

	> This feature is supported since versions 2.1.11 and 3.0.7.

- `connection_id`

	The Connection ID obtained through the `processlist` system table. Must be an integer greater than 0 and cannot be wrapped in quotes. For example:

	`KILL QUERY 55;`
	
	This operation only applies to session connections on the currently connected FE, and will cancel the query currently being executed on the corresponding session connection.

### Kill Connection

Killing a connection will disconnect the specified session connection and also cancel any query operations being executed on the connection.

Syntax:

```sql
KILL [CONNECTION] connection_id;
```

The `CONNECTION` keyword can be omitted.

- `connection_id`

	The Connection ID obtained through the `processlist` system table. Must be an integer greater than 0 and cannot be wrapped in quotes. For example:

	```sql
	KILL CONNECTION 55;
	KILL 55;
	```
	
	Connection IDs on different FEs may be the same, but this operation only affects the session connection on the currently connected FE.

## Best Practices

1. Implementing query management through custom Trace ID

	Custom Trace IDs allow you to specify unique identifiers for queries in advance, making it easier for management system to implement the [Cancel Query] function. You can customize Trace IDs in the following ways:
	
	- Set `session_context` before each query

		Users generate their own Trace ID. It is recommended to use UUID to ensure the uniqueness of the Trace ID.

		```sql
		SET session_context="trace_id:your_trace_id";
		SELECT * FROM table ...;
		```
		
	- Add Trace ID in the query statement

		```sql
		SELECT /*+SET_VAR(session_context=trace_id:your_trace_id)*/ * FROM table ...;
		```
	
	Afterward, management system can cancel running operations at any time using the Trace ID.
