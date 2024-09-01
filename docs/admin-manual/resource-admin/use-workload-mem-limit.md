---
{
"title": "Use Workload Group limit memory",
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

Ad-hoc queries typically have unpredictable SQL input and uncertain memory usage, which carries the risk of a few queries consuming a large amount of memory. This type of load can be assigned to a separate group. By using the hard memory limits feature of the Workload Group, sudden large queries can be prevented from consuming all available memory, which would otherwise leave no memory for other queries or cause an Out of Memory (OOM) error.

When the memory usage of this Workload Group exceeds the configured hard limit, memory will be freed by killing queries, thus preventing the process memory from being completely consumed.

## Test hard memory limit
### Test env
1FE，1BE，BE(96 cores)，memory is 375G。

Test data is clickbench, run q29 in 3 concurrent.

### Not using Workload Group's memory limit.
1. Show process memory usage, ps shows memory usage, the memory is 7.7G.
```
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7896792
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7929692
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 8101232
```

2. Show Workload Group memory by system table, it's 5.8G.
```
mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5797.524360656738 |
+-------------------+
1 row in set (0.01 sec)

mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5840.246627807617 |
+-------------------+
1 row in set (0.02 sec)

mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5878.394917488098 |
+-------------------+
1 row in set (0.02 sec)
```
Here, you can see that the memory usage of the process is usually much greater than the memory usage of a single Workload Group, even if only one Workload Group is running in the process. This is because the Workload Group only accounts for the memory used by queries and some parts of data import. Other components within the process, such as metadata and various caches, are not included in the Workload Group's memory usage and are not managed by the Workload Group.

### Use Workload Group limit memory
1. Alter workload group.
```
alter workload group g2 properties('memory_limit'='0.5%');
alter workload group g2 properties('enable_memory_overcommit'='false');
```

2. Run test, the workload group uses 1.5G memory.
```
mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
+--------------------+
| wg_mem_used_mb     |
+--------------------+
| 1575.3877239227295 |
+--------------------+
1 row in set (0.02 sec)

mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
+------------------+
| wg_mem_used_mb   |
+------------------+
| 1668.77405834198 |
+------------------+
1 row in set (0.01 sec)

mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
+--------------------+
| wg_mem_used_mb     |
+--------------------+
| 499.96760272979736 |
+--------------------+
1 row in set (0.01 sec)
```

3. Show memory by ps command, the max memory is 3.8G. 
```
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         1.0 4071364
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         1.0 4059012
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         1.0 4057068
```

4. There are many query failed because of oom.
```
1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",并发 1-3,text,false,,444,0,3,3,null,0,0,0
```
In this error message, you can see that the Workload Group used 1.7GB of memory, while the Workload Group's limit is 1.69GB. The calculation works as follows: 1.69GB = Physical machine memory (375GB) * mem_limit (value in be.conf, default is 0.9) * 0.5% (Workload Group's configuration). This means that the memory percentage configured in the Workload Group is calculated based on the available memory of the Doris process.


## Suggestions
As demonstrated in the previous test, the hard limit can control the memory usage of a Workload Group, but it releases memory by killing queries, which can be a very unfriendly experience for users and may cause all queries to fail in extreme cases. Therefore, in a production environment, it is recommended to use memory hard limits in conjunction with query queuing. This approach can limit memory usage while ensuring the success rate of queries.