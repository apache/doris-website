---
{
    "title": "Spill Disk",
    "language": "en",
    "description": "Doris's computing layer adopts an MPP (Massively Parallel Processing) architecture,"
}
---

## 概述
Doris's computing layer adopts an MPP (Massively Parallel Processing) architecture, where all computing tasks are completed in the memory of BEs (Backends), and data exchange between BEs is also conducted through memory. Therefore, memory management plays a crucial role in ensuring the stability of queries. According to online query statistics, a significant portion of query errors are related to memory issues. As more and more users migrate tasks such as ETL data processing, multi-table materialized view processing, and complex AdHoc queries to Doris, it is necessary to offload intermediate operation results to disk to enable the execution of queries that require more memory than each query or each node can handle. Specifically, when processing large datasets or executing complex queries, memory consumption can increase rapidly, exceeding the memory limits of a single node or the entire query processing process. Doris alleviates memory pressure by writing intermediate results (such as intermediate states of aggregation, temporary data for sorting, etc.) to disk rather than relying solely on memory to store these data. This approach offers several benefits:
- Scalability: Allows Doris to handle datasets much larger than the memory limit of a single node.
- Stability: Reduces the risk of query failures or system crashes due to insufficient memory.
- Flexibility: Enables users to execute more complex queries without increasing hardware resources.

To avoid triggering OOM (Out of Memory) when requesting memory, Doris has introduced a reserve memory mechanism. The workflow of this mechanism is as follows:
- During execution, Doris estimates the memory size required to process each block and then requests it from a unified memory manager.
- The global memory allocator determines whether the current memory request exceeds the memory limit of the query or the entire process. If it does, the request fails.
- When Doris receives a failure message, it suspends the current query, selects the largest operator for spilling to disk, and resumes query execution after spilling is complete.

Currently, the operators that support spilling include:
- Hash Join operator
- Aggregation operator
- Sort operator
- CTE

When a query triggers spilling, additional disk read/write operations may significantly increase query time. It is recommended to increase the FE Session variable query_timeout. Additionally, spilling can generate significant disk I/O, so it is advisable to configure a separate disk directory or use SSD disks to reduce the impact of query spilling on normal data ingestion or queries. The query spilling feature is currently disabled by default.

## Memory Management Mechanism

### BE Process Memory Configuration
The memory of the entire BE process is controlled by the mem_limit parameter in be.conf. Once Doris's memory usage exceeds this threshold, Doris cancels the current query that is requesting memory. Additionally, a background task asynchronously kills some queries to release memory or cache. Therefore, Doris's internal management operations (such as spilling to disk, flushing memtable, etc.) need to run when approaching this threshold to avoid reaching it. Once the threshold is reached, to prevent the entire process from experiencing OOM, Doris takes some drastic self-protection measures.
When Doris's BE is collocated with other processes (such as Doris FE, Kafka, HDFS), the actual available memory for Doris BE may be significantly less than the user-set mem_limit, causing the internal memory release mechanism to fail and potentially leading to the Doris process being killed by the operating system's OOM Killer.
When the Doris process is deployed in K8S or managed by Cgroup, Doris automatically senses the memory configuration of the container.

### Workload Group Memory Configuration

- MAX_MEMORY_PERCENT means that when requests are running in the group, their memory usage will never exceed this percentage of the total memory. Once exceeded, the query will either trigger disk spilling or be killed.
- MIN_MEMORY_PERCENT sets the minimum memory value for a group. When resources are idle, memory exceeding MIN_MEMORY_PERCENT can be used. However, when memory is insufficient, the system will allocate memory according to MIN_MEMORY_PERCENT (minimum memory percentage). It may select some queries to kill, reducing the memory usage of the Workload Group to MIN_MEMORY_PERCENT to ensure that other Workload Groups have sufficient memory available.
- The sum of MIN_MEMORY_PERCENT across all Workload Groups must not exceed 100%, and MIN_MEMORY_PERCENT cannot be greater than MAX_MEMORY_PERCENT.
- low watermark: Default is 75%.
- high watermark: Default is 90%.

## Query Memory Management
### Static Memory Allocation
The memory used by a query is controlled by the following two parameters:
- exec_mem_limit, representing the maximum memory that a query can use, with a default value of 2GB.

