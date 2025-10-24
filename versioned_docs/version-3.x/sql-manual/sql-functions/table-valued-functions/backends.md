---
{
  "title": "BACKENDS",
  "language": "en"
}
---

## Description

The table function generates the backends temporary table, and you can view the BE node information in the current doris cluster.

## Syntax
```sql
BACKENDS()
```

## Access Control Requirements

| Privilege  | Object | Notes |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |

## Return Value
| Field                       | Description                                                                                                            |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------|
| **BackendId**               | The unique identifier for each backend node.                                                                           |
| **Host**                    | The IP address or hostname of the backend node.                                                                        |
| **HeartbeatPort**           | The port used for health checks (heartbeat).                                                                           |
| **BePort**                  | The port used for communication between the backend node and the cluster for query execution.                          |
| **HttpPort**                | The HTTP port of the backend node.                                                                                     |
| **BrpcPort**                | The port used for BRPC communication.                                                                                  |
| **ArrowFlightSqlPort**      | The Arrow Flight SQL port (used for integration with Apache Arrow for high-performance data transport).                |
| **LastStartTime**           | The timestamp for the last start time of the backend node.                                                             |
| **LastHeartbeat**           | The timestamp for the last heartbeat received from the backend node.                                                   |
| **Alive**                   | Whether the backend node is alive (true/false).                                                                        |
| **SystemDecommissioned**    | Whether the backend node has been decommissioned.                                                                      |
| **TabletNum**               | The number of tablets managed by the backend node.                                                                     |
| **DataUsedCapacity**        | The amount of disk space used by the backend node (in MB).                                                             |
| **TrashUsedCapacity**       | The amount of disk space used by trash (in MB).                                                                        |
| **AvailCapacity**           | The available disk space on the backend node.                                                                          |
| **TotalCapacity**           | The total disk capacity of the backend node.                                                                           |
| **UsedPct**                 | The percentage of disk capacity used by the backend node.                                                              |
| **MaxDiskUsedPct**          | The maximum disk usage percentage across all tablets.                                                                  |
| **RemoteUsedCapacity**      | The disk space used by remote storage (if applicable).                                                                 |
| **Tag**                     | Tags associated with the backend node, typically used for categorization (e.g., location).                             |
| **ErrMsg**                  | Error messages reported by the backend node.                                                                           |
| **Version**                 | The version of the backend node.                                                                                       |
| **Status**                  | The current status of the backend node, including success/failure reports for tablets, load times, and query statuses. |
| **HeartbeatFailureCounter** | The count of heartbeat failures, if any.                                                                               |
| **NodeRole**                | The role of the backend node, such as `mix`, which means the node handles both storage and query processing.           |
| **CpuCores**                | The number of CPU cores on the backend node.                                                                           |
| **Memory**                  | The amount of memory on the backend node.                                                                              |


## Examples
show backends cluster information
```sql
select * from backends();
```

```text
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
| BackendId | Host      | HeartbeatPort | BePort | HttpPort | BrpcPort | ArrowFlightSqlPort | LastStartTime       | LastHeartbeat       | Alive | SystemDecommissioned | TabletNum | DataUsedCapacity | TrashUsedCapacity | AvailCapacity | TotalCapacity | UsedPct | MaxDiskUsedPct | RemoteUsedCapacity | Tag                      | ErrMsg | Version                 | Status                                                                                                                                                                                                                 | HeartbeatFailureCounter | NodeRole | CpuCores | Memory    |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
| 10020     | 10.xx.xx.90 | 9050          | 9060   | 8040     | 8060     | -1               | 2025-01-13 14:11:31 | 2025-01-16 13:24:55 | true  | false                | 359       | 295.328 MB       | 0.000             | 231.236 GB    | 3.437 TB      | 93.43 % | 93.43 %        | 0.000              | {"location" : "default"} |        | doris-0.0.0--83f899b32b | {"lastSuccessReportTabletsTime":"2025-01-16 13:24:07","lastStreamLoadTime":1737004982210,"isQueryDisabled":false,"isLoadDisabled":false,"isActive":true,"currentFragmentNum":0,"lastFragmentUpdateTime":1737004982195} | 0                       | mix      | 96       | 375.81 GB |
+-----------+-----------+---------------+--------+----------+----------+--------------------+---------------------+---------------------+-------+----------------------+-----------+------------------+-------------------+---------------+---------------+---------+----------------+--------------------+--------------------------+--------+-------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------------------+----------+----------+-----------+
```