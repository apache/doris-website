---
{
    "title": "Monitoring Metrics",
    "language": "en",
    "description": "A comprehensive reference of Doris FE and BE monitoring metrics, covering process, JVM, and machine metrics, with P0 priority annotations to support cluster health monitoring and alert configuration."
}
---

# Monitoring Metrics

<!-- Knowledge type: Configuration parameters / Parameter reference -->
<!-- Applicable scenarios: Cluster health monitoring / Alert configuration / Performance troubleshooting -->

Both the FE and BE processes of Doris have built-in monitoring metrics, exposed by default in a Prometheus-compatible format. This document lists all observable metrics systematically and annotates their priority (Priority), so that you can quickly build a monitoring and alerting system after integrating with Prometheus + Grafana.

## Applicable Scenarios

| Scenario | Purpose |
| --- | --- |
| Cluster health monitoring | Quickly detect FE/BE node anomalies through P0 metrics |
| Alert configuration | Configure threshold-based alerts on metrics such as QPS, error rate, and Compaction Score |
| Performance troubleshooting | Locate bottlenecks using query latency, thread pool queueing, and memory usage metrics |
| Capacity planning | Evaluate cluster load using disk usage, tablet count, and connection count |
| Incident review | Analyze the root cause of failures by combining machine metrics (CPU, IO, network) with process metrics |

## Metric Categories

Doris monitoring metrics are divided into two categories by observation target:

1. **Process monitoring**: Shows the runtime metrics of the Doris process itself, such as query count, transaction count, and Compaction status.
2. **Node monitoring**: Shows the resource metrics of the machine on which the Doris process runs, such as CPU, memory, IO, and network.

## Retrieving Monitoring Metrics

### Prometheus-Compatible Format (Default)

Access the HTTP port of an FE or BE node directly:

```shell
curl http://fe_host:http_port/metrics
curl http://be_host:webserver_port/metrics
```

Sample response:

```text
doris_fe_cache_added{type="partition"} 0
doris_fe_cache_added{type="sql"} 0
doris_fe_cache_hit{type="partition"} 0
doris_fe_cache_hit{type="sql"} 0
doris_fe_connection_total 2
```

### JSON Format

Use the `type=json` parameter to retrieve metrics in JSON format:

```shell
curl http://fe_host:http_port/metrics?type=json
curl http://be_host:webserver_port/metrics?type=json
```

## Monitoring Priority and Best Practices

<!-- Knowledge type: Best practices -->

- The last column of each metric table is the priority (Priority). **P0 is the most important**, and the larger the value, the lower the importance. Integrate P0 metrics first.
- The vast majority of monitoring metrics are of type Counter (cumulative value). **You must sample at intervals (for example, every 15 seconds) and calculate the slope per unit time to obtain useful information**.

    For example, by calculating the slope of `doris_fe_query_err`, you can obtain the query error rate (errors per second).

> You are welcome to contribute to this table to provide more comprehensive and useful monitoring metrics.

## FE Monitoring Metrics

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: FE node health monitoring / Metadata sync monitoring / Query performance monitoring -->

### Process Monitoring

