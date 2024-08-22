---
{
    "title": "大查询熔断",
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

大查询熔断通常适用于线上集群经常出现个别占用资源过多的查询导致集群整体可用性下降的场景，此时可以通过在运行时检测异常的大查询，并且阻止这个查询运行的方式使得集群恢复正常。
如果用户已经根据查询延迟对负载进行了分组，比如大查询划分到一个Workload Group，小查询划分到一个Workload Group，那么也可以通过大查询熔断的方式提高小查询分组的可用性。
目前的大查询熔断策略主要是通过Workload Policy功能实现的，用户可以通过配置特定的策略实现大查询的自动熔断。

## 大查询熔断测试

### 测试环境
1FE，1BE，BE配置为96核，测试数据集为clickbench。

### 基于内存容量的熔断
1.  测试SQL使用ckbench的q29，可以通过审计看到这个查询的峰值内存用量（peakMemoryBytes）为8G。
```
|User=root|Ctl=internal|Db=hits|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=4614|ScanBytes=13107527680|ScanRows=81032736|ReturnRows=11|StmtId=526|QueryId=e5b6c62d624146e4-b7291221492a7cc2|IsQuery=true|isNereids=true|feIp=10.16.10.8|StmtType=SELECT|Stmt=SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25|CpuTimeMS=105631|ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=b03d48a7e6849912003ad1cff9519957|peakMemoryBytes=8741352477|SqlDigest=|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```

2. 新建一个Workload Policy，如果查询内存超过1G就kill。
```
create workload policy cancel_1g_query conditions(query_be_memory_bytes > 1073741824) actions(cancel_query);

// 通过系统表查看新建的policy
mysql [information_schema]>select * from workload_policy;
+-------+-----------------+------------------------------------+--------------+----------+---------+---------+----------------+
| ID    | NAME            | CONDITION                          | ACTION       | PRIORITY | ENABLED | VERSION | WORKLOAD_GROUP |
+-------+-----------------+------------------------------------+--------------+----------+---------+---------+----------------+
| 11313 | cancel_1g_query | query_be_memory_bytes > 1073741824 | cancel_query |        0 |       1 |       0 |                |
+-------+-----------------+------------------------------------+--------------+----------+---------+---------+----------------+
1 row in set (0.02 sec)
```

3. 再次执行查询，可以看到此时查询会被新建的Policy给cancel掉。
```
    mysql [information_schema]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits.hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]query ceb0553d359e454f-8939599b2e602d07 cancelled by workload policy: cancel_1g_query, id:11313
```

### 基于SCAN数据量的熔断
1. 使用ckbench的q29进行测试，新建一个限制扫描行数的Policy。
```
// 先禁用掉已经创建的policy
alter workload policy cancel_1g_query properties('enabled'='false');

// 创建一个新的基于scan函数熔断的policy
create workload policy canel_scan_5kw_query conditions(be_scan_rows > 50000000) actions(cancel_query);
```

2. 测试查询执行情况，此时查询会由于SCAN行数超过配置的值而失败。
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits.hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;

ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]query f9d15001bfc94322-9b63a8b84aef9dee cancelled by workload policy: canel_scan_5kw_query, id:11314
```
需要注意的是，be_scan_rows主要统计的是某个查询在单BE上的扫描数据量，线上环境下一个表的数据通常分布在多个BE上，而审计中看到的查询的扫描行数是多个BE的汇总，
因此当查询由于SCAN数据量失败时，审计里的扫描行数通常要比Policy中配置的大很多。

### 基于查询时间的熔断
1. 使用ckbench的q29进行测试，新建一个取消执行时间超过1s的查询的Policy。
```
// 先禁用已经创建的policy
alter workload policy canel_scan_5kw_query properties('enabled'='false');

create workload policy cancel_time_1s_query conditions(query_time > 1000) actions(cancel_query);
```
2. 执行查询，可以看到该查询由于执行时间超过1秒而失败。
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits.hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]query c6aebdf403e24c62-965daf0bdff179f7 cancelled by workload policy: cancel_time_1s_query, id:11315
```

### 注意事项
1. 目前FE向BE同步Workload Policy元数据的时间间隔为30秒，也就是对于policy的变更最大需要30秒才会生效。
2. BE目前是通过定时线程来执行Policy中配置的策略，时间间隔为500ms，这意味着如果查询的时间过短，在500ms以内，可能不会受到Workload Policy的约束。