### Slot-Based Memory Allocation
In practice, we found that with static memory allocation, users often do not know how much memory to allocate to a query. Therefore, exec_mem_limit is frequently set to half of the entire BE process memory, meaning that the memory used by all queries within the BE cannot exceed half of the process memory. In this scenario, this feature effectively becomes a kind of fuse. When we need to implement more granular policy control based on memory size, such as spilling to disk, this value is too large to rely on for control.
Therefore, we have implemented a new slot-based memory limitation method based on workload groups. The principle of this strategy is as follows:
- Each workload group is configured with two parameters by the user: memory_limit and max_concurrency. It is assumed that the memory of the entire BE is divided into max_concurrency slots, with each slot occupying memory_limit / max_concurrency of memory.
- By default, each query occupies one slot during execution. If the user wants a query to use more memory, they need to modify the query_slot_count value.
- Since the total number of slots in a workload group is fixed, increasing query_slot_count means each query occupies more slots, dynamically reducing the number of queries that can run concurrently in the workload group, causing new queries to automatically queue.

The slot_memory_policy for workload groups can have three optional values:
- disabled, the default value, indicating that it is not enabled and the static memory allocation method is used.
- fixed, where the memory that each query can use is calculated as workload group's mem_limit * query_slot_count / max_concurrency.
- dynamic, where the memory that each query can use is calculated as workload group's mem_limit * query_slot_count / sum(running query slots). This mainly overcomes the issue of unused slots in fixed mode. Both fixed and dynamic set hard limits for queries. Once exceeded, spilling to disk or query killing will occur, and these will override the static memory allocation parameters set by the user. Therefore, when setting slot_memory_policy, it is essential to properly configure max_concurrency for the workload group to avoid memory insufficiency issues.

## Spilling
### Enabling Query Intermediate Result Spilling
#### BE Configuration Items
```
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```
- spill_storage_root_path: The storage path for query intermediate result spilling files, which defaults to the same as storage_root_path.
- spill_storage_limit: The disk space limit for spilling files. It can be configured with a specific space size (e.g., 100GB, 1TB) or a percentage, with a default of 20%. If spill_storage_root_path is configured with a separate disk, it can be set to 100%. This parameter primarily prevents spilling from occupying too much disk space, impeding normal data storage. After modifying the configuration items, you need to restart BE for them to take effect.

#### FE Session Variable
```
set enable_spill=true;
set exec_mem_limit = 10g
```
- enable_spill, indicates whether spilling is enabled for a query.
- exec_mem_limit, represents the maximum memory size used by a query.

#### Workload Group
The default max_memory_percent for workload groups is 100%, which can be adjusted based on the actual number of workload groups. If there is only one workload group, it can be adjusted to 90%.
```
alter workload group normal properties ( 'max_memory_percent'='90%' );
```

### Monitoring Spilling
#### Audit Logs
The FE audit log has added the SpillWriteBytesToLocalStorage and SpillReadBytesFromLocalStorage fields, representing the total amount of data written to and read from local storage during spilling, respectively.
```
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```

#### Profile
If spilling is triggered during a query, some Spill-prefixed counters are added to the Query Profile to mark and count spilling-related activities. Taking HashJoin's Build Hash Table as an example, you can see the following counters:

```
PARTITIONED_HASH_JOIN_SINK_OPERATOR  (id=4  ,  nereids_id=179):(ExecTime:  6sec351ms)
      -  Spilled:  true
      -  CloseTime:  528ns
      -  ExecTime:  6sec351ms
      -  InitTime:  5.751us
      -  InputRows:  6.001215M  (6001215)
      -  MemoryUsage:  0.00  
      -  MemoryUsagePeak:  554.42  MB
      -  MemoryUsageReserved:  1024.00  KB
      -  OpenTime:  2.267ms
      -  PendingFinishDependency:  0ns
      -  SpillBuildTime:  2sec437ms
      -  SpillInMemRow:  0
      -  SpillMaxRowsOfPartition:  68.569K  (68569)
      -  SpillMinRowsOfPartition:  67.455K  (67455)
      -  SpillPartitionShuffleTime:  836.302ms
      -  SpillPartitionTime:  131.839ms
      -  SpillTotalTime:  5sec563ms
      -  SpillWriteBlockBytes:  714.13  MB
      -  SpillWriteBlockCount:  1.344K  (1344)
      -  SpillWriteFileBytes:  244.40  MB
      -  SpillWriteFileTime:  350.754ms
      -  SpillWriteFileTotalCount:  32
      -  SpillWriteRows:  6.001215M  (6001215)
      -  SpillWriteSerializeBlockTime:  4sec378ms
      -  SpillWriteTaskCount:  417
      -  SpillWriteTaskWaitInQueueCount:  0
      -  SpillWriteTaskWaitInQueueTime:  8.731ms
      -  SpillWriteTime:  5sec549ms
```

