---
{
    "title": "Monitor Running Query Progress and Resource Usage in Real Time",
    "language": "en",
    "description": "Learn how to view the execution progress and resource metrics (CPU, memory, shuffle, spill, and more) of running queries in Apache Doris in real time, using either SQL commands or the REST API.",
    "keywords": ["query monitoring", "running queries", "query progress", "query resources", "SHOW PROC", "current_queries", "Trace ID", "workload management"],
    "sidebar_label": "Query Progress Monitoring"
}
---

<!-- Knowledge type: Concept introduction + Operational steps -->

Apache Doris provides two ways to view running queries and their resource consumption in real time: **SQL commands** (`SHOW PROC`) and the **REST API**. Both methods return task-level execution progress along with key metrics such as scan volume, CPU, memory, shuffle, spill, and cache.

## View Running Queries via SQL Commands

<!-- Knowledge type: Operational steps -->

Use the `SHOW PROC` command to list all currently executing queries together with their real-time statistics.

```sql
SHOW PROC "/current_queries";
```

`SHOW PROC "/current_query_stmts"` returns the same statistics view. Starting with Doris 4.1.1, the two commands share a unified enhanced statistics format.

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

### Field Descriptions

<!-- Knowledge type: Reference table -->

| Field | Description |
|---|---|
| QueryId | Unique identifier of the query |
| ConnectionId | MySQL connection ID |
| Catalog | Name of the catalog the query belongs to, such as `internal` or `hive_test` |
| Database | Database or schema name |
| User | User who submitted the query |
| ExecTime | Elapsed execution time, in milliseconds |
| SqlHash | MD5 hash of the SQL statement, useful for identifying identical queries |
| Statement | Text of the SQL statement (truncated when too long) |
| ScanRows | Total number of rows scanned from the storage layer |
| ScanBytes | Total number of bytes scanned from the storage layer |
| ProcessRows | Number of rows processed by the execution pipeline, reflecting actual operator throughput |
| CpuMs | CPU time consumed, in milliseconds |
| MaxPeakMemoryBytes | Peak memory used during query execution |
| CurrentUsedMemoryBytes | Memory currently held by the query |
| WorkloadGroupId | ID of the workload group the query belongs to |
| ShuffleSendBytes | Total bytes sent during inter-node data shuffle |
| ShuffleSendRows | Total rows sent during inter-node data shuffle |
| ScanBytesFromLocalStorage | Bytes scanned from local disks |
| ScanBytesFromRemoteStorage | Bytes scanned from remote storage (for example, HDFS or S3) |
| SpillWriteBytesToLocalStorage | Bytes spilled to local disks due to memory pressure |
| SpillReadBytesFromLocalStorage | Bytes read back from spilled data on local disks |
| BytesWriteIntoCache | Bytes written into the data cache |
| TotalTasks | Total number of pipeline tasks in the query |
| FinishedTasks | Number of pipeline tasks that have completed |
| Progress | Query execution progress as a percentage, calculated as `FinishedTasks / TotalTasks` |

## View Running Queries via the REST API

<!-- Knowledge type: Operational steps -->

**Purpose**: Retrieve real-time statistics of running queries programmatically.

**Command**:

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/current_queries
```

**Description**: This endpoint returns the same column data as `SHOW PROC` in JSON format, and the field meanings are identical.

### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| is_all_node | Boolean (optional) | When set to `true`, returns running queries on all FE nodes. Defaults to `true`. |

### Example Response

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

## Track Real-Time Progress of a Single Query via Trace ID

<!-- Knowledge type: Operational steps -->

To continuously track the execution progress of a specific query, assign it a Trace ID and then poll the statistics endpoint from a separate session to obtain its real-time status.

**Step 1: Set a Trace ID before executing the query**

```sql
SET session_context="trace_id:my_trace_id";
SELECT ...;
```

**Step 2: Poll the statistics in another session**

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/statistics/my_trace_id
```

**Description**: Call this endpoint periodically to obtain the latest query progress until the query completes.

### Example Response

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
