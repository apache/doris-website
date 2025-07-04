---
{
    "title": "KILL CONNECTION",
    "language": "en"
}
---

## Description

Kill a connection with a specified connection ID. This will also kill the query associated with this connection.

## Syntax

```sql
KILL [ CONNECTION ] <connection_id>
```

## Required Parameters

**<connection_id>**

> The ID of the connection. It can be queried through the SHOW PROCESSLIST statement.

## Access Control Requirements

The user executing this SQL command must be the user who owns the connection or have at least `ADMIN_PRIV` permission.

## Examples

Query `connection_id`:

```sql
show processlist;
```

Result:

```sql
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
| CurrentConnected | Id | User | Host            | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             | FE           | CloudCluster |
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
| Yes              | 16 | root | 127.0.0.1:63746 | 2024-11-04 20:18:07 | internal | test | Query   | 0    | OK    | e4d69a1cce81468d-91c9ae32b17540e9 | show processlist | 172.16.123.1 | NULL         |
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
```

Send KILL command:

```sql
KILL CONNECTION 16;
```
