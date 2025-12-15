---
{
    "title": "Query Profile Analysis Guide",
    "language": "en"
}
---

# Overview

Apache Doris provides Query Profile to expose query execution details. This article covers the overall architecture and practical guidance, including:
- Collection workflow: how Profile is collected from Backends and stored on Frontend.
- Collection-related parameters: how to configure to filter noise and focus on key query details.
- Reading methods: how to quickly locate operators that impact performance.

# Query Profile Architecture
![alt text](/images/profile/profile-image-0.png)

The core consists of FE `ProfileManager` and BE `AsyncReportThreadPool`.
1. When a query starts, FE registers Profile-related data structures into `ProfileManager`.
2. After a BE query finishes, it registers its Profile as a task into an async reporting thread pool to FE.
3. BE `AsyncReportThreadPool` sends Profile data to FE via RPC, per-query.
4. FE background threads process and manage collected Profiles, decide retention and eviction, and compress and persist suitable Profiles.
5. Users view Profiles via Web UI or curl.
6. `ProfileManager` fetches Profiles from memory or external storage and returns them as text.

Async reporting and persistence have the greatest impact on Profile behavior.

Under heavy load, async reporting may time out. To avoid excessive memory usage on FE, `ProfileManager` abandons timed-out Profiles after waiting for a while. You can adjust `profile_async_collect_expire_time_secs` in `fe.conf`. If timeouts are frequent, check resource usage first; turning off global Profile may be safer.

Persisting Profiles to disk ensures:
1. Profiles no longer occupy FE memory.
2. Profiles remain queryable after FE restarts.

This allows FE to retain thousands of complete Profiles and makes it easier to compare before/after upgrades to validate performance improvements.

# Configure Profile
## Enable Profile
### enable_profile
When false, Profile is not generated. Default: false.
```sql
mysql> select 1;
...
mysql> show query profile;
...
```
### profile_level
Default: 1. Effective in 4.0 and master branches.

By default, BE reports a concise Profile (enough for FE to build MergedProfile). For more details with minimal impact, set `profile_level=2`. The maximum is 3; at level 3, collecting some counters may affect performance.

Example: default `EXCHANGE_OPERATOR` counters:
```
EXCHANGE_OPERATOR(id=1):
     - InstanceID: ef33b72e30b84b68-82ad027edbee5910
     - BlocksProduced: 1
     - CloseTime: 4.243us
     - ExecTime: 30.834us
     - InitTime: 20.902us
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.93us
     - ProjectionTime: 0ns
     - RowsProduced: 10
     - WaitForDependencyTime: 0ns
       - WaitForData0: 635.324us
```
With `profile_level=2`, more counters appear:
```
EXCHANGE_OPERATOR(id=1):
     - InstanceID: 514023de1b7b41a3-9e59e43c591103a2
     - BlocksProduced: 1
     - CloseTime: 3.523us
     - CreateMergerTime: 0ns
     - DataArrivalWaitTime: 0ns
     - DecompressBytes: 0.00 
     - DecompressTime: 0ns
     - DeserializeRowBatchTimer: 0ns
     - ExecTime: 28.439us
     - FilterTime: 287ns
     - FirstBatchArrivalWaitTime: 0ns
     - GetDataFromRecvrTime: 3.482us
     - InitTime: 18.258us
     - LocalBytesReceived: 36.00 KB
     - MaxFindRecvrTime(NS): 0
     - MaxWaitForWorkerTime: 0
     - MaxWaitToProcessTime: 0
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.44us
     - ProjectionTime: 0ns
     - RemoteBytesReceived: 0.00 
     - RowsProduced: 10
     - SendersBlockedTotalTimer(*): 0ns
     - WaitForDependencyTime: 0ns
       - WaitForData0: 596.708us
```
### auto_profile_threshold_ms
Default: -1. Effective from 3.0.

Globally enabling Profile can generate大量 entries, consuming FE CPU/memory/disk and affecting latency-sensitive small queries, so FE periodically cleans Profiles. To avoid losing a slow query Profile, use this parameter to only generate and retain Profiles when query time exceeds the threshold. `-1` means generate Profiles for all queries.

Example: with global Profile on, all queries generate Profiles. Set a threshold to skip trivial ones:
```sql
mysql> clean all profile;
mysql> set global auto_profile_threshold_ms=1000;
...
mysql> show query profile;

Empty set (0.00 sec)
```
## Configure Profile Storage
Doris can persist Profiles on FE local disk to keep more records. Configure in `fe.conf`:
### max_query_profile_num
Default: 500. Max Profiles kept in FE memory. Excess are evicted from oldest.
### max_spilled_profile_num
Default: 500. Max Profiles stored on disk. Excess are deleted from oldest.
### spilled_profile_storage_path
Local directory for Profiles. Default: `log/profile`.
### spilled_profile_storage_limit_bytes
Default: 1 GB. Max total disk space occupied by Profiles.