| Name | Label | Unit | Meaning | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| `doris_fe_cache_added` | {type="partition"} | Num | Cumulative number of newly added Partition Caches |  |  |
|  | {type="sql"} | Num | Cumulative number of newly added SQL Caches |  |  |
| `doris_fe_cache_hit` | {type="partition"} | Num | Count of Partition Cache hits |  |  |
|  | {type="sql"} | Num | Count of SQL Cache hits |  |  |
| `doris_fe_connection_total` |  | Num | Current number of MySQL port connections on the FE | Used to monitor query connection count. If the connection count exceeds the limit, new connections cannot be accepted | P0 |
| `doris_fe_counter_hit_sql_block_rule` |  | Num | Number of queries blocked by SQL BLOCK RULE |  |  |
| `doris_fe_edit_log_clean` | {type="failed"} | Num | Number of failures when cleaning historical metadata logs | This should not fail. If it does, manual intervention is required | P0 |
|  | {type="success"} | Num | Number of successful historical metadata log cleanups |  |  |
| `doris_fe_edit_log` | {type="accumulated_bytes"} | Bytes | Cumulative value of metadata log write volume | Calculate the slope to obtain the write rate and observe whether metadata writes are delayed | P0 |
|  | {type="current_bytes"} | Bytes | Current value of metadata log | Used to monitor editlog size. If the size exceeds the limit, manual intervention is required | P0 |
|  | {type="read"} | Num | Count of metadata log reads | Observe whether the metadata read frequency is normal via the slope | P0 |
|  | {type="write"} | Num | Count of metadata log writes | Observe whether the metadata write frequency is normal via the slope | P0 |
|  | {type="current"} | Num | Current count of metadata logs | Used to monitor editlog count. If the count exceeds the limit, manual intervention is required | P0 |
| `doris_fe_editlog_write_latency_ms` |  | Milliseconds | Percentile statistics of metadata log write latency. For example, {quantile="0.75"} indicates the 75th-percentile write latency |  |  |
| `doris_fe_image_clean` | {type="failed"} | Num | Number of failures when cleaning historical metadata image files | This should not fail. If it does, manual intervention is required | P0 |
|  | {type="success"} | Num | Number of successful historical metadata image file cleanups |  |  |
| `doris_fe_image_push` | {type="failed"} | Num | Number of failures when pushing metadata image files to other FE nodes |  |  |
|  | {type="success"} | Num | Number of successful pushes of metadata image files to other FE nodes |  |  |
| `doris_fe_image_write` | {type="failed"} | Num | Number of failures when generating metadata image files | This should not fail. If it does, manual intervention is required | P0 |
|  | {type="success"} | Num | Number of successful metadata image file generations |  |  |
| `doris_fe_job` |  | Num | Count of jobs of different types and states. For example, {job="load", type="INSERT", state="LOADING"} indicates the number of INSERT-type load jobs in the LOADING state | Observe the number of jobs of different types in the cluster as needed | P0 |
| `doris_fe_max_journal_id` |  | Num | The maximum metadata log ID on the current FE node. For the Master FE, this is the maximum ID currently written; for a non-Master FE, this is the maximum ID of the metadata logs currently replayed | Used to observe whether the IDs across multiple FEs diverge significantly. A large gap indicates a metadata sync problem | P0 |
| `doris_fe_max_tablet_compaction_score` |  | Num | The maximum Compaction Score value across all BE nodes | Use this value to observe the maximum Compaction Score in the current cluster and determine whether it is too high. A high value may cause query or write latency | P0 |
| `doris_fe_qps` |  | Num/Sec | Queries per second on the current FE (counts query requests only) | QPS | P0 |
| `doris_fe_query_err` |  | Num | Cumulative number of failed queries |  |  |
| `doris_fe_query_err_rate` |  | Num/Sec | Failed queries per second | Observe whether query errors occur in the cluster | P0 |
| `doris_fe_query_latency_ms` |  | Milliseconds | Percentile statistics of query request latency. For example, {quantile="0.75"} indicates the 75th-percentile query latency | Inspect query latency at each percentile in detail | P0 |
| `doris_fe_query_latency_ms_db` |  | Milliseconds | Percentile statistics of query request latency for each DB. For example, {quantile="0.75",db="test"} indicates the 75th-percentile query latency for DB test | Inspect query latency at each percentile per DB in detail | P0 |
| `doris_fe_query_olap_table` |  | Num | Count of query requests against internal tables (OlapTable) |  |  |
| `doris_fe_query_total` |  | Num | Cumulative count of all query requests |  |  |
| `doris_fe_report_queue_size` |  | Num | Length of the queue on the FE side for various periodic report tasks from BE | This value reflects the degree of blocking of report tasks on the Master FE node. The larger the value, the more limited the FE's processing capacity | P0 |
| `doris_fe_request_total` |  | Num | All operation requests (including queries and other statements) received through the MySQL port |  |  |
| `doris_fe_routine_load_error_rows` |  | Num | Total number of error rows across all Routine Load jobs in the cluster |  |  |
| `doris_fe_routine_load_receive_bytes` |  | Bytes | Total volume of data received by all Routine Load jobs in the cluster |  |  |
| `doris_fe_routine_load_rows` |  | Num | Total number of data rows received by all Routine Load jobs in the cluster |  |  |
| `doris_fe_routine_load_get_meta_latency` |  | Milliseconds | Latency of metadata retrieval for all Routine Load Jobs in the cluster |  |  |
| `doris_fe_routine_load_get_meta_count` |  | Num | Number of metadata retrieval operations for all Routine Load Jobs in the cluster |  |  |
| `doris_fe_routine_load_get_meta_fail_count` |  | Num | Number of failed metadata retrievals for all Routine Load Jobs in the cluster |  |  |
| `doris_fe_routine_load_task_execute_time` |  | Milliseconds | Execution time of all Routine Load Tasks in the cluster |  |  |
| `doris_fe_routine_load_task_execute_count` |  | Num | Number of executions of all Routine Load Tasks in the cluster |  |  |
| `doris_fe_routine_load_lag` |  | Milliseconds | Consumption lag of all Routine Load Jobs in the cluster |  |  |
| `doris_fe_routine_load_progress` |  | Milliseconds | Consumption progress of all Routine Load Jobs in the cluster |  |  |
| `doris_fe_routine_load_abort_task_num` |  | Num | Number of failed Tasks across all Routine Load Jobs in the cluster |  |  |
| `doris_fe_rps` |  | Num | Requests per second on the current FE (includes queries and other statement types) | Use together with QPS to see the volume of requests processed by the cluster | P0 |
| `doris_fe_scheduled_tablet_num` |  | Num | Number of tablets being scheduled by the Master FE node, including replicas being repaired and replicas being balanced | This value reflects the number of tablets currently being migrated in the cluster. A non-zero value over a long period indicates an unstable cluster | P0 |
| `doris_fe_tablet_max_compaction_score` |  | Num | Compaction Score reported by each BE node. For example, {backend="172.21.0.1:9556"} indicates the value reported by the BE at "172.21.0.1:9556" |  |  |
| `doris_fe_tablet_num` |  | Num | Total number of tablets on each BE node. For example, {backend="172.21.0.1:9556"} indicates the current tablet count on the BE at "172.21.0.1:9556" | Check whether tablet distribution is uniform and whether the absolute value is reasonable | P0 |
| `doris_fe_tablet_status_count` |  | Num | Cumulative count of tablets scheduled by the Tablet scheduler on the Master FE node |  |  |
|  | {type="added"} | Num | Cumulative count of tablets scheduled by the Tablet scheduler on the Master FE node. "added" indicates the number of tablets that have been scheduled |  |  |
|  | {type="in_sched"} | Num | Same as above. Indicates the number of tablets that have been repeatedly scheduled | If this value grows rapidly, some tablets have been in an unhealthy state for a long time, causing the scheduler to schedule them repeatedly |  |
|  | {type="not_ready"} | Num | Same as above. Indicates the number of tablets that have not yet met the scheduling trigger conditions | If this value grows rapidly, a large number of tablets are unhealthy but cannot be scheduled |  |
|  | {type="total"} | Num | Same as above. Indicates the cumulative number of tablets that have been checked (but not necessarily scheduled) |  |  |
|  | {type="unhealthy"} | Num | Same as above. Indicates the cumulative number of unhealthy tablets that have been checked |  |  |
| `doris_fe_thread_pool` |  | Num | Statistics on the worker threads and queueing of various thread pools. `active_thread_num` indicates the number of tasks currently being executed. `pool_size` indicates the total number of threads in the pool. `task_in_queue` indicates the number of tasks currently queued |  |  |
|  | {name="agent-task-pool"} | Num | Thread pool used by the Master FE to send Agent Tasks to BEs |  |  |
|  | {name="connect-scheduler-check-timer"} | Num | Thread pool used to check whether MySQL idle connections have timed out |  |  |
|  | {name="connect-scheduler-pool"} | Num | Thread pool used to receive MySQL connection requests |  |  |
|  | {name="mysql-nio-pool"} | Num | Thread pool used by the NIO MySQL Server to process tasks |  |  |
|  | {name="export-exporting-job-pool"} | Num | Scheduling thread pool for export jobs in the exporting state |  |  |
|  | {name="export-pending-job-pool"} | Num | Scheduling thread pool for export jobs in the pending state |  |  |
|  | {name="heartbeat-mgr-pool"} | Num | Thread pool used by the Master FE to handle heartbeats from each node |  |  |
|  | {name="loading-load-task-scheduler"} | Num | Scheduling thread pool used by the Master FE to schedule loading tasks in Broker Load jobs |  |  |
|  | {name="pending-load-task-scheduler"} | Num | Scheduling thread pool used by the Master FE to schedule pending tasks in Broker Load jobs |  |  |
|  | {name="schema-change-pool"} | Num | Thread pool used by the Master FE to schedule schema change jobs |  |  |
|  | {name="thrift-server-pool"} | Num | Worker thread pool of the FE-side ThriftServer. Corresponds to `rpc_port` in fe.conf and is used to interact with BEs |  |  |
| `doris_fe_txn_counter` |  | Num | Cumulative count of load transactions in each state | Observe the execution status of load transactions | P0 |
|  | {type="begin"} | Num | Number of committed transactions |  |  |
|  | {type="failed"} | Num | Number of failed transactions |  |  |
|  | {type="reject"} | Num | Number of rejected transactions (for example, when the current number of running transactions exceeds the threshold, new transactions are rejected) |  |  |
|  | {type="succes"} | Num | Number of successful transactions |  |  |
| `doris_fe_txn_status` |  | Num | Number of load transactions currently in each state. For example, {type="committed"} indicates the number of transactions in the committed state | Observe the number of load transactions in each state to determine whether there is a backlog | P0 |
| `doris_fe_query_instance_num` |  | Num | Number of fragment instances currently being requested by a specific user. For example, {user="test_u"} indicates the number of instances currently being requested by user test_u | Use this value to observe whether a specific user is consuming too many query resources | P0 |
| `doris_fe_query_instance_begin` |  | Num | Number of fragment instances for which a specific user has started requests. For example, {user="test_u"} indicates the number of instances for which user test_u has started requests | Use this value to observe whether a specific user has submitted too many queries | P0 |
| `doris_fe_query_rpc_total` |  | Num | Number of RPCs sent to a specific BE. For example, {be="192.168.10.1"} indicates the number of RPCs sent to the BE at IP 192.168.10.1 | Use this value to observe whether too many RPCs have been submitted to a specific BE |  |
| `doris_fe_query_rpc_failed` |  | Num | Number of failed RPCs sent to a specific BE. For example, {be="192.168.10.1"} indicates the number of failed RPCs sent to the BE at IP 192.168.10.1 | Use this value to observe whether a specific BE has RPC issues |  |
| `doris_fe_query_rpc_size` |  | Num | RPC data size for a specific BE. For example, {be="192.168.10.1"} indicates the byte count of RPC data sent to the BE at IP 192.168.10.1 | Use this value to observe whether oversized RPCs have been submitted to a specific BE |  |
| `doris_fe_txn_exec_latency_ms` |  | Milliseconds | Percentile statistics of transaction execution time. For example, {quantile="0.75"} indicates the 75th-percentile transaction execution time | Inspect transaction execution time at each percentile in detail | P0 |
| `doris_fe_txn_publish_latency_ms` |  | Milliseconds | Percentile statistics of transaction publish time. For example, {quantile="0.75"} indicates the 75th-percentile transaction publish time | Inspect transaction publish time at each percentile in detail | P0 |
| `doris_fe_txn_num` |  | Num | Number of transactions currently executing in a specific DB. For example, {db="test"} indicates the number of transactions currently executing in DB test | Use this value to observe whether a specific DB has submitted a large number of transactions | P0 |
| `doris_fe_publish_txn_num` |  | Num | Number of transactions currently being published in a specific DB. For example, {db="test"} indicates the number of transactions currently being published in DB test | Use this value to observe the number of publish transactions in a specific DB | P0 |
| `doris_fe_txn_replica_num` |  | Num | Number of replicas opened by transactions currently executing in a specific DB. For example, {db="test"} indicates the number of replicas opened by transactions currently executing in DB test | Use this value to observe whether a specific DB has opened too many replicas, which may affect the execution of other transactions | P0 |
| `doris_fe_thrift_rpc_total` |  | Num | Number of RPC requests received by each method of the FE thrift interface. For example, {method="report"} indicates the number of RPC requests received by the report method | Use this value to observe the load of a specific thrift rpc method |  |
| `doris_fe_thrift_rpc_latency_ms` |  | Milliseconds | RPC request processing time for each method of the FE thrift interface. For example, {method="report"} indicates the RPC request processing time of the report method | Use this value to observe the load of a specific thrift rpc method |  |
| `doris_fe_external_schema_cache` | {catalog="hive"} | Num | Number of entries in the schema cache for a specific External Catalog |  |  |
| `doris_fe_hive_meta_cache` | {catalog="hive"} | Num |  |  |  |
|  | `{type="partition_value"}` | Num | Number of entries in the partition value cache for a specific External Hive Metastore Catalog |  |  |
|  | `{type="partition"}` | Num | Number of entries in the partition cache for a specific External Hive Metastore Catalog |  |  |
|  | `{type="file"}` | Num | Number of entries in the file cache for a specific External Hive Metastore Catalog |  |  |

