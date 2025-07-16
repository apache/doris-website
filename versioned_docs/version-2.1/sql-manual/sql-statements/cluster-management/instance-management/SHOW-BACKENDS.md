---
{
    "title": "SHOW BACKENDS",
    "language": "en"
}
---

## Description

This statement is used to view the basic status information of BE nodes.

## Syntax

```sql
 SHOW BACKENDS
```

## Return Value

| Column                      | Note                                                                                                                                                                                                                                                           |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| BackendId               | The ID of the current BE.                                                                                                                                                                                                                                      |
| Host                    | The IP address or host name of the current BE.                                                                                                                                                                                                                 |
| HeartbeatPort           | The communication port of the heartbeat service of the current BE.                                                                                                                                                                                             |
| BePort                  | The thrift RPC communication port of the current BE.                                                                                                                                                                                                           |
| HttpPort                | The HTTP communication port of the current BE.                                                                                                                                                                                                                 |
| BrpcPort                | The bRPC communication port of the current BE.                                                                                                                                                                                                                 |
| ArrowFlightSqlPort      | The communication port of the ArrowFlight protocol of the current BE.                                                                                                                                                                                          |
| LastStartTime           | The timestamp when the current BE started.                                                                                                                                                                                                                     |
| LastHeartbeat           | The timestamp of the last successful heartbeat sent by the current BE.                                                                                                                                                                                         |
| Alive                   | Whether the current BE is alive.                                                                                                                                                                                                                               |
| SystemDecommissioned    | When this value is true, it means that the current BE node is in the process of safe decommissioning.                                                                                                                                                          |
| TabletNum               | The number of tablets stored on the current BE.                                                                                                                                                                                                                |
| DataUsedCapacity        | The disk space occupied by the data of the current BE.                                                                                                                                                                                                         |
| TrashUsedCapacity       | The disk space occupied by the data in the trash of the current BE.                                                                                                                                                                                            |
| AvailCapacity           | The available disk space of the current BE.                                                                                                                                                                                                                    |
| TotalCapacity           | The total disk space of the current BE. TotalCapacity = AvailCapacity + TrashUsedCapacity + DataUsedCapacity + Disk space occupied by other non-user data files.                                                                                               |
| UsedPct                 | The percentage of the total used disk space of the current BE.                                                                                                                                                                                                 |
| MaxDiskUsedPct          | The maximum percentage of the used disk space among all disks of the current BE.                                                                                                                                                                               |
| RemoteUsedCapacity      | The disk space occupied by the data uploaded to the remote storage after the hot and cold tiering function is used by the current BE.                                                                                                                          |
| Tag                     | The tag information of the current BE, displayed in JSON format. The name of the current BE resource group is saved.                                                                                                                                           |
| ErrMsg                  | The error message when the heartbeat of the current BE fails.                                                                                                                                                                                                  |
| Version                 | The version information of the current BE.                                                                                                                                                                                                                     |
| Status                  | Some status information of the current BE, displayed in JSON format, including: lastSuccessReportTabletsTime, lastStreamLoadTime, isQueryDisabled, isLoadDisabled, etc. It should be noted that the information saved in different versions may vary slightly. |
| HeartbeatFailureCounter | The number of consecutive failed heartbeats of the current BE. If the number exceeds the `max_backend_heartbeat_failure_tolerance_count` configured by the FE Master (the default value is 1), the `Alive` field will be set to false.                         |
| NodeRole                | The role of the current BE. There are two types: `mix` is the default role, and `computation` means that the current node is only used for federated analysis queries.                                                                                         |

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege  | Object | Notes |
|------------|----|----|
| ADMIN_PRIV |    |    |

## Usage Notes

If further filtering of the query results is required, the table-valued function [backends()](../../../sql-functions/table-valued-functions/backends.md) can be used. SHOW BACKENDS is equivalent to the following statement:
```sql
SELECT * FROM BACKENDS();
```

## Examples

```sql
SHOW BACKENDS;
```

```text
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
| BackendId | Host      | HeartbeatPort | BePort | HttpPort | BrpcPort | ArrowFlightSqlPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | TabletNum | DataUsedCapacity | TrashUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | RemoteUsedCapacity | Tag                      | ErrMsg | Version                     | Status                                                                                                                                   | HeartbeatFailureCounter | NodeRole |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
| 10002     | 127.0.0.1 | 9050          | 9060   | 8040     | 8060     | 10040              | 2025-01-20 02:11:39 | 2025-01-21 11:52:40 | true  | false                | 281       | 9.690 MB         | 0.000             | 10.505 GB     | 71.750 GB     | 85.36 % | 85.36 %        | 0.000              | {"location" : "default"} |        | doris-2.1.7-rc03-443e87e203 | {"lastSuccessReportTabletsTime":"2025-01-21 11:51:59","lastStreamLoadTime":1737460114345,"isQueryDisabled":false,"isLoadDisabled":false} | 0                       | mix      |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-----------------------------+------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+
```
