---
{
    "title": "Concurrency Control and Queuing: Prevent OOM and System Hang Under High Concurrency",
    "sidebar_label": "Concurrency Control and Queuing",
    "language": "en",
    "description": "Configure the concurrency limit and queuing policy of a Doris workload group to prevent OOM or system hang under high concurrency.",
    "keywords": ["concurrency control", "queuing", "workload group", "max_concurrency", "max_queue_size", "queue_timeout", "high concurrency", "OOM", "resource management", "query throttling"]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: High-concurrency query throttling / OOM prevention / System resource management -->

Concurrency Control and Queuing is a core mechanism in Doris workload management. When the number of concurrently running queries exceeds the system limit, Doris places the excess queries into a waiting queue instead of rejecting them outright or letting them overwhelm the system. This prevents problems such as OOM and system hangs.

This mechanism is implemented through the **workload group**. Each workload group can independently set the maximum concurrency, the queue length, and the queue timeout.

## Configure Concurrency Control and Queuing

<!-- Knowledge type: Procedure -->

**Purpose**: Create or modify a workload group to limit the number of concurrent queries and enable queuing.

**Command**:

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS queue_group
PROPERTIES (
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```

**Parameter description**:

| Parameter | Type | Default | Range | Description |
|---|---|---|---|---|
| `max_concurrency` | integer | 2147483647 | [0, 2147483647] | Maximum query concurrency. The default value is the maximum integer, which means concurrency is unlimited. When the number of running queries reaches this limit, new queries enter the queuing logic. |
| `max_queue_size` | integer | 0 | [0, 2147483647] | Length of the waiting queue. When the queue is full, new queries are rejected directly. The default value is 0, which means no queuing. |
| `queue_timeout` | integer | 0 | [0, 2147483647] | Maximum time a query can wait in the queue, in milliseconds. After the timeout, a failure is returned to the client directly. The default value is 0, which means a failure is returned immediately after entering the queue. |

**Example explanation**:

The configuration above has the following meaning in a single-FE scenario:

- The cluster runs at most 10 queries concurrently.
- When concurrency is full, new queries enter the queue, which has a maximum length of 20.
- A query in the queue waits at most 3 seconds (3000 milliseconds), and a timeout returns a failure.

:::tip Notes for multi-FE scenarios
Queuing parameters take effect at the **single-FE granularity** and do not factor in the total number of FEs in the cluster. For example:

- With `max_concurrency = 1` and 1 FE in the cluster, at most 1 SQL runs at the same time.
- With `max_concurrency = 1` and 3 FEs in the cluster, at most 3 SQLs run at the same time (1 per FE).

In a multi-FE cluster, set `max_concurrency` to the desired cluster-level concurrency divided by the number of FEs.
:::

## View the Current Queuing Status

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Monitor queuing / Diagnose concurrency issues -->

**Purpose**: View the current number of running queries and queued queries for each workload group.

**Command**:

```sql
SHOW WORKLOAD GROUPS;
```

**Example output**:

```text
mysql [(none)]> SHOW WORKLOAD GROUPS\G;
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

Key fields:

- `running_query_num`: The number of queries currently running.
- `waiting_query_num`: The number of queries currently waiting in the queue.

## Bypass the Queuing Limit (Administrator Operation)

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Operations / Emergency administration -->

**Purpose**: In operations scenarios, the administrator account needs to skip the queuing logic and execute management SQL directly.

**Command**:

```sql
SET bypass_workload_group = true;
```

**Description**: This setting is a session-level variable and only takes effect in the current session. Enable it temporarily only during operations, and disable it or re-establish the connection after the operation is complete.

## FAQ

<!-- Knowledge type: Troubleshooting -->

### Q: A new query fails immediately and does not enter the queue**

`queue_timeout = 0` or `max_queue_size = 0` prevents queries from being queued. Set `max_queue_size` > 0 and `queue_timeout` > 0.

### Q: Queries are rejected after the queue is full**

`max_queue_size` is set too small. Increase `max_queue_size` or raise `max_concurrency`.

### Q: The concurrency limit in a multi-FE cluster does not match expectations**

Queuing parameters take effect at the single-FE granularity. Set `max_concurrency` to the target value divided by the number of FEs.

### Q: Administrator operations are also blocked by the queue**

The bypass variable is not enabled. Run `SET bypass_workload_group = true`.