### JVM Monitoring

| Name | Label | Unit | Meaning | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| `jvm_heap_size_bytes` |  | Bytes | JVM memory monitoring. The labels include max, used, and committed, corresponding to maximum, used, and committed memory respectively | Observe JVM memory usage | P0 |
| `jvm_non_heap_size_bytes` |  | Bytes | JVM off-heap memory statistics |  |  |
| `<GarbageCollector>` |  |  | GC monitoring | GarbageCollector refers to a specific garbage collector | P0 |
|  | {type="count"} | Num | Cumulative number of GCs |  |  |
|  | {type="time"} | Milliseconds | Cumulative GC time |  |  |
| `jvm_old_size_bytes` |  | Bytes | JVM old generation memory statistics |  | P0 |
| `jvm_thread` |  | Num | JVM thread count statistics | Observe whether the JVM thread count is reasonable | P0 |
| `jvm_young_size_bytes` |  | Bytes | JVM young generation memory statistics |  | P0 |

### Machine Monitoring

| Name | Label | Unit | Meaning | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| `system_meminfo` |  | Bytes | Memory monitoring of the FE node machine. Collected from `/proc/meminfo`. Includes `buffers`, `cached`, `memory_available`, `memory_free`, and `memory_total` |  |  |
| `system_snmp` |  |  | Network monitoring of the FE node machine. Collected from `/proc/net/snmp` |  |  |
|  | `{name="tcp_in_errs"}` | Num | Number of tcp packet receive errors |  |  |
|  | `{name="tcp_in_segs"}` | Num | Number of tcp packets received |  |  |
|  | `{name="tcp_out_segs"}` | Num | Number of tcp packets sent |  |  |
|  | `{name="tcp_retrans_segs"}` | Num | Number of tcp packet retransmissions |  |  |

