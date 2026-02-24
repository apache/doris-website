---
{
    "title": "Concurrency Control and Queuing",
    "language": "en",
    "description": "Explains how to configure concurrency control and queuing in Doris through workload groups to manage query resources and prevent system overload."
}
---

Concurrency control and queuing is a resource management mechanism. When multiple queries simultaneously request resources and reach the system's concurrency limit, Doris will manage the queries based on predefined strategies and restrictions, ensuring the system can still operate smoothly under high load and avoid issues like OOM (Out of Memory) or system freezes.

Doris's concurrency control and queuing mechanism is primarily implemented through workload groups. A workload group defines the resource usage limits for queries, including maximum concurrency, queue length, and timeout parameters. By properly configuring these parameters, the goal of resource management can be achieved.

## Basic usage

```
create workload group if not exists queue_group
properties (
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```

**Parameter description**


| Property        | Data type | Default value | Value range     | Description                                                                                                                                                                                                                                                               |
|-----------------|-----------|---------------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| max_concurrency | Integer   | 2147483647    | [0, 2147483647] | Optional, the maximum number of concurrent queries. The default value is the maximum integer value, meaning there is no limit on concurrency. When the number of running queries reaches the maximum concurrency, new queries will enter the queuing process.             |
| max_queue_size  | Integer   | 0             | [0, 2147483647] | Optional, the length of the query queue. When the queue is full, new queries will be rejected. The default value is 0, meaning no queuing.                                                                                                                                |
| queue_timeout   | Integer   | 0             | [0, 2147483647] | Optional, the maximum wait time for a query in the queue, in milliseconds. If the query exceeds this time in the queue, an exception will be thrown to the client. The default value is 0, meaning no queuing, and queries will immediately fail upon entering the queue. |


If there is currently 1 FE in the cluster, the meaning of this configuration is as follows: The maximum number of concurrent queries in the cluster is limited to 10. When the maximum concurrency is reached, new queries will enter the queue, with the queue length limited to 20. The maximum wait time for a query in the queue is 3 seconds, and queries that exceed 3 seconds in the queue will return a failure directly to the client.

:::tip
The current queuing design does not take into account the number of FEs. The queuing parameters only take effect at the single FE level. For example:

In a Doris cluster, if a workload group is configured with max_concurrency = 1,
If there is 1 FE in the cluster, the workload group will allow only one SQL query to run at a time in the cluster;
If there are 3 FEs in the cluster, the maximum number of SQL queries in the cluster could be 3.
:::

## Check the queue status

**Syntax**

```
show workload groups
```

**Example**

```
mysql [(none)]>show workload groups\G;
*************************** 1. row ***************************
                          Id: 1
                        Name: normal
                   cpu_share: 20
                memory_limit: 50%
    enable_memory_overcommit: true
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
              cpu_hard_limit: 1%
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 50%
       memory_high_watermark: 80%
                         tag: 
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
           running_query_num: 0
           waiting_query_num: 0
```

```running_query_num```Represents the number of queries currently running, ```waiting_query_num```Represents the number of queries in the queue.

## Bypass the queuing

In some operational scenarios, the administrator account needs to bypass the queuing logic to execute SQL for system management tasks. This can be done by setting session variables to bypass the queuing:

```
set bypass_workload_group = true;
```
