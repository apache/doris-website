---
{
    "title": "Spill Query Intermediate Results to Disk",
    "sidebar_label": "Spill Intermediate Results to Disk",
    "language": "en",
    "description": "When large queries or ETL tasks run out of memory, Doris can spill intermediate results to disk so execution continues without OOM errors. This article explains how spilling works, how to configure it, and how to monitor it.",
    "keywords": ["spill", "spill disk", "large query out of memory", "OOM", "memory management", "workload group", "query stability"]
}
---

<!-- Knowledge type: concept introduction + procedure -->

## Why spilling is needed

The Doris compute layer is based on an MPP architecture. All compute tasks run in BE memory, and data exchange between nodes also relies on memory, so memory management directly affects query stability. As more users migrate **ETL data processing, multi-table materialized view processing, and complex ad-hoc queries** to Doris, a single node often cannot hold all intermediate state in memory.

**Spilling** (spill to disk) writes intermediate state such as aggregation state and sort temporary data to disk, allowing memory-constrained queries to continue executing. It brings three benefits:

| Benefit | Description |
|------|------|
| Scalability | Handles datasets that exceed a single node's memory limit |
| Stability | Reduces query errors or process crashes caused by out-of-memory conditions |
| Flexibility | Runs more complex queries without adding hardware |

Operators that currently support spilling: Hash Join, Aggregation, Sort, and CTE.

:::caution Note
Spilling adds disk I/O, and query latency may increase significantly. Increase the session variable `query_timeout` accordingly, and mount a dedicated disk or use SSDs for the spill directory to reduce the impact on normal load and query workloads.

**Query spilling is disabled by default.**
:::

## How spilling is triggered

Doris uses a **reserve memory** mechanism to control when spilling happens. The flow is as follows:

1. During execution, Doris estimates the memory required to process each Block and requests it from the unified memory manager.
2. The global memory allocator checks whether this request exceeds the memory limit of the Query, Workload Group, or process.
3. When the limit is exceeded, the request fails. Doris suspends the current Query and triggers spilling on its largest operator.
4. After spilling completes, the Query continues to execute.

## Memory management hierarchy

Doris memory management has three levels: **process level -> Workload Group level -> Query level**. Spilling behavior is constrained by all three.

### Process-level memory (BE)

The `mem_limit` parameter in `be.conf` controls the upper memory limit of the entire BE process. When memory usage exceeds this threshold, Doris cancels the Query that is currently requesting memory, and an asynchronous background task kills some Queries or releases caches.

**Two common problem scenarios:**

- **Mixed deployment**: When BE shares a host with FE, Kafka, HDFS, or other processes, the actual available memory may be far smaller than `mem_limit`. The memory release mechanism then fails, and the OS OOM Killer is triggered.
- **Containerized deployment**: In K8s or Cgroup environments, Doris automatically detects the container's memory configuration, so no manual adjustment is needed.

### Workload Group memory

<!-- Knowledge type: parameter reference -->

| Parameter | Description |
|------|------|
| `max_memory_percent` | The maximum percentage of process memory this Workload Group can use. Exceeding it triggers spilling or kills queries. |
| `min_memory_percent` | The minimum percentage of memory guaranteed to this Workload Group. When memory is tight, the system allocates by this value to ensure other groups have enough memory. |
| `memory_low_watermark` | Low watermark of memory usage. Default is 80%. |
| `memory_high_watermark` | High watermark of memory usage. Default is 95%. When this value is exceeded, reserve memory requests fail and spilling is triggered. |

Constraints: the sum of `min_memory_percent` across all Workload Groups must not exceed 100%, and a single group's `min_memory_percent` must not be greater than its `max_memory_percent`.

### Query-level memory

#### Static memory allocation

`exec_mem_limit` is set before a Query runs through a session variable and cannot be modified dynamically during execution.

:::warning Upgrade note
The default value of `exec_mem_limit` was 2 GB before **version 3.1**, and was changed to 100 GB in version 3.1 and later, where it actually takes effect on the BE side. Before upgrading to version 3.1 or later, explicitly set this parameter to `100g` to prevent existing queries from being canceled due to exceeding the limit or from triggering unexpected spilling.
:::

#### Slot-based dynamic memory allocation

Under static allocation, users often cannot accurately estimate the memory a single Query needs and tend to set it too high (such as half of the process memory), which breaks fine-grained control. The Workload Group slot mechanism solves this problem.

**How it works:**

- When a Workload Group has `max_memory_percent` and `max_concurrency` set, BE memory is logically divided into `max_concurrency` slots, and each slot has memory = `max_memory_percent x mem_limit / max_concurrency`.
- By default, each Query takes 1 slot. To use more memory, modify the session variable `query_slot_count`.
- When a Query takes more slots, the number of Queries the Workload Group can run concurrently decreases automatically, and new Queries enter the queue.

**Possible values of `slot_memory_policy`:**

| Value | Description |
|----|------|
| `none` | Default. Not enabled. A Query uses as much memory as possible, and spilling is triggered when the Workload Group limit is reached. |
| `fixed` | Memory per Query = `workload group mem_limit x query_slot_count / max_concurrency`. Fixed allocation by concurrency. |
| `dynamic` | Memory per Query = `workload group mem_limit x query_slot_count / sum(running query slots)`. Idle slot memory is dynamically reallocated to large running queries. |

Both `fixed` and `dynamic` are hard limits. Exceeding them triggers spilling or kills the Query, and they also override the statically allocated `exec_mem_limit`. When setting `slot_memory_policy`, configure `max_concurrency` carefully; otherwise out-of-memory issues may occur.

## Enable query spilling

<!-- Knowledge type: procedure -->

### Step 1: Configure BE spill paths