## BE Monitoring Metrics

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: BE node health monitoring / Query and write performance monitoring / Compaction monitoring -->

### Process Monitoring

| Name | Label | Unit | Meaning | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| `doris_be_active_scan_context_count` |  | Num | Shows the number of scanners currently opened directly by external systems |  |  |
| `doris_be_add_batch_task_queue_size` |  | Num | Records the queue size of the thread pool that receives batches during load | If greater than 0, there is a backlog on the receiving side of load tasks | P0 |
| `agent_task_queue_size` |  | Num | Shows the length of each Agent Task processing queue. For example, `{type="CREATE_TABLE"}` indicates the length of the CREATE_TABLE task queue |  |  |
| `doris_be_brpc_endpoint_stub_count` |  | Num | Number of created brpc stubs used for interaction between BEs |  |  |
| `doris_be_brpc_function_endpoint_stub_count` |  | Num | Number of created brpc stubs used for interaction with Remote RPC |  |  |
| `doris_be_cache_capacity` |  |  | Records the capacity of a specific LRU Cache |  |  |
| `doris_be_cache_usage` |  |  | Records the usage of a specific LRU Cache | Observe memory usage | P0 |
| `doris_be_cache_usage_ratio` |  |  | Records the usage ratio of a specific LRU Cache |  |  |
| `doris_be_cache_lookup_count` |  |  | Records the number of lookups on a specific LRU Cache |  |  |
| `doris_be_cache_hit_count` |  |  | Records the hit count of a specific LRU Cache |  |  |
| `doris_be_cache_hit_ratio` |  |  | Records the hit ratio of a specific LRU Cache | Observe whether the cache is effective | P0 |
|  | {name="DataPageCache"} | Num | DataPageCache caches the Data Page of data | Data cache, directly affects query efficiency | P0 |
|  | {name="IndexPageCache"} | Num | IndexPageCache caches the Index Page of data | Index cache, directly affects query efficiency | P0 |
|  | {name="LastSuccessChannelCache"} | Num | LastSuccessChannelCache caches the LoadChannel on the load receiver side |  |  |
|  | {name="SegmentCache"} | Num | SegmentCache caches opened Segments, such as index information |  |  |
| `doris_be_chunk_pool_local_core_alloc_count` |  | Num | Number of times memory is allocated from the memory queue of the bound core in the ChunkAllocator |  |  |
| `doris_be_chunk_pool_other_core_alloc_count` |  | Num | Number of times memory is allocated from the memory queue of other cores in the ChunkAllocator |  |  |
| `doris_be_chunk_pool_reserved_bytes` |  | Bytes | Size of memory reserved in the ChunkAllocator |  |  |
| `doris_be_chunk_pool_system_alloc_cost_ns` |  | Nanoseconds | Cumulative time spent allocating memory by the SystemAllocator | Observe the time cost of memory allocation via the slope | P0 |
| `doris_be_chunk_pool_system_alloc_count` |  | Num | Number of times the SystemAllocator allocates memory |  |  |
| `doris_be_chunk_pool_system_free_cost_ns` |  | Nanoseconds | Cumulative time spent freeing memory by the SystemAllocator | Observe the time cost of memory release via the slope | P0 |
| `doris_be_chunk_pool_system_free_count` |  | Num | Number of times the SystemAllocator frees memory |  |  |
| `doris_be_compaction_bytes_total` |  | Bytes | Cumulative volume of data processed by Compaction | Records the disk size of input rowsets in Compaction tasks. Observe the Compaction rate via the slope | P0 |
|  | {type="base"} | Bytes | Cumulative data volume of Base Compaction |  |  |
|  | {type="cumulative"} | Bytes | Cumulative data volume of Cumulative Compaction |  |  |
| `doris_be_compaction_deltas_total` |  | Num | Cumulative number of rowsets processed by Compaction | Records the number of input rowsets in Compaction tasks |  |
|  | {type="base"} | Num | Cumulative number of rowsets processed by Base Compaction |  |  |
|  | {type="cumulative"} | Num | Cumulative number of rowsets processed by Cumulative Compaction |  |  |
| `doris_be_disks_compaction_num` |  | Num | Number of Compaction tasks currently running on a specific data directory. For example, `{path="/path1/"}` indicates the number of tasks currently running on the `/path1` directory | Observe whether the number of Compaction tasks on each disk is reasonable | P0 |
| `doris_be_disks_compaction_score` |  | Num | Number of Compaction tokens currently running on a specific data directory. For example, `{path="/path1/"}` indicates the number of tokens currently running on the `/path1` directory |  |  |
| `doris_be_compaction_used_permits` |  | Num | Number of tokens already used by Compaction tasks | Reflects the resource consumption of Compaction |  |
| `doris_be_compaction_waitting_permits` |  | Num | Number of items waiting for Compaction tokens |  |  |
| `doris_be_data_stream_receiver_count` |  | Num | Number of data Receivers on the receiving side | FIXME: This metric is missing in the vectorized engine |  |
| `doris_be_disks_avail_capacity` |  | Bytes | Remaining space on the disk where a specific data directory resides. For example, `{path="/path1/"}` indicates the remaining space on the disk where the `/path1` directory resides |  | P0 |
| `doris_be_disks_local_used_capacity` |  | Bytes | Local used space on the disk where a specific data directory resides |  |  |
| `doris_be_disks_remote_used_capacity` |  | Bytes | Used space of the remote directory corresponding to the disk where a specific data directory resides |  |  |
| `doris_be_disks_state` |  | Boolean | Disk state of a specific data directory. 1 indicates normal, 0 indicates abnormal |  |  |
| `doris_be_disks_total_capacity` |  | Bytes | Total capacity of the disk where a specific data directory resides | Use together with `doris_be_disks_avail_capacity` to calculate disk usage | P0 |
| `doris_be_engine_requests_total` |  | Num | Cumulative count of execution states of various tasks on the BE |  |  |
|  | {status="failed",type="xxx"} | Num | Cumulative number of failures for tasks of type xxx |  |  |
|  | {status="total",type="xxx"} | Num | Cumulative total number of executions for tasks of type xxx | Monitor the failure count of various task types as needed | P0 |
|  | `{status="skip",type="report_all_tablets"}` | Num | Cumulative number of times tasks of type xxx were skipped |  |  |
| `doris_be_fragment_endpoint_count` |  | Num | Same as `doris_be_data_stream_receiver_count` | FIXME: Same count as `doris_be_data_stream_receiver_count`. Also missing in the vectorized engine |  |
| `doris_be_fragment_request_duration_us` |  | Microseconds | Cumulative execution time of all fragment instances | Observe instance execution time via the slope | P0 |
| `doris_be_fragment_requests_total` |  | Num | Cumulative number of fragment instances executed |  |  |
| `doris_be_load_channel_count` |  | Num | Number of load channels currently open | The larger the value, the more load tasks are currently running | P0 |
| `doris_be_local_bytes_read_total` |  | Bytes | Number of bytes read by `LocalFileReader` |  | P0 |
| `doris_be_local_bytes_written_total` |  | Bytes | Number of bytes written by `LocalFileWriter` |  | P0 |
| `doris_be_local_file_reader_total` |  | Num | Cumulative count of opened `LocalFileReader` instances |  |  |
| `doris_be_local_file_open_reading` |  | Num | Number of `LocalFileReader` instances currently open |  |  |
| `doris_be_local_file_writer_total` |  | Num | Cumulative count of opened `LocalFileWriter` instances |  |  |
| `doris_be_mem_consumption` |  | Bytes | Current memory consumption of a specific module. For example, {type="compaction"} indicates the current total memory consumption of the Compaction module | The value is taken from the MemTracker of the same type. FIXME |  |
| `doris_be_memory_allocated_bytes` |  | Bytes | BE process physical memory size, taken from `/proc/self/status/VmRSS` |  | P0 |
| `doris_be_memory_jemalloc` |  | Bytes | Jemalloc stats, taken from `je_mallctl` | For the meaning, see: https://jemalloc.net/jemalloc.3.html | P0 |
| `doris_be_memory_pool_bytes_total` |  | Bytes | Memory size currently occupied by all MemPools. A statistical value that does not represent real memory usage |  |  |
| `doris_be_memtable_flush_duration_us` |  | Microseconds | Cumulative time spent writing memtables to disk | Observe write latency via the slope | P0 |
| `doris_be_memtable_flush_total` |  | Num | Cumulative number of memtables written to disk | Calculate the frequency of file writes via the slope | P0 |
| `doris_be_meta_request_duration` |  | Microseconds | Cumulative time spent accessing meta in RocksDB | Observe the BE metadata read/write latency via the slope | P0 |
|  | {type="read"} | Microseconds | Read time |  |  |
|  | {type="write"} | Microseconds | Write time |  |  |
| `doris_be_meta_request_total` |  | Num | Cumulative number of accesses to meta in RocksDB | Observe the BE metadata access frequency via the slope | P0 |
|  | {type="read"} | Num | Number of reads |  |  |
|  | {type="write"} | Num | Number of writes |  |  |
| `doris_be_fragment_instance_count` |  | Num | Number of fragment instances currently received | Observe whether instances are accumulating | P0 |
| `doris_be_process_fd_num_limit_hard` |  | Num | Hard limit on the number of file handles for the BE process. Collected via `/proc/pid/limits` |  |  |
| `doris_be_process_fd_num_limit_soft` |  | Num | Soft limit on the number of file handles for the BE process. Collected via `/proc/pid/limits` |  |  |
| `doris_be_process_fd_num_used` |  | Num | Number of file handles used by the BE process. Collected via `/proc/pid/limits` |  |  |
| `doris_be_process_thread_num` |  | Num | Number of threads in the BE process. Collected via `/proc/pid/task` |  | P0 |
| `doris_be_query_cache_memory_total_byte` |  | Bytes | Bytes occupied by the Query Cache |  |  |
| `doris_be_query_cache_partition_total_count` |  | Num | Current number of entries in the Partition Cache |  |  |
| `doris_be_query_cache_sql_total_count` |  | Num | Current number of entries in the SQL Cache |  |  |
| `doris_be_query_scan_bytes` |  | Bytes | Cumulative volume of data read. Only counts data read from Olap tables |  |  |
| `doris_be_query_scan_bytes_per_second` |  | Bytes/Sec | Read rate calculated from `doris_be_query_scan_bytes` | Observe query rate | P0 |
| `doris_be_query_scan_rows` |  | Num | Cumulative number of rows read. Only counts data read from Olap tables. This is RawRowsRead (some data rows may be skipped by indexes and not actually read, but are still counted in this value) | Observe query rate via the slope | P0 |
| `doris_be_result_block_queue_count` |  | Num | Number of fragment instances currently in the query result cache | This queue is only used when external systems read directly. For example, Spark on Doris queries data via external scan |  |
| `doris_be_result_buffer_block_count` |  | Num | Number of queries currently in the query result cache | This value reflects how many query results in the current BE are waiting to be consumed by the FE | P0 |
| `doris_be_routine_load_task_count` |  | Num | Number of routine load tasks currently running |  |  |
| `doris_be_rowset_count_generated_and_in_use` |  | Num | Number of newly added rowset IDs in use since the last startup |  |  |
| `doris_be_s3_bytes_read_total` |  | Num | Cumulative number of times `S3FileReader` has been opened |  |  |
| `doris_be_s3_file_open_reading` |  | Num | Number of `S3FileReader` instances currently open |  |  |
| `doris_be_s3_bytes_read_total` |  | Bytes | Cumulative number of bytes read by `S3FileReader` |  |  |
| `doris_be_scanner_thread_pool_queue_size` |  | Num | Current queue size of the thread pool used for OlapScanner | A value greater than zero indicates that Scanners are starting to accumulate | P0 |
| `doris_be_segment_read` | `{type="segment_read_total"}` | Num | Cumulative number of segments read |  |  |
| `doris_be_segment_read` | `{type="segment_row_total"}` | Num | Cumulative number of rows read across segments | This value also includes rows filtered by indexes. It is equivalent to the number of segments read multiplied by the total rows per segment |  |
| `doris_be_send_batch_thread_pool_queue_size` |  | Num | Queue size of the thread pool used to send data packets during load | A value greater than 0 indicates accumulation | P0 |
| `doris_be_send_batch_thread_pool_thread_num` |  | Num | Number of threads in the thread pool used to send data packets during load |  |  |
| `doris_be_small_file_cache_count` |  | Num | Number of small files currently cached on the BE |  |  |
| `doris_be_streaming_load_current_processing` |  | Num | Number of stream load tasks currently running | Only includes tasks sent via the curl command |  |
| `doris_be_streaming_load_duration_ms` |  | Milliseconds | Cumulative execution time of all stream load tasks |  |  |
| `doris_be_streaming_load_requests_total` |  | Num | Cumulative number of stream load tasks | Observe task submission frequency via the slope | P0 |
| `doris_be_stream_load_pipe_count` |  | Num | Current number of stream load data pipes | Includes both stream load and routine load tasks |  |
| `doris_be_stream_load` | {type="load_rows"} | Num | Cumulative number of rows finally loaded by stream load | Includes both stream load and routine load tasks | P0 |
| `doris_be_stream_load` | {type="receive_bytes"} | Bytes | Cumulative number of bytes received by stream load | Includes data received by stream load over HTTP and data read from Kafka by routine load | P0 |
| `doris_be_tablet_base_max_compaction_score` |  | Num | Current maximum Base Compaction Score | This value changes in real time and may miss peak data. The higher the value, the more severe the Compaction backlog | P0 |
| `doris_be_tablet_cumulative_max_compaction_score` |  | Num | Same as above. Current maximum Cumulative Compaction Score |  |  |
| `doris_be_tablet_version_num_distribution` |  | Num | Histogram of the number of tablet versions | Reflects the distribution of tablet version counts | P0 |
| `doris_be_thrift_connections_total` |  | Num | Cumulative number of created thrift connections. For example, `{name="heartbeat"}` indicates the cumulative number of connections to the heartbeat service | This value is for the thrift server in which the BE acts as the server side |  |
| `doris_be_thrift_current_connections` |  | Num | Current number of thrift connections. For example, `{name="heartbeat"}` indicates the current number of connections to the heartbeat service | Same as above |  |
| `doris_be_thrift_opened_clients` |  | Num | Current number of opened thrift clients. For example, `{name="frontend"}` indicates the number of clients accessing the FE service |  |  |
| `doris_be_thrift_used_clients` |  | Num | Current number of thrift clients in use. For example, `{name="frontend"}` indicates the number of clients currently used to access the FE service |  |  |
| `doris_be_timeout_canceled_fragment_count` |  | Num | Cumulative number of fragment instances canceled due to timeout | This value may be recorded multiple times. For example, some fragment instances may be canceled multiple times | P0 |
| `doris_be_stream_load_txn_request` | {type="begin"} | Num | Cumulative number of stream load transactions started | Includes both stream load and routine load tasks |  |
| `doris_be_stream_load_txn_request` | {type="commit"} | Num | Cumulative number of stream load transactions successfully committed | Same as above |  |
| `doris_be_stream_load_txn_request` | {type="rollback"} | Num | Cumulative number of stream load transactions that failed | Same as above |  |
| `doris_be_unused_rowsets_count` |  | Num | Number of currently deprecated rowsets | These rowsets are periodically deleted under normal circumstances |  |
| `doris_be_upload_fail_count` |  | Num | Cumulative number of times rowsets failed to upload to remote storage in the tiered storage feature |  |  |
| `doris_be_upload_rowset_count` |  | Num | Cumulative number of times rowsets were successfully uploaded to remote storage in the tiered storage feature |  |  |
| `doris_be_upload_total_byte` |  | Bytes | Cumulative data volume of rowsets successfully uploaded to remote storage in the tiered storage feature |  |  |
| `doris_be_load_bytes` |  | Bytes | Cumulative number of bytes sent via tablet sink | Observe load data volume | P0 |
| `doris_be_load_rows` |  | Num | Cumulative number of rows sent via tablet sink | Observe load data volume | P0 |
| `fragment_thread_pool_queue_size` |  | Num | Current length of the wait queue for the query execution thread pool | If greater than zero, query threads are exhausted and queries are accumulating | P0 |
| `doris_be_all_rowsets_num` |  | Num | Total number of all current rowsets |  | P0 |
| `doris_be_all_segments_num` |  | Num | Total number of all current segments |  | P0 |
| `doris_be_heavy_work_max_threads` |  | Num | Number of threads in the brpc heavy thread pool |  | P0 |
| `doris_be_light_work_max_threads` |  | Num | Number of threads in the brpc light thread pool |  | P0 |
| `doris_be_heavy_work_pool_queue_size` |  | Num | Maximum queue length of the brpc heavy thread pool. Submission of work is blocked when exceeded |  | P0 |
| `doris_be_light_work_pool_queue_size` |  | Num | Maximum queue length of the brpc light thread pool. Submission of work is blocked when exceeded |  | P0 |
| `doris_be_heavy_work_active_threads` |  | Num | Number of active threads in the brpc heavy thread pool |  | P0 |
| `doris_be_light_work_active_threads` |  | Num | Number of active threads in the brpc light thread pool |  | P0 |
| `routine_load_get_msg_latency` |  | Milliseconds | Latency of Routine Load retrieving Kafka messages |  |  |
| `routine_load_get_msg_count` |  | Num | Number of times Routine Load retrieves Kafka messages |  |  |
| `routine_load_consume_bytes` |  | Bytes | Volume of data consumed from Kafka by Routine Load |  |  |
| `routine_load_consume_rows` |  | Num | Number of rows consumed from Kafka by Routine Load |  |  |

