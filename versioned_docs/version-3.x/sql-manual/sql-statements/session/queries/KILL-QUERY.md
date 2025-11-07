---
{
    "title": "KILL QUERY",
    "language": "en"
}
---

## Description

Each Doris connection runs in a separate thread. Use this statement to terminate the thread.

## Syntax

```SQL
KILL [CONNECTION] <processlist_id>
```

## Varaint Syntax

```SQL
KILL QUERY [ { <processlist_id> | <query_id> } ]
```

## Required Parameters

**1. `<processlist_id>`**

> Indicates the ID of the connection thread that needs to be killed

**2. `<query_id>`**

> Indicates the ID of the query to be killed

## Optional Parameters

**1. `CONNECTION`**

> Indicates whether the thread is currently connected

## Usage Notes

- The thread process list identifier can be queried from the Id column output by the SHOW PROCESSLIST

- The Connection ID can be queried from SELECT CONNECTION_ID()

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege    | Object    | Notes                      |
|:--------------|:-----------|:-----------------------|
| GRANT_PRIV         | DATABASE   | GRANT permission is required for the KILL statement |

## Examples

```sql
select connection_id()
```

```text
+-----------------+
| connection_id() |
+-----------------+
| 48              |
+-----------------+
```

```sql
SHOW PROCESSLIST
```

```text
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| CurrentConnected | Id   | User | Host               | LoginTime           | Catalog  | Db      | Command | Time | State | QueryId                           | Info                                                                                  |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| Yes              |   48 | root | 10.16.xx.xx:44834   | 2025-01-21 16:49:47 | internal | test | Query   |    0 | OK    | e6e4ce9567b04859-8eeab8d6b5513e38 | SHOW PROCESSLIST                                                                      |
|                  |   50 | root | 192.168.xx.xx:52837 | 2025-01-21 16:51:34 | internal |      | Sleep   | 1837 | EOF   | deaf13c52b3b4a3b-b25e8254b50ff8cb | SELECT @@session.transaction_isolation                                                |
|                  |   51 | root | 192.168.xx.xx:52843 | 2025-01-21 16:51:35 | internal |      | Sleep   |  907 | EOF   | 437f219addc0404f-9befe7f6acf9a700 | /* ApplicationName=DBeaver Ultimate 23.1.3 - Metadata */ SHOW STATUS                  |
|                  |   55 | root | 192.168.xx.xx:55533 | 2025-01-21 17:09:32 | internal | test | Sleep   |  271 | EOF   | f02603dc163a4da3-beebbb5d1ced760c | /* ApplicationName=DBeaver Ultimate 23.1.3 - SQLEditor <Console> */ SELECT DATABASE() |
|                  |   47 | root | 10.16.xx.xx:35678   | 2025-01-21 16:21:56 | internal | test | Sleep   | 3528 | EOF   | f4944c543dc34a99-b0d0f3986c8f1c98 | select * from test                                                                    |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
```

```sql
kill 51
```