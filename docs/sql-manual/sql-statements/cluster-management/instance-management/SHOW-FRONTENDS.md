---
{
    "title": "SHOW FRONTENDS",
    "language": "en"
}
---

## Description

This statement is used to view the basic status information of the FE nodes.

## Syntax

```sql
SHOW FRONTENDS
```

## Return Value

| Column                      | Note                                                                                          |
|--------------------|-----------------------------------------------------------------------------------------------|
| Name               | The name of the current FE in Doris. This name is usually a random string prefixed with `fe`. |
| Host               | The IP address or host name of the current FE.                                                |
| EditLogPort        | The bdbje communication port of the current FE.                                               |
| HttpPort           | The http communication port of the current FE.                                                                             |
| QueryPort          | The MySQL protocol communication port of the current FE.                                                                          |
| RpcPort            | The thrift RPC communication port of the current FE.                                                                       |
| ArrowFlightSqlPort | The ArrowFlight protocol communication port of the current FE.                                                                    |
| Role               | The role of the current FE. Possible values are FOLLOWER and OBSERVER.                                                           |
| IsMaster           | Whether the current FE is elected as the Master.                                                                           |
| ClusterId          | The ID of the current Doris cluster, usually a randomly generated number.                                                                  |
| Join               | Used to indicate whether the current FE node has successfully joined the current Doris cluster.                                                                 |
| Alive              | Whether the current FE is alive.                                                                                    |
| ReplayedJournalId  | The ID of the largest metadata log that the current FE has replayed.                                                                         |
| LastStartTime      | The timestamp when the current FE started.                                                                                  |
| LastHeartbeat      | The timestamp of the last successful heartbeat sent by the current FE.                                                                           |
| IsHelper           | Whether the current FE is a helper node in bdbje.                                                                  |
| ErrMsg             | The error message when the heartbeat of the current FE fails.                                                                              |
| Version            | The version information of the current FE.                                                                                   |
| CurrentConnected   | Whether the current client connection is connected to the current FE node.                                                                          |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege  | Object | Notes |
|------------|----|----|
| ADMIN_PRIV |    |    |

## Usage Notes

If you need to further filter the query results, you can use the table-valued function [frontends()](../../../sql-functions/table-valued-functions/frontends.md). SHOW FRONTENDS is equivalent to the following statement:

```sql
SELECT * FROM FRONTENDS();
```

## Examples

```sql
SHOW FRONTENDS
```

```text
+-----------------------------------------+-----------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-----------------------------+------------------+
| Name                                    | Host      | EditLogPort | HttpPort | QueryPort | RpcPort | ArrowFlightSqlPort | Role     | IsMaster | ClusterId | Join | Alive | ReplayedJournalId | LastStartTime       | LastHeartbeat       | IsHelper | ErrMsg | Version                     | CurrentConnected |
+-----------------------------------------+-----------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-----------------------------+------------------+
| fe_65a0c6f0_b31f_42ac_bd20_26d851299f1a | 127.0.0.1 | 9010        | 8030     | 9030      | 9020    | 10030              | FOLLOWER | true     | 840241689 | true | true  | 302891            | 2025-01-20 02:11:39 | 2025-01-21 09:48:36 | true     |        | doris-2.1.7-rc03-443e87e203 | Yes              |
+-----------------------------------------+-----------+-------------+----------+-----------+---------+--------------------+----------+----------+-----------+------+-------+-------------------+---------------------+---------------------+----------+--------+-----------------------------+------------------+
```
