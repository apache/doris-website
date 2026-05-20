---
{
    "title": "Workload Analysis and Diagnosis: Runtime Monitoring and Historical Auditing",
    "sidebar_label": "Workload Analysis",
    "language": "en",
    "description": "Describes how to locate cluster bottlenecks and troubleshoot abnormal SQL through real-time monitoring and historical audit logs, and how to quickly restore cluster availability.",
    "keywords": ["workload management", "workload group", "cluster diagnosis", "abnormal SQL", "audit log", "resource bottleneck", "CPU memory IO", "kill query", "backend_active_tasks", "active_queries"]
}
---

<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

Cluster workload analysis falls into two stages: **runtime analysis** (quickly stop the bleeding when cluster availability drops) and **historical data analysis** (find unreasonable workloads from audit logs after the fact).

## Applicable Scenarios

| Scenario | Trigger | Main Tools |
|------|----------|----------|
| Runtime analysis | Monitoring shows abnormal increases in CPU / memory / IO | `workload_group_resource_usage`, `backend_active_tasks`, KILL statement |
| Historical data analysis | Post-incident review or periodic inspection | Audit log tables, percentile functions, SQL tuning |

## Runtime Workload Analysis

<!-- Knowledge type: Procedure -->

When monitoring shows that cluster availability has dropped, follow the steps below.

### Step 1: Determine the Type of Resource Bottleneck

Use monitoring to determine whether the current main bottleneck is memory, CPU, or IO. If all three are high, address the memory issue first.

### Step 2: Find the Workload Group with the Highest Resource Usage

Use the `workload_group_resource_usage` table to sort by the corresponding resource metric in descending order, and find the top N groups by usage. See [Common Diagnostic SQL](#common-diagnostic-sql) for details.

### Step 3: Limit Query Concurrency for High-Usage Groups

When cluster resources are already tight, lower the maximum query concurrency for the group to prevent new queries from continuing to exhaust resources.

### Step 4: Apply Degradation to High-Usage Groups

<!-- Knowledge type: Configuration parameters -->

Choose the corresponding degradation method based on the bottleneck type:

| Bottleneck Type | Degradation Method | Notes |
|----------|----------|------|
| CPU | Change CPU to hard limit and set a lower `cpu_hard_limit` | Actively yield CPU to avoid affecting other groups |
| IO | Set `read_bytes_per_second` | Limit the maximum disk read rate for the group |
| Memory | Change memory to hard limit and lower `memory_limit` | Releases part of the memory, but may cause many queries in the group to fail |

### Step 5: Further Analyze the Root Cause

After degradation, cluster availability usually recovers somewhat. At this point, analyze the root cause of the resource spike: whether overall query concurrency has increased, or whether certain large queries are responsible. If it is a large query, use the KILL statement to kill it quickly and accelerate fault recovery.

### Step 6: Locate and Kill Abnormal SQL

Combine `backend_active_tasks` and `active_queries` to find SQL with abnormal resource usage, and release resources using the KILL statement. See [Common Diagnostic SQL](#common-diagnostic-sql) for details.

## Historical Data Analysis

<!-- Knowledge type: Procedure -->

The Doris audit log table records brief information about SQL execution, which can be used to find unreasonable queries after the fact.

### Step 1: Confirm Historical Resource Bottlenecks Through Monitoring

Review historical monitoring to confirm the cluster's bottleneck type (CPU, memory, or IO) and narrow down the time range for investigation.

### Step 2: Locate Abnormal SQL from the Audit Log

Abnormal SQL can be defined in two ways:

- **Based on business expectations**: If most queries have second-level latency and scan rows in the tens of millions, then SQL that scans hundreds of millions or billions of rows is abnormal and requires manual intervention.

- **Based on a percentile baseline**: If the business side has no expectations for resource usage, you can use percentile functions to build a baseline. Taking a CPU bottleneck as an example: first calculate the tp50/tp75/tp99/tp999 of query CPU time over a historical period as the normal baseline, then compare it with the percentile values for the same time window in the current period. For example, if the historical tp999 is 1 minute but the current tp50 has reached 1 minute, this indicates that a large number of SQL statements with CPU time exceeding 1 minute have appeared in the current period, and these SQL statements can be defined as abnormal SQL. The same approach applies to other resource metrics.

### Step 3: Optimize Abnormal SQL

Optimize SQL with abnormal resource usage. Common methods include SQL rewriting, table schema optimization, and parallelism tuning, to reduce the resource usage of a single SQL.

### Step 4: Decide Whether to Scale Out or Throttle

If the audit log shows that resource usage for each SQL is normal, use monitoring and audit logs to check whether the number of SQL statements executed at that time was higher than the historical level. If there is a significant increase, confirm with the upstream business whether access traffic has grown, and then decide whether to scale out the cluster or enable queuing and throttling.

## Common Diagnostic SQL

<!-- Knowledge type: Procedure -->

:::tip Note
`active_queries` records queries registered on the FE, and `backend_active_tasks` records tasks running on the BE. Not all queries are registered on the FE (for example, Stream Load is not registered on the FE), so it is normal to see unmatched rows when joining `backend_active_tasks` LEFT JOIN `active_queries`.

- When the query type is SELECT, the `queryId` in both tables is the same.
- When the query type is Stream Load, the `queryId` in `active_queries` is empty, and the `queryId` in `backend_active_tasks` is the ID of the Stream Load.
:::

**1. View resource usage of each Workload Group (sorted by memory / CPU / IO in descending order)**

```sql
SELECT be_id, workload_group_id, memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second
FROM workload_group_resource_usage
ORDER BY memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second DESC;
```

**2. Top N SQL by CPU usage**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t2.`database`,
    t1.cpu_time,
    t2.`sql`
FROM
    (SELECT query_id, query_type, sum(task_cpu_time_ms) AS cpu_time
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY cpu_time DESC
LIMIT 10;
```

**3. Top N SQL by memory usage**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.mem_used
FROM
    (SELECT query_id, query_type, sum(current_used_memory_bytes) AS mem_used
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY mem_used DESC
LIMIT 10;
```

**4. Top N SQL by scanned data volume**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.scan_rows,
    t1.scan_bytes
FROM
    (SELECT query_id, query_type, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY scan_rows DESC, scan_bytes DESC
LIMIT 10;
```

**5. Summary of scanned data volume for each Workload Group**

```sql
SELECT
    t2.workload_group_id,
    sum(t1.scan_rows) AS wg_scan_rows,
    sum(t1.scan_bytes) AS wg_scan_bytes
FROM
    (SELECT query_id, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
GROUP BY t2.workload_group_id
ORDER BY wg_scan_rows DESC, wg_scan_bytes DESC;
```

**6. View queued queries and queuing duration for each Workload Group**

```sql
SELECT
    workload_group_id,
    query_id,
    query_status,
    now() - queue_start_time AS queued_time
FROM active_queries
WHERE query_status = 'queued'
ORDER BY workload_group_id;
```
