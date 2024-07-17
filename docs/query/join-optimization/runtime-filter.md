---
{
    "title": "Runtime Filter",
    "language": "en"
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

# Runtime Filter

Runtime Filter is designed to dynamically generate filter conditions for certain Join queries at runtime to reduce the amount of data scanned, avoid unnecessary I/O and calculations, and thereby speed up queries.
## Noun Interpretation

* Left table: the table on the left during Join query. Perform Probe operation. The order can be adjusted by Join Reorder.
* Right table: the table on the right during Join query. Perform the Build operation. The order can be adjusted by Join Reorder.
* Fragment: FE will convert the execution of specific SQL statements into corresponding fragments and send them to BE for execution. The corresponding Fragment is executed on the BE, and the results are aggregated and returned to the FE.
* Join on clause: `Aa=Bb` in `A join B on Aa=Bb`, based on this to generate join conjuncts during query planning, including expr used by join Build and Probe, where Build expr is called in Runtime Filter src expr, Probe expr are called target expr in Runtime Filter.
- rf: Abbreviation of Runtime Filter.
## Principle

Runtime Filter is generated during query planning, constructed in HashJoinNode, and applied in ScanNode.

For example, there is currently a Join query between the T1 table and the T2 table. Its Join mode is HashJoin. T1 is a fact table with 100,000 rows of data. T2 is a dimension table with 2000 rows of data. Doris join The actual situation is:
```
|          >      HashJoinNode     <
|         |                         |
|         | 100000                  | 2000
|         |                         |
|   OlapScanNode              OlapScanNode
|         ^                         ^   
|         | 100000                  | 2000
|        T1                        T2
|
```
Obviously, scanning data for T2 is much faster than T1. If we take the initiative to wait for a while and then scan T1, after T2 sends the scanned data record to HashJoinNode, HashJoinNode calculates a filter condition based on the data of T2, such as the maximum value of T2 data And the minimum value, or build a Bloom Filter, and then send this filter condition to ScanNode waiting to scan T1, the latter applies this filter condition and delivers the filtered data to HashJoinNode, thereby reducing the number of probe hash tables and network overhead. This filter condition is Runtime Filter, and the effect is as follows:
```
|          >      HashJoinNode     <
|         |                         |
|         | 6000                    | 2000
|         |                         |
|   OlapScanNode              OlapScanNode
|         ^                         ^   
|         | 100000                  | 2000
|        T1                        T2
|
```
If the filter condition (Runtime Filter) can be pushed down to the storage engine, in some cases, the index can be used to directly reduce the amount of scanned data, thereby greatly reducing the scanning time. The effect is as follows:
```
|          >      HashJoinNode     <
|         |                         |
|         | 6000                    | 2000
|         |                         |
|   OlapScanNode              OlapScanNode
|         ^                         ^   
|         | 6000                    | 2000
|        T1                        T2
|
```
It can be seen that, unlike predicate pushdown and partition pruning, Runtime Filter is a filter condition dynamically generated at runtime, that is the join on clause is parsed to determine the filter expression when the query is running, and the expression is broadcast to the ScanNode that is reading the left table , thereby reducing the amount of data scanned, thereby reducing the number of probe hash tables and avoiding unnecessary I/O and calculations.

Runtime Filter is mainly used to optimize the join of large tables and small tables. If the amount of data in the left table is too small, the effect of rf's early filtering may not be great. If the amount of data in the right table is too large, there will be a relatively large cost when building and transmitting rf.

## Usage

### Runtime Filter query options

The default configuration has been adapted to most scenarios as much as possible. Only in some specific scenarios, further adjustments are required to achieve the best results. Usually, optimization is only performed for resource-intensive queries that take a long enough time to run and are frequent enough after performance testing.

For configuration options related to Runtime Filter, please refer to the following section:

- `enable_sync_runtime_filter_size`: When the optimizer cannot accurately estimate the cardinality, the executor is required to synchronize and obtain the global Build end size before generating rf, and determine the final type of IN Or Bloom Filter and the size of Bloom Filter based on this actual size. If set to false, no synchronization operation is performed to obtain the global size. The default value of this variable is true.

- `runtime_filter_max_in_num`: If the Build-side size is larger than this value, we will not generate IN predicate. The default value of this variable is 1024.

- `runtime_filter_mode`: Used to adjust the generation strategy of rf, including OFF, LOCAL, and GLOBAL. If set to OFF, rf will not be generated. The default value of this variable is GLOBAL.

- `runtime_filter_type`: The types of rf allowed to be generated, including Bloom Filter, MinMax Filter, IN predicate, IN Or Bloom Filter, and Bitmap Filter. The default value of this variable is IN_OR_BLOOM_FILTER,MIN_MAX.

- `runtime_filter_wait_infinitely`: If set to true, the scan node of the left table will wait until rf is received or the query times out, which is equivalent to runtime_filter_wait_time_ms being set to infinity. The default value of this variable is false.

- `runtime_filter_wait_time_ms`: The time the ScanNode of the left table waits for rf. If the waiting time has passed and no rf is received, the ScanNode will start scanning the data first, and the rf received later will take effect on the data that the ScanNode has not returned at this moment. The default value of this variable is 1000.

- `runtime_bloom_filter_min_size`: The minimum length of the Bloom Filter in the rf estimated by the optimizer. The default value of this variable is 1048576 (1M).

- `runtime_bloom_filter_max_size`: The maximum length of the Bloom Filter in the rf estimated by the optimizer. The default value of this variable is 16777216 (16M).

- `runtime_bloom_filter_size`: The default length of the Bloom Filter in the rf estimated by the optimizer. The default value of this variable is 2097152 (2M).

The query options are further explained below.

#### 1.runtime_filter_type
Type of Runtime Filter used.

**Type**: Number (1, 2, 4, 8, 16) or the corresponding mnemonic string (IN, BLOOM_FILTER, MIN_MAX, IN_OR_BLOOM_FILTER, BITMAP_FILTER), the default is 8 (IN_OR_BLOOM FILTER), use multiple commas to separate, pay attention to the need to add quotation marks , Or add any number of types, for example:
```
set runtime_filter_type="BLOOM_FILTER,IN,MIN_MAX";
```
Equivalent to:
```
set runtime_filter_type=7;
```

**Precautions for use**

- **IN or Bloom Filter**: Based on the actual number of rows in the right table during execution, the system automatically determines whether to use IN predicate or Bloom Filter.

 - By default, IN predicate will be used when the number of data rows in the right table is less than runtime_filter_max_in_num, otherwise Bloom filter will be used.

- **Bloom Filter**: There is a certain misjudgment rate, resulting in a little less filtered data than expected, but it will not cause the final result to be inaccurate. In most cases, Bloom Filter can improve performance or have no significant impact on performance. Impact, but may result in reduced performance in some cases.

 - Bloom Filter construction and application overhead is high, so when the filtering rate is low, or when the amount of data in the left table is small, Bloom Filter may cause performance degradation.
 - If the Bloom Filter is too large, it may take longer to build/transmit/filter.


- **MinMax Filter**: Contains the maximum value and the minimum value, thereby filtering data smaller than the minimum value and larger than the maximum value. The filtering effect of MinMax Filter is related to the type of the Key column in the join on clause and the data distribution of the left and right tables.

 - When the type of the Key column in the join on clause is int/bigint/double, etc., in extreme cases, if the maximum and minimum values ​​of the left and right tables are the same, there will be no effect. Otherwise, the maximum value of the right table is smaller than the minimum value of the left table, or the right table is the smallest. If the value is greater than the maximum value in the left table, the effect will be best.

 - When the type of the Key column in the join on clause is varchar, etc., applying MinMax Filter will often lead to performance degradation.

- **IN predicate**: Construct an IN predicate based on all the values ​​of the Key column in the join on clause on the right table, and use the constructed IN predicate to filter on the left table. Compared with Bloom Filter, the construction and application overhead is lower. Performance is often higher when the amount of data in the right table is smaller.

 - When In predicate and other filters are specified at the same time, and the filter value of in does not reach runtime_filter_max_in_num, other filters will be tried to be removed. The reason is that In predicate is a precise filtering condition, which can filter efficiently even without other filters. If used at the same time, other filters will do useless work.

- **Bitmap Filter**:
 - Bitmap filter is currently only used when the subquery in the [in subquery](../../sql-manual/sql-statements/Operators/in) operation returns a bitmap column.

#### 2.runtime_filter_mode
Used to control the transmission range of Runtime Filter between instances.

**Type**: Number (0, 1, 2) or corresponding mnemonic string (OFF, LOCAL, GLOBAL), default 2 (GLOBAL).

**Precautions for use**

LOCAL: Relatively conservative, the constructed Runtime Filter can only be used in the same Fragment on the same instance (the smallest unit of query execution), that is, the Runtime Filter producer (the HashJoinNode that constructs the Filter) and the consumer (the ScanNode that uses the RuntimeFilter) The same Fragment, such as the general scene of broadcast join;

GLOBAL: Relatively radical. In addition to satisfying the scenario of the LOCAL strategy, the Runtime Filter can also be combined and transmitted to different Fragments on different instances via the network. For example, the Runtime Filter producer and consumer are in different Fragments, such as shuffle join.

In most cases, the GLOBAL strategy can optimize queries in a wider range of scenarios, but in some shuffle joins, the cost of generating and merging Runtime Filters exceeds the performance advantage brought to the query, and you can consider changing to the LOCAL strategy.

If the join query involved in the cluster does not improve performance due to Runtime Filter, you can change the setting to OFF to completely turn off the function.

When building and applying Runtime Filters on different Fragments, the reasons and strategies for merging Runtime Filters can be found in [ISSUE 6116](https://github.com/apache/incubator-doris/issues/6116)

#### 3.runtime_filter_wait_time_ms
Waiting for Runtime Filter is time consuming.

**Type**: integer, default 1000, unit ms

**Precautions for use**

After the Runtime Filter is turned on, the ScanNode of the left table will wait for a while for the Runtime Filter assigned to it before scanning the data.

Because it takes time to build and merge the Runtime Filter, ScanNode will try to push down the Runtime Filter that arrives within the waiting time to the storage engine. If the waiting time is exceeded, ScanNode will directly start scanning data using the Runtime Filter that has arrived.

If the Runtime Filter arrives after the ScanNode starts scanning, the ScanNode will not push the Runtime Filter down to the storage engine. Instead, the ScanNode will use an expression to filter the data that has been scanned from the storage engine based on the Runtime Filter. The Runtime Filter will not be applied to the data that has been scanned before. The size of the intermediate data obtained in this way will be larger than the optimal solution, but serious degradation can be avoided.

If the cluster is busy and there are many resource-intensive or long-time-consuming queries on the cluster, consider increasing the waiting time to avoid missing optimization opportunities for complex queries. If the cluster load is light, and there are many small queries on the cluster that only take a few seconds, you can consider reducing the waiting time to avoid an increase of 1s for each query.

#### 4. Bloom Filter length related parameters
Including `runtime_bloom_filter_min_size`, `runtime_bloom_filter_max_size`, `runtime_bloom_filter_size`, used to determine the size (in bytes) of the Bloom Filter data structure used by the Runtime Filter.

**Type**: Integer

**Precautions for use**
Because it is necessary to ensure that the length of the Bloom Filter constructed by each HashJoinNode is the same to be merged, the length of the Bloom Filter is currently calculated in the FE query planning.

If the number of data rows (Cardinality) in the statistics of the right table of the join can be obtained, the optimal size of the Bloom Filter will be estimated based on the Cardinality and rounded to the nearest power of 2 (log value with base 2). If there is no accurate statistics, but enable_sync_runtime_filter_size is turned on, the optimal size of the Bloom Filter will be estimated based on the actual number of data rows at runtime, but there will be some performance overhead caused by runtime statistics.
Finally, if the Cardinality of the right table is still not available, the default Bloom Filter length `runtime_bloom_filter_size` will be used. `runtime_bloom_filter_min_size` and `runtime_bloom_filter_max_size` are used to limit the minimum and maximum lengths of the Bloom Filter that are ultimately used.

Larger Bloom Filters are more effective when processing high-cardinality input sets, but require more memory. If the query needs to filter high cardinality columns (for example, containing millions of different values), you can consider increasing the value of `runtime_bloom_filter_size` for some benchmark tests, which will help make the Bloom Filter filter more accurate, so as to obtain the expected Performance improvement.

The effectiveness of Bloom Filter depends on the data distribution of the query, so it is usually only for some specific queries to additionally adjust the length of the Bloom Filter, rather than global modification, generally only for some long time-consuming queries involving joins between large tables. Only when you need to adjust this query option.

### View Runtime Filter generated by query

The query plan that can be displayed by the `explain` command includes the join on clause information used by each Fragment, as well as comments on the generation and use of the Runtime Filter by the Fragment, so as to confirm whether the Runtime Filter is applied to the desired join on clause.
- The comment contained in the Fragment that generates the Runtime Filter, such as `runtime filters: filter_id[type] <- table.column`.
- Use the comment contained in the fragment of Runtime Filter such as `runtime filters: filter_id[type] -> table.column`.

The query in the following example uses a Runtime Filter with ID RF000.
```
CREATE TABLE test (t1 INT) DISTRIBUTED BY HASH (t1) BUCKETS 2 PROPERTIES("replication_num" = "1");
INSERT INTO test VALUES (1), (2), (3), (4);

CREATE TABLE test2 (t2 INT) DISTRIBUTED BY HASH (t2) BUCKETS 2 PROPERTIES("replication_num" = "1");
INSERT INTO test2 VALUES (3), (4), (5);

EXPLAIN SELECT t1 FROM test JOIN test2 where test.t1 = test2.t2;
+--------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                  |
+--------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                  |
|   OUTPUT EXPRS:                                                                                  |
|     t1[#4]                                                                                       |
|   PARTITION: HASH_PARTITIONED: t1[#1]                                                            |
|                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                      |
|                                                                                                  |
|   VRESULT SINK                                                                                   |
|      MYSQL_PROTOCAL                                                                              |
|                                                                                                  |
|   3:VHASH JOIN(157)                                                                              |
|   |  join op: INNER JOIN(BUCKET_SHUFFLE)[]                                                       |
|   |  equal join conjunct: (t1[#1] = t2[#0])                                                      |
|   |  runtime filters: RF000[min_max] <- t2[#0](3/4/2048), RF001[in_or_bloom] <- t2[#0](3/4/2048) |
|   |  cardinality=3                                                                               |
|   |  vec output tuple id: 3                                                                      |
|   |  output tuple id: 3                                                                          |
|   |  vIntermediate tuple ids: 2                                                                  |
|   |  hash output slot ids: 1                                                                     |
|   |  final projections: t1[#2]                                                                   |
|   |  final project output tuple id: 3                                                            |
|   |  distribute expr lists: t1[#1]                                                               |
|   |  distribute expr lists: t2[#0]                                                               |
|   |                                                                                              |
|   |----1:VEXCHANGE                                                                               |
|   |       offset: 0                                                                              |
|   |       distribute expr lists: t2[#0]                                                          |
|   |                                                                                              |
|   2:VOlapScanNode(150)                                                                           |
|      TABLE: test.test(test), PREAGGREGATION: ON                                                  |
|      runtime filters: RF000[min_max] -> t1[#1], RF001[in_or_bloom] -> t1[#1]                     |
|      partitions=1/1 (test)                                                                       |
|      tablets=2/2, tabletList=61032,61034                                                         |
|      cardinality=4, avgRowSize=0.0, numNodes=1                                                   |
|      pushAggOp=NONE                                                                              |
|                                                                                                  |
| PLAN FRAGMENT 1                                                                                  |
|                                                                                                  |
|   PARTITION: HASH_PARTITIONED: t2[#0]                                                            |
|                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                      |
|                                                                                                  |
|   STREAM DATA SINK                                                                               |
|     EXCHANGE ID: 01                                                                              |
|     BUCKET_SHFFULE_HASH_PARTITIONED: t2[#0]                                                      |
|                                                                                                  |
|   0:VOlapScanNode(151)                                                                           |
|      TABLE: test.test2(test2), PREAGGREGATION: ON                                                |
|      partitions=1/1 (test2)                                                                      |
|      tablets=2/2, tabletList=61041,61043                                                         |
|      cardinality=3, avgRowSize=0.0, numNodes=1                                                   |
|      pushAggOp=NONE                                                                              |
+--------------------------------------------------------------------------------------------------+
-- The line of `runtime filters` above shows that `2:HASH JOIN` of `PLAN FRAGMENT 1` generates min_max with ID RF000 and in_or_bloom with ID RF001,
-- RF000/RF001 are used in `2:VOlapScanNode(150)` to filter unnecessary data when reading `test`.`t1`.

SELECT t1 FROM test JOIN test2 where test.t1 = test2.t2; 
-- Return 2 rows of results [3, 4];

-- Through the query profile (set enable_profile=true;) you can view the detailed information of the internal work of the query,
-- Including whether each Runtime Filter is pushed down, waiting time, 
-- and the total time from prepare to receiving Runtime Filter for OLAP_SCAN_NODE.
RuntimeFilter:  (id  =  1,  type  =  in_or_bloomfilter):
      -  Info:  [IsPushDown  =  true,  RuntimeFilterState  =  READY,  HasRemoteTarget  =  false,  HasLocalTarget  =  true,  Ignored  =  false]
      -  RealRuntimeFilterType:  in
      -  InFilterSize:  3
      -  always_true:  0
      -  expr_filtered_rows:  0
      -  expr_input_rows:  0
-- expr_input_rows and expr_filtered_rows are both 0 because in filter directly filters the data in advance according to the key range without calculating it row by row.

-- In addition, in the OLAP_SCAN_NODE of the profile, you can also view the filtering effect 
-- and time consumption after the Runtime Filter is pushed down.
    -  RowsVectorPredFiltered:  9.320008M  (9320008)
    -  VectorPredEvalTime:  364.39ms
```