## Retrieve Profiles
### Via FE Web UI
Visit FE `ip:http_port` and log in. Open QueryProfile to view all Profiles on the current FE, click Profile ID for details.
Notes:
- Profiles exist only on the FE that executed the SQL; they are not synchronized across FEs. Connect to the FE used by the query.
- Import jobs are forwarded to FE Master for execution, so their Profiles must be fetched from the Master FE.

![alt text](/images/profile/profile-image-1.png)

### Via command line
When FE Web UI is unavailable (e.g., security constraints), use CLI. First, `show query profile` to list the latest 20 profiles.
```sql
mysql> show query profile;
...
```
Fetch a specific Profile via HTTP API, e.g., ID `f7efdc4c092d4b14-95e0f7f7783974d3`:
```bash
curl -uroot: http://127.0.0.1:5937/api/profile/text?query_id=f7efdc4c092d4b14-95e0f7f7783974d3 > f7efdc4c092d4b14-95e0f7f7783974d3.profile
```
The result matches Web UI:
```bash
> head f7efdc4c092d4b14-95e0f7f7783974d3.profile -n 10
Summary:
   - Profile ID: f7efdc4c092d4b14-95e0f7f7783974d3
   - Task Type: QUERY
   - Start Time: 2025-02-26 19:31:27
   - End Time: 2025-02-26 19:32:41
   - Total: 1min14sec
   - Task State: OK
   - User: root
   - Default Catalog: internal
   - Default Db: tpch
```
### From disk directly
From 3.0 on, Profiles can be persisted. Default directory: `log/profile`. For faster viewing, unzip the target file to get text output. Notes:
1. Doris FE protects `log/profile`; do not keep the unzipped output inside, or it will be deleted.
2. Text format differs slightly from Web UI: `Summary` is saved as JSON meta, the rest matches Web UI.

```bash
unzip profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
head 33bf38e988ea4945-b585d2f74d1da3fd.profile -n 10
```

## Profile Structure
Profile content comprises:
1. Summary
`SummaryProfile` is the metadata, recording key fields for retrieval, such as `Profile ID`, `Total`.
```text
-  Profile  ID:  d4d281168bf7490a-a133623295744f85
-  Task  Type:  QUERY
-  Start  Time:  2025-02-28  19:23:14
-  End  Time:  2025-02-28  19:23:16
-  Total:  2sec420ms
-  Task  State:  OK
```
2. ExecutionSummary
Summary of execution. Plan-related fields record Planner time.
3. ChangedSessionVariables
Session variables changed during execution.
```text
ChangedSessionVariables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000       
fetch_splits_max_wait_time_ms | 4000         | 1000        
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1           
auto_profile_threshold_ms     | 1            | -1          
```
4. MergedProfile
Aggregation of `DetailProfile`. Main purposes:
- Clarify query plan and Pipeline structure.

Doris has a Query → Fragment → PlanNode hierarchy for planning; the executor schedules by Pipeline, each consisting of Operators. MergedProfile clearly shows the transformation from plan to Pipeline. Examples below show how to reconstruct plan and Pipeline.
- Quickly locate bottleneck operators.

Use `DependencyWaitTime` in MergedProfile to find the most time-consuming operator, then inspect its details in DetailProfile.
- Compare data skew.

By comparing `InputRows` and `RowsProduced`, you can judge whether data is uneven across Backends, which often causes slow or failed queries.

5. DetailProfile

The detailed execution information. DetailProfile records, for each Fragment and Pipeline, the `PipelineTask` execution across Backends. After locating the bottleneck in MergedProfile, use DetailProfile for deep analysis.

## Example: Reading a Profile
Consider a typical query with Aggregation, Join and Scan on the TPCH dataset: join `customer` and `orders`, then aggregate.
```sql
SELECT c.c_name,
       Count(o.o_orderkey) AS total_orders,
       Sum(o.o_totalprice) AS total_spent
FROM   customer c
       JOIN orders o
         ON c.c_custkey = o.o_custkey
GROUP  BY c.c_name
LIMIT  20 
```
To keep the Profile concise, limit parallelism:
```sql
set parallel_pipeline_task_num=2;
```
After running and fetching the Profile via Web UI, focus on MergedProfile. For brevity, only key fields are shown:
```
MergedProfile:
     Fragments:
       Fragment 0:
         Pipeline 0(instance_num=1):
           RESULT_SINK_OPERATOR(id=0):
             CommonCounters:
                - ExecTime: avg 176.545us, max 176.545us, min 176.545us
                - InputRows: sum 20, avg 20, max 20, min 20
                - WaitForDependency[RESULT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=8):
             CommonCounters:
                - ExecTime: avg 84.559us, max 84.559us, min 84.559us
                - RowsProduced: sum 20, avg 20, max 20, min 20
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 1:
```
