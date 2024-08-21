---
{
"title": "Workload Fusing",
"language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Workload Fusing

Workload Fusing is typically applied in scenarios where certain queries excessively consume resources, leading to a decline in the overall availability of the online cluster. In such cases, the cluster can be restored to normal operation by detecting and blocking the abnormal big queries during runtime.

If users have already grouped their workload based on query latency, such as assigning big queries to one Workload Group and small queries to another, the big query circuit breaking method can also be used to improve the availability of the small query group.

Currently, the big query circuit breaking strategy is mainly implemented through the Workload Policy feature, allowing users to configure specific policies to achieve automatic circuit breaking of big queries.

## Workload Fusing Test

### Test Env
1FE,1BE(96 cores), test data is clickbench.

### Workload Fusing By Memory
1.  Test sql is q29, the query 's peak memory is（peakMemoryBytes）8G in fe.audit.log.
```
|User=root|Ctl=internal|Db=hits|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=4614|ScanBytes=13107527680|ScanRows=81032736|ReturnRows=11|StmtId=526|QueryId=e5b6c62d624146e4-b7291221492a7cc2|IsQuery=true|isNereids=true|feIp=10.16.10.8|StmtType=SELECT|Stmt=SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25|CpuTimeMS=105631|ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=b03d48a7e6849912003ad1cff9519957|peakMemoryBytes=8741352477|SqlDigest=|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```

2. Create a policy which kill the query which using memory exceeds 1G.
```
create workload policy cancel_1g_query conditions(query_be_memory_bytes > 1073741824) actions(cancel_query);

mysql [information_schema]>select * from workload_policy;
+-------+-----------------+------------------------------------+--------------+----------+---------+---------+----------------+
| ID    | NAME            | CONDITION                          | ACTION       | PRIORITY | ENABLED | VERSION | WORKLOAD_GROUP |
+-------+-----------------+------------------------------------+--------------+----------+---------+---------+----------------+
| 11313 | cancel_1g_query | query_be_memory_bytes > 1073741824 | cancel_query |        0 |       1 |       0 |                |
+-------+-----------------+------------------------------------+--------------+----------+---------+---------+----------------+
1 row in set (0.02 sec)
```

3. Test again, we can see query is killed by policy cancel_1g_query.
```
    mysql [information_schema]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits.hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]query ceb0553d359e454f-8939599b2e602d07 cancelled by workload policy: cancel_1g_query, id:11313
```

### Workload Fusing By Scan Rows
1. Create the policy.
```
// disable other policy first.
alter workload policy cancel_1g_query properties('enabled'='false');

create workload policy canel_scan_5kw_query conditions(be_scan_rows > 50000000) actions(cancel_query);
```

2. Test query, the query failed because of cancel_1g_query.
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits.hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;

ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]query f9d15001bfc94322-9b63a8b84aef9dee cancelled by workload policy: canel_scan_5kw_query, id:11314
```
It is important to note that be_scan_rows mainly tracks the amount of data scanned by a query on a single BE. In a production environment, the data for a table is usually distributed across multiple BEs, and the number of rows scanned by a query as seen in the audit is the sum from all BEs.

Therefore, when a query fails due to the SCAN data volume, the number of scanned rows in the audit is typically much larger than the value configured in the Policy.

### Workload Fusing By Query Time
1. Create the policy.
```
// disable other policy first.
alter workload policy canel_scan_5kw_query properties('enabled'='false');

create workload policy cancel_time_1s_query conditions(query_time > 1000) actions(cancel_query);
```
2. Test query, it may be failed because of cancel_time_1s_query.
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits.hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]query c6aebdf403e24c62-965daf0bdff179f7 cancelled by workload policy: cancel_time_1s_query, id:11315
```

### NOTE
1. Currently, the time interval for the Frontend (FE) to synchronize Workload Policy metadata to the Backend (BE) is 30 seconds, meaning that it may take up to 30 seconds for any policy changes to take effect.
2. Currently, the Backend (BE) executes the strategies configured in the Policy through a scheduled thread with a time interval of 500ms. This means that if a query is very short and completes within 500ms, it may not be subject to the Workload Policy constraints.