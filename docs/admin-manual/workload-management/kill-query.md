---
{
    "title": "Terminating Queries and Disconnecting Sessions: KILL Command Guide",
    "sidebar_label": "Terminate Queries and Disconnect Sessions",
    "language": "en",
    "description": "Use the KILL command to cancel running queries or disconnect sessions. Locate target queries by Query ID, Connection ID, or Trace ID.",
    "keywords": ["kill query", "terminate query", "cancel query", "disconnect session", "kill connection", "Query ID", "Trace ID", "processlist"]
}
---

<!-- Knowledge Type: Operation Guide -->

The `KILL` command cancels a running query or disconnects a specified session. Before using it, obtain the identifier of the target query (Query ID, Connection ID, or Trace ID), then execute the corresponding KILL statement.

## Obtain Query Identifiers

<!-- Knowledge Type: Concept Definition -->

The KILL command supports the following three query identifiers:

| Identifier Type | Description | How to Obtain |
|---|---|---|
| Query ID | A unique identifier that the system automatically generates for each query | `SHOW PROCESSLIST` or `information_schema.processlist` |
| Connection ID | A unique identifier of a session connection | `SHOW PROCESSLIST` or `information_schema.processlist` |
| Trace ID | A user-defined query identifier (supported from 2.1.11 / 3.0.7) | Set through the `session_context` variable |

### View Through PROCESSLIST

<!-- Knowledge Type: Operation Steps -->

`SHOW PROCESSLIST` displays all current session connections and the queries they are running, including Query ID and Connection ID.

```sql
SHOW PROCESSLIST;
```

Example output:

```
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| CurrentConnected | Id   | User | Host                | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                          | Info             | FE            | CloudCluster |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| No               |    2 | root | 172.20.32.136:54850 | 2025-05-11 10:41:52 | internal |      | Query   |    6 | OK    | 12ccf7f95c1c4d2c-b03fa9c652757c15| select sleep(20) | 172.20.32.152 | NULL         |
| Yes              |    3 | root | 172.20.32.136:54862 | 2025-05-11 10:41:55 | internal |      | Query   |    0 | OK    | b710ed990d4144ee-8b15bb53002b7710| show processlist | 172.20.32.152 | NULL         |
| No               |    1 | root | 172.20.32.136:47964 | 2025-05-11 10:41:54 | internal |      | Sleep   |   11 | EOF   | b60daa992bac4fe4-b29466aacce67d27|                  | 172.20.32.153 | NULL         |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
```

Key field descriptions:

- `CurrentConnected`: `Yes` indicates the connection that corresponds to the current session.
- `Id`: Connection ID, the unique identifier of the connection.
- `QueryId`: Query ID, the unique identifier of the most recently executed or currently running SQL.

**Default behavior**: `SHOW PROCESSLIST` only displays sessions on the FE node that the current connection is attached to, and does not include other FE nodes. To view sessions on all FE nodes, set the following variable before running the query:

```sql
SET show_all_fe_connection = true;
SHOW PROCESSLIST;
```

You can also use the `information_schema` system table, which displays sessions on all FE nodes by default and requires no additional setup:

```sql
SELECT * FROM information_schema.processlist;
```

### Identify Queries by Trace ID

<!-- Knowledge Type: Operation Steps -->

> This feature is supported from versions 2.1.11 and 3.0.7.

A Trace ID is a custom identifier that you assign to a query in advance. It lets a management tool record the unique identifier of a query before submission, so the query can be canceled at any time by Trace ID afterward.

Set the Trace ID for the current session as follows:

```sql
SET session_context = "trace_id:your_trace_id";
```

- `your_trace_id`: A custom string that must not contain the `;` character. A UUID is recommended to ensure uniqueness.
- The Trace ID is a session-level parameter and only applies to the current session. Once set, all subsequent queries in this session map to this Trace ID.

You can also set it through a Hint on a single query statement, without modifying the session variable:

```sql
SELECT /*+SET_VAR(session_context=trace_id:your_trace_id)*/ * FROM table ...;
```

## Execute the KILL Operation

<!-- Knowledge Type: Operation Steps -->

**Permission notes**: Regular users can only terminate queries that they submitted themselves. ADMIN users can terminate queries of any user.

### Kill a Query

`KILL QUERY` cancels a specified running query without disconnecting the session.

```sql
KILL QUERY "query_id" | "trace_id" | connection_id;
```

Comparison of the three forms:

| Parameter Type | Example | Scope |
|---|---|---|
| `"query_id"` | `KILL QUERY "d36417cc05ff41ab-9d3afe49be251055";` | Searches all FE nodes and cancels the matching query |
| `"trace_id"` | `KILL QUERY "your_trace_id";` | Searches all FE nodes and cancels the matching query |
| `connection_id` | `KILL QUERY 55;` | Only cancels the query running on this connection, on the FE node that the current connection is attached to |

Notes:

- Query ID and Trace ID must be enclosed in quotation marks. Connection ID must be an integer greater than 0 and must not be enclosed in quotation marks.
- `KILL QUERY` by Connection ID only takes effect on the FE node that the current connection is attached to.

### Kill a Connection

`KILL CONNECTION` disconnects a specified session and also cancels the query running on that connection.

```sql
KILL [CONNECTION] connection_id;
```

The `CONNECTION` keyword can be omitted. The following two forms are equivalent:

```sql
KILL CONNECTION 55;
KILL 55;
```

Note: Connection IDs on different FE nodes may collide. This operation only takes effect on the FE node that the current connection is attached to.

## Best Practice: Manage Queries by Trace ID

<!-- Knowledge Type: Best Practice -->

In a management system or business platform, using Trace IDs is recommended for marking queries in advance and canceling them precisely. The workflow is:

1. **Before submitting the query**, generate a unique Trace ID (UUID recommended) and bind it to the query.
2. **While the query is running**, the system can issue a KILL request at any time through the Trace ID.

There are two ways to bind the Trace ID:

- Set the session variable before the query (suitable for single-connection scenarios):

    ```sql
    SET session_context = "trace_id:your_trace_id";
    SELECT * FROM table ...;
    ```

- Embed a Hint in the query statement (suitable for connection-pool reuse scenarios):

    ```sql
    SELECT /*+SET_VAR(session_context=trace_id:your_trace_id)*/ * FROM table ...;
    ```

Once bound, cancel the query at any time with the following command:

```sql
KILL QUERY "your_trace_id";
```
