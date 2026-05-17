---
{
    "title": "Monitor Running Queries",
    "language": "en",
    "description": "View currently running queries and their runtime statistics including task progress and resource metrics."
}
---

Doris provides multiple ways to view currently running queries and their runtime statistics, including task-level progress and resource metrics such as scan/cpu/memory/shuffle/spill/cache counters.

## SHOW PROC

You can use the `SHOW PROC` command to view the list of currently executing queries along with their runtime statistics.

```sql
SHOW PROC "/current_queries";
```

### Example Output

```
*************************** 1. row ***************************
                       QueryId: e00b00b1155d4042-98862b60016a768a
                  ConnectionId: 394
                       Catalog: internal
                      Database: wzhtest
                          User: root
                      ExecTime: 20717
                       SqlHash: cf263b08302d8be436c97dd5e6f0d283
                     Statement: INSERT INTO test_query_progress_tb
                                  SELECT DISTINCT k, CONCAT(v, CAST(k AS STRING))
                                  FROM test_query_progress_tb
                                  WHERE k % 2 = 0
                      ScanRows: 45400000 Rows
                     ScanBytes: 2.70 GB
                   ProcessRows: 75598123 Rows
                         CpuMs: 178336
            MaxPeakMemoryBytes: 13.03 GB
        CurrentUsedMemoryBytes: 8.69 GB
               WorkloadGroupId: 1777125330381
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 31.48 MB
    ScanBytesFromRemoteStorage: 0.00
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 74
                 FinishedTasks: 51
                      Progress: 68%
*************************** 2. row ***************************
                       QueryId: e2b8c99658a94743-9ebbf0d036d83295
                  ConnectionId: 9
                       Catalog: hive_test
                      Database: tpch100_parquet
                          User: root
                      ExecTime: 10807
                       SqlHash: f8a30e4182d72cce3eff6cb385005b1f
                     Statement: select ... from supplier, lineitem l1, orders, nation ... limit 100
                      ScanRows: 1102562592 Rows
                     ScanBytes: 9.20 GB
                   ProcessRows: 112176670 Rows
                         CpuMs: 53808
            MaxPeakMemoryBytes: 3.13 GB
        CurrentUsedMemoryBytes: 2.50 GB
               WorkloadGroupId: 1777253545394
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 0.00
    ScanBytesFromRemoteStorage: 9.20 GB
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 138
                 FinishedTasks: 65
                      Progress: 47%
```

The `SHOW PROC "/current_query_stmts"` command also returns the same statistics view.

**Since Doris 4.1.1**, both `current_queries` and `current_query_stmts` share the same enriched statistics view, providing runtime metrics and task progress in a unified format.

### Column Descriptions

| Column | Description |
| ------ | ----------- |
| QueryId | Unique identifier of the query |
| ConnectionId | MySQL connection ID |
| Catalog | Catalog name (e.g., `internal`, `hive_test`) |
| Database | Database/Schema name |
| User | User who submitted the query |
| ExecTime | Execution duration in milliseconds |
| SqlHash | MD5 hash of the SQL statement |
| Statement | SQL statement text (truncated for display) |
| ScanRows | Total rows scanned from storage |
| ScanBytes | Total bytes scanned from storage |
| ProcessRows | Rows processed through the execution pipeline. This reflects the actual data volume passing through operators and can be used to observe query throughput |
| CpuMs | CPU time consumed in milliseconds |
| MaxPeakMemoryBytes | Maximum memory peak reached during query execution |
| CurrentUsedMemoryBytes | Current memory being used by the query |
| WorkloadGroupId | ID of the workload group this query belongs to |
| ShuffleSendBytes | Total bytes sent via data shuffle between nodes |
| ShuffleSendRows | Total rows sent via data shuffle between nodes |
| ScanBytesFromLocalStorage | Bytes scanned from local disk storage |
| ScanBytesFromRemoteStorage | Bytes scanned from remote storage (e.g., HDFS, S3) |
| SpillWriteBytesToLocalStorage | Bytes spilled (written) to local disk due to memory pressure |
| SpillReadBytesFromLocalStorage | Bytes read back from spilled data on local disk |
| BytesWriteIntoCache | Bytes written into data cache |
| TotalTasks | Total number of pipeline tasks for this query |
| FinishedTasks | Number of pipeline tasks that have completed |
| Progress | Query execution progress percentage, computed as `FinishedTasks / TotalTasks` |

## REST API

You can also retrieve current running queries and their runtime statistics through the HTTP REST API:

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/current_queries
```

This endpoint returns data in JSON format with the same set of columns.

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "columnNames": [
            "Frontend", "QueryId", "ConnectionId", "Catalog", "Database",
            "User", "ExecTime", "SqlHash", "Statement",
            "ScanRows", "ScanBytes", "ProcessRows", "CpuMs",
            "MaxPeakMemoryBytes", "CurrentUsedMemoryBytes", "WorkloadGroupId",
            "ShuffleSendBytes", "ShuffleSendRows",
            "ScanBytesFromLocalStorage", "ScanBytesFromRemoteStorage",
            "SpillWriteBytesToLocalStorage", "SpillReadBytesFromLocalStorage",
            "BytesWriteIntoCache",
            "TotalTasks", "FinishedTasks", "Progress"
        ],
        "rows": [
            [
                "172.19.0.3", "108e47ab438a4560-ab1651d16c036491", "2", "internal",
                "testdb", "root", "6074",
                "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)",
                "0", "0.00", "0", "0",
                "0.00", "0.00", "0",
                "0.00", "0",
                "0.00", "0.00",
                "0.00", "0.00",
                "0.00",
                "1", "1", "100%"
            ]
        ]
    },
    "count": 0
}
```

### Query Parameters

- `is_all_node`: Optional. Return current running queries from all FE nodes if set to `true`. Default is `true`.

## Real-Time Progress via Trace ID

For real-time query progress monitoring, you can set a Trace ID before executing a query and subsequently poll the statistics endpoint:

```sql
SET session_context="trace_id:my_trace_id";
SELECT ...;
```

Then query the statistics from another session:

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/statistics/my_trace_id
```

Response includes task progress and resource usage:

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1102562592,
        "scanBytes": 9878424780,
        "returnedRows": 12345,
        "processRows": 112176670,
        "cpuMs": 53808,
        "maxPeakMemoryBytes": 3355443200,
        "currentUsedMemoryBytes": 2684354560,
        "shuffleSendBytes": 0,
        "shuffleSendRows": 0,
        "scanBytesFromLocalStorage": 0,
        "scanBytesFromRemoteStorage": 9878424780,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0,
        "bytesWriteIntoCache": 0,
        "totalTasksNum": 138,
        "finishedTasksNum": 65,
        "progress": "47%"
    },
    "count": 0
}
```

You can periodically call this endpoint to track query progress in real time.