### Machine Monitoring

| Name | Label | Unit | Meaning | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| `doris_be_cpu` |  | Num | CPU-related monitoring metrics, collected from `/proc/stat`. Values are collected for each logical core. For example, `{device="cpu0",mode="nice"}` indicates the nice value of cpu0 | CPU usage can be calculated from this | P0 |
| `doris_be_disk_bytes_read` |  | Bytes | Cumulative disk read volume. Collected from `/proc/diskstats`. Values are collected for each disk. For example, `{device="vdd"}` indicates the value of the vdd disk |  |  |
| `doris_be_disk_bytes_written` |  | Bytes | Cumulative disk write volume. Collected in the same way as above |  |  |
| `doris_be_disk_io_time_ms` |  | Milliseconds | Collected in the same way as above | IO Util can be calculated from this | P0 |
| `doris_be_disk_io_time_weighted` |  | Milliseconds | Collected in the same way as above |  |  |
| `doris_be_disk_reads_completed` |  | Num | Collected in the same way as above |  |  |
| `doris_be_disk_read_time_ms` |  | Milliseconds | Collected in the same way as above |  |  |
| `doris_be_disk_writes_completed` |  | Num | Collected in the same way as above |  |  |
| `doris_be_disk_write_time_ms` |  | Milliseconds | Collected in the same way as above |  |  |
| `doris_be_fd_num_limit` |  | Num | System file handle limit ceiling. Collected from `/proc/sys/fs/file-nr` |  |  |
| `doris_be_fd_num_used` |  | Num | Number of file handles used by the system. Collected from `/proc/sys/fs/file-nr` |  |  |
| `doris_be_file_created_total` |  | Num | Cumulative number of local file creations | Counts all files that called `local_file_writer` and were finally closed |  |
| `doris_be_load_average` |  | Num | Machine Load Avg metric monitoring. For example, {mode="15_minutes"} is the 15-minute Load Avg | Observe the overall machine load | P0 |
| `doris_be_max_disk_io_util_percent` |  | Percentage | The calculated maximum IO UTIL value among all disks |  | P0 |
| `doris_be_max_network_receive_bytes_rate` |  | Bytes/Sec | The calculated maximum receive rate among all network interfaces |  | P0 |
| `doris_be_max_network_send_bytes_rate` |  | Bytes/Sec | The calculated maximum send rate among all network interfaces |  | P0 |
| `doris_be_memory_pgpgin` |  | Bytes | Volume of data written from disk to memory pages by the system |  |  |
| `doris_be_memory_pgpgout` |  | Bytes | Volume of data written from system memory pages to disk |  |  |
| `doris_be_memory_pswpin` |  | Bytes | Volume swapped in from disk to memory by the system | Normally, swap should be disabled, so this value should be 0 |  |
| `doris_be_memory_pswpout` |  | Bytes | Volume swapped out from memory to disk by the system | Normally, swap should be disabled, so this value should be 0 |  |
| `doris_be_network_receive_bytes` |  | Bytes | Cumulative receive bytes for each network interface. Collected from `/proc/net/dev` |  |  |
| `doris_be_network_receive_packets` |  | Num | Cumulative receive packet count for each network interface. Collected from `/proc/net/dev` |  |  |
| `doris_be_network_send_bytes` |  | Bytes | Cumulative send bytes for each network interface. Collected from `/proc/net/dev` |  |  |
| `doris_be_network_send_packets` |  | Num | Cumulative send packet count for each network interface. Collected from `/proc/net/dev` |  |  |
| `doris_be_proc` | `{mode="ctxt_switch"}` | Num | Cumulative number of CPU context switches. Collected from `/proc/stat` | Observe whether there are abnormal context switches | P0 |
| `doris_be_proc` | `{mode="interrupt"}` | Num | Cumulative number of CPU interrupts. Collected from `/proc/stat` |  |  |
| `doris_be_proc` | `{mode="procs_blocked"}` | Num | Number of processes currently blocked in the system (for example, waiting for IO). Collected from `/proc/stat` |  |  |
| `doris_be_proc` | `{mode="procs_running"}` | Num | Number of processes currently running in the system. Collected from `/proc/stat` |  |  |
| `doris_be_snmp_tcp_in_errs` |  | Num | Number of tcp packet receive errors. Collected from `/proc/net/snmp` | Observe network errors such as retransmissions and packet loss. Use together with other snmp metrics | P0 |
| `doris_be_snmp_tcp_in_segs` |  | Num | Number of tcp packets received. Collected from `/proc/net/snmp` |  |  |
| `doris_be_snmp_tcp_out_segs` |  | Num | Number of tcp packets sent. Collected from `/proc/net/snmp` |  |  |
| `doris_be_snmp_tcp_retrans_segs` |  | Num | Number of tcp packet retransmissions. Collected from `/proc/net/snmp` |  |  |

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Monitoring metric integration and interpretation -->

### Q: The monitoring endpoint returns 404. What should I do?

Confirm that you are accessing the `http_port` of the FE or the `webserver_port` of the BE, and verify the actual port values in `fe.conf` / `be.conf`.

### Q: Counter metrics only increase and never decrease. Is this normal?

This is normal. A Counter represents a cumulative value. You must sample at intervals and calculate the slope (for example, PromQL's `rate()`) to obtain the instantaneous rate.

### Q: The gap of `doris_fe_max_journal_id` between multiple FEs is too large. What should I do?

This indicates a metadata sync delay. Check the network connectivity and replay speed of the Follower / Observer FE relative to the Master FE.

### Q: Compaction Score remains too high. How do I troubleshoot?

Focus on `doris_be_tablet_base_max_compaction_score` and `doris_be_tablet_cumulative_max_compaction_score`, and combine them with disk IO and the number of Compaction tasks to identify the bottleneck.

### Q: Queries or loads are accumulating. How do I troubleshoot?

Check thread pool queueing metrics such as `fragment_thread_pool_queue_size`, `doris_be_scanner_thread_pool_queue_size`, and `doris_be_send_batch_thread_pool_queue_size`.
