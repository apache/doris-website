---
{
    "title": "监控正在运行的查询",
    "language": "zh-CN",
    "description": "查看当前正在运行的查询及其运行时统计信息，包括任务进度和资源指标。",
    "sidebar_label": "查询进度监控"
}
---

Doris 提供了多种方式来查看当前正在运行的查询及其运行时统计信息，包括任务级别的进度和资源指标（如扫描/CPU/内存/Shuffle/溢写/缓存等计数器）。

## SHOW PROC

你可以使用 `SHOW PROC` 命令查看当前正在执行的查询列表及其运行时统计信息。

```sql
SHOW PROC "/current_queries";
```

### 示例输出

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

`SHOW PROC "/current_query_stmts"` 命令也返回相同的统计视图。

**自 Doris 4.1.1 起**，`current_queries` 和 `current_query_stmts` 共享相同增强的统计视图，以统一的格式提供运行时指标和任务进度。

### 列说明

| 列名 | 描述 |
| ------ | ----------- |
| QueryId | 查询的唯一标识符 |
| ConnectionId | MySQL 连接 ID |
| Catalog | Catalog 名称（如 `internal`、`hive_test`） |
| Database | 数据库/模式名称 |
| User | 提交查询的用户 |
| ExecTime | 执行时长，单位毫秒 |
| SqlHash | SQL 语句的 MD5 哈希值 |
| Statement | SQL 语句文本（显示时可能被截断） |
| ScanRows | 从存储层扫描的总行数 |
| ScanBytes | 从存储层扫描的总字节数 |
| ProcessRows | 经执行管道处理的行数。反映经过算子的实际数据量，可用于观察查询吞吐量 |
| CpuMs | CPU 耗时，单位毫秒 |
| MaxPeakMemoryBytes | 查询执行期间达到的内存峰值 |
| CurrentUsedMemoryBytes | 查询当前正在使用的内存 |
| WorkloadGroupId | 该查询所属的工作负载组 ID |
| ShuffleSendBytes | 节点间数据 Shuffle 发送的总字节数 |
| ShuffleSendRows | 节点间数据 Shuffle 发送的总行数 |
| ScanBytesFromLocalStorage | 从本地磁盘存储扫描的字节数 |
| ScanBytesFromRemoteStorage | 从远程存储（如 HDFS、S3）扫描的字节数 |
| SpillWriteBytesToLocalStorage | 因内存压力溢写到本地磁盘的字节数 |
| SpillReadBytesFromLocalStorage | 从本地磁盘溢写数据读回的字节数 |
| BytesWriteIntoCache | 写入数据缓存的字节数 |
| TotalTasks | 该查询的 Pipeline 任务总数 |
| FinishedTasks | 已完成的 Pipeline 任务数 |
| Progress | 查询执行进度百分比，计算公式为 `FinishedTasks / TotalTasks` |

## REST API

你也可以通过 HTTP REST API 获取当前正在运行的查询及其运行时统计信息：

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/current_queries
```

该接口以 JSON 格式返回相同的列数据。

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

### 查询参数

- `is_all_node`：可选。若为 `true` 则返回所有 FE 节点上当前正在运行的查询。默认为 `true`。

## 通过 Trace ID 实时追踪进度

如需实时监控查询进度，可以在执行查询前设置 Trace ID，随后轮询统计信息接口：

```sql
SET session_context="trace_id:my_trace_id";
SELECT ...;
```

然后通过另一个会话查询统计信息：

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/statistics/my_trace_id
```

返回结果包含任务进度和资源使用情况：

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

你可以定期调用此接口以实时追踪查询的进度。