Add the following configuration to `be.conf`. **The BE must be restarted after the change** for it to take effect:

```properties
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```

| Parameter | Description |
|------|------|
| `spill_storage_root_path` | Storage path for spill files. Defaults to the same value as `storage_root_path`. A dedicated disk path is recommended. |
| `spill_storage_limit` | Maximum disk usage for spill files. Supports an absolute value (such as `100G` or `1T`) or a percentage (default `20%`). If a dedicated disk is used, this can be set to `100%`. |

### Step 2: Configure FE session variables

```sql
SET enable_spill = true;
SET exec_mem_limit = 10g;
SET query_timeout = 3600;
```

| Variable | Description |
|------|------|
| `enable_spill` | Whether to enable spilling. Default is `false`. When enabled, spilling is triggered automatically when memory is tight. |
| `exec_mem_limit` | Maximum memory available to a single Query. |
| `query_timeout` | Spilling increases query latency, so increase the timeout accordingly (in seconds). |

### Step 3: Configure Workload Group (optional)

Adjust `max_memory_percent` to prevent a single Workload Group from exhausting process memory:

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('max_memory_percent'='90%');
```

Enable slot-based dynamic memory allocation so that large queries spill first:

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('slot_memory_policy'='dynamic');
```

## Monitor spilling status

<!-- Knowledge type: monitoring and operations -->

### Audit log

The FE Audit Log adds the following fields to record spill read and write volumes:

```
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```

| Field | Description |
|------|------|
| `SpillWriteBytesToLocalStorage` | Total data written to disk during spilling (bytes). |
| `SpillReadBytesFromLocalStorage` | Total data read from disk during spilling (bytes). |

### Query Profile

After a query triggers spilling, counters prefixed with `Spill` appear in the Profile. Using HashJoin Build HashTable as an example:

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

`Spilled: true` indicates that the operator has triggered spilling.

### System table `backend_active_tasks`

Two new columns are added to `information_schema.backend_active_tasks` to view the spill volume of in-progress queries in real time:

| Column | Description |
|------|------|
| `SPILL_WRITE_BYTES_TO_LOCAL_STORAGE` | Spill data already written to disk by the current query (bytes). |
| `SPILL_READ_BYTES_FROM_LOCAL_STORAGE` | Spill data already read from disk by the current query (bytes). |

```sql
SELECT * FROM information_schema.backend_active_tasks;
```

Sample output:

```
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
```

## Performance reference (TPC-DS 10TB)

<!-- Knowledge type: test data -->

The following data comes from a single-concurrency test on Alibaba Cloud servers, which verifies that spilling allows all 99 TPC-DS queries to finish in an extreme scenario where the ratio of memory to data is about **1:52**.

**Test environment:**

- 1 FE: 16 vCPU cores, 32 GiB memory (ecs.c6.4xlarge)
- 3 BE: 16 vCPU cores, 64 GiB memory (ecs.g6.4xlarge)
- Test data: TPC-DS 10TB, mounted through an Alibaba Cloud DLF Catalog

**Total time: 28,102.386 seconds**

| Query | Time (ms) | Query | Time (ms) | Query | Time (ms) |
|-------|---------|-------|---------|-------|---------|
| query1 | 29092 | query34 | 84055 | query67 | 3939554 |
| query2 | 130003 | query35 | 69885 | query68 | 183648 |
| query3 | 96119 | query36 | 148662 | query69 | 11031 |
| query4 | 1199097 | query37 | 21598 | query70 | 137901 |
| query5 | 212719 | query38 | 164746 | query71 | 166454 |
| query6 | 62259 | query39 | 5874 | query72 | 2859001 |
| query7 | 209154 | query40 | 51602 | query73 | 92015 |
| query8 | 62433 | query41 | 563 | query74 | 336694 |
| query9 | 579371 | query42 | 93005 | query75 | 838989 |
| query10 | 54260 | query43 | 67769 | query76 | 174235 |
| query11 | 560169 | query44 | 79527 | query77 | 174525 |
| query12 | 26084 | query45 | 26575 | query78 | 1956786 |
| query13 | 228756 | query46 | 134991 | query79 | 162259 |
| query14 | 1137097 | query47 | 161873 | query80 | 602088 |
| query15 | 27509 | query48 | 153657 | query81 | 16184 |
| query16 | 84806 | query49 | 259387 | query82 | 56292 |
| query17 | 288164 | query50 | 141421 | query83 | 26211 |
| query18 | 94770 | query51 | 158056 | query84 | 11906 |
| query19 | 124955 | query52 | 91392 | query85 | 57739 |
| query20 | 30970 | query53 | 89497 | query86 | 34350 |
| query21 | 4333 | query54 | 124118 | query87 | 173631 |
| query22 | 9890 | query55 | 82584 | query88 | 449003 |
| query23 | 1757755 | query56 | 152110 | query89 | 113799 |
| query24 | 399553 | query57 | 83417 | query90 | 30825 |
| query25 | 291474 | query58 | 259580 | query91 | 12239 |
| query26 | 79832 | query59 | 177125 | query92 | 26695 |
| query27 | 175894 | query60 | 161729 | query93 | 275828 |
| query28 | 647497 | query61 | 258058 | query94 | 56464 |
| query29 | 1299597 | query62 | 39619 | query95 | 64932 |
| query30 | 11434 | query63 | 91258 | query96 | 48102 |
| query31 | 106665 | query64 | 234882 | query97 | 597371 |
| query32 | 33481 | query65 | 278610 | query98 | 112399 |
| query33 | 146101 | query66 | 90246 | query99 | 64472 |

In the future, spilling support will be extended to more operators (such as Window Function and Intersect), and spill performance will continue to be optimized.