#### System Tables
##### backend_active_tasks
The SPILL_WRITE_BYTES_TO_LOCAL_STORAGE and SPILL_READ_BYTES_FROM_LOCAL_STORAGE fields have been added, representing the total amount of data currently being written to and read from local storage for intermediate results during a query.

```
mysql [information_schema]>select * from backend_active_tasks;
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
2 rows in set (0.00 sec)
```

## Testing
### Test Environment
#### Machine Configuration
The test used Alibaba Cloud servers with the following specific configurations:

1FE:
```
16 cores(vCPU) 32 GiB 200 Mbps ecs.c6.4xlarge
```

3BE:
```
16 cores(vCPU) 64 GiB 0 Mbps ecs.g6.4xlarge
```

#### Dataset
The test data used TPC-DS 10TB as input, sourced from Alibaba Cloud DLF, and mounted to Doris using the Catalog method. The SQL statement is as follows:
```
CREATE CATALOG dlf PROPERTIES (
"type"="hms",
"hive.metastore.type" = "dlf",
"dlf.proxy.mode" = "DLF_ONLY",
"dlf.endpoint" = "dlf-vpc.cn-beijing.aliyuncs.com",
"dlf.region" = "cn-beijing",
"dlf.uid" = "217316283625971977",
"dlf.catalog.id" = "emr_dev"
);
```

Reference website: https://doris.apache.org/zh-CN/docs/dev/benchmark/tpcds

### Test Results
The dataset size was 10TB. The ratio of memory to dataset size was 1:52. The overall runtime was 32,000 seconds, and all 99 queries were successfully executed. In the future, we will provide spilling capabilities for more operators (such as window functions, Intersect, etc.) and continue to optimize performance under spilling conditions, reduce disk consumption, and improve query stability.

| Query    | Doris |
| ---------- | ------- |
| query1   | 29092 |
| query2   | 130003 |
| query3   | 96119 |
| query4   | 1199097 |
| query5   | 212719 |
| query6   | 62259 |
| query7   | 209154 |
| query8   | 62433 |
| query9   | 579371 |
| query10  | 54260 |
| query11  | 560169 |
| query12  | 26084 |
| query13  | 228756 |
| query14  | 1137097 |
| query15  | 27509 |
| query16  | 84806 |
| query17  | 288164 |
| query18  | 94770 |
| query19  | 124955 |
| query20  | 30970 |
| query21  | 4333 |
| query22  | 9890 |
| query23  | 1757755 |
| query24  | 399553 |
| query25  | 291474 |
| query26  | 79832 |
| query27  | 175894 |
| query28  | 647497 |
| query29  | 1299597 |
| query30  | 11434 |
| query31  | 106665 |
| query32  | 33481 |
| query33  | 146101 |
| query34  | 84055 |
| query35  | 69885 |
| query36  | 148662 |
| query37  | 21598 |
| query38  | 164746 |
| query39  | 5874 |
| query40  | 51602 |
| query41  | 563 |
| query42  | 93005 |
| query43  | 67769 |
| query44  | 79527 |
| query45  | 26575 |
| query46  | 134991 |
| query47  | 161873 |
| query48  | 153657 |
| query49  | 259387 |
| query50  | 141421 |
| query51  | 158056 |
| query52  | 91392 |
| query53  | 89497 |
| query54  | 124118 |
| query55  | 82584 |
| query56  | 152110 |
| query57  | 83417 |
| query58  | 259580 |
| query59  | 177125 |
| query60  | 161729 |
| query61  | 258058 |
| query62  | 39619 |
| query63  | 91258 |
| query64  | 234882 |
| query65  | 278610 |
| query66  | 90246 |
| query67  | 3939554 |
| query68  | 183648 |
| query69  | 11031 |
| query70  | 137901 |
| query71  | 166454 |
| query72  | 2859001 |
| query73  | 92015 |
| query74  | 336694 |
| query75  | 838989 |
| query76  | 174235 |
| query77  | 174525 |
| query78  | 1956786 |
| query79  | 162259 |
| query80  | 602088 |
| query81  | 16184 |
| query82  | 56292 |
| query83  | 26211 |
| query84  | 11906 |
| query85  | 57739 |
| query86  | 34350 |
| query87  | 173631 |
| query88  | 449003 |
| query89  | 113799 |
| query90  | 30825 |
| query91  | 12239 |
| query92  | 26695 |
| query93  | 275828 |
| query94  | 56464 |
| query95  | 64932 |
| query96  | 48102 |
| query97  | 597371 |
| query98  | 112399 |
| query99  | 64472 |
| Sum      | 28102386 |
