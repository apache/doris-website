---
{
    "title": "Runtime Filter",
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

# Runtime Filter

Runtime Filter 旨在为某些 Join 查询在运行时动态生成过滤条件，来减少扫描的数据量，避免不必要的 I/O 和计算，从而加速查询。

## 名词解释

- 左表：Join 查询时，左边的表。进行 Probe 操作。可被 Join Reorder 调整顺序。

- 右表：Join 查询时，右边的表。进行 Build 操作。可被 Join Reorder 调整顺序。

- Fragment：FE 会将具体的 SQL 语句的执行转化为对应的 Fragment 并下发到 BE 进行执行。BE 上执行对应 Fragment，并将结果汇聚返回给 FE。

- Join on clause: `A join B on A.a=B.b`中的`A.a=B.b`，在查询规划时基于此生成 join conjuncts，包含 join Build 和 Probe 使用的 expr，其中 Build expr 在 Runtime Filter 中称为 src expr，Probe expr 在 Runtime Filter 中称为 target expr。

- rf: Runtime Filter的缩写。

## 原理

Runtime Filter 在查询规划时生成，在 HashJoinNode 中构建，在 ScanNode 中应用。

举个例子，当前存在 T1 表与 T2 表的 Join 查询，它的 Join 方式为 HashJoin，T1 是一张事实表，数据行数为 100000，T2 是一张维度表，数据行数为 2000，Doris join 的实际情况是：

```text
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

显而易见对 T2 扫描数据要远远快于 T1，如果我们主动等待一段时间再扫描 T1，等 T2 将扫描的数据记录交给 HashJoinNode 后，HashJoinNode 根据 T2 的数据计算出一个过滤条件，比如 T2 数据的最大和最小值，或者构建一个 Bloom Filter，接着将这个过滤条件发给等待扫描 T1 的 ScanNode，后者应用这个过滤条件，将过滤后的数据交给 HashJoinNode，从而减少 probe hash table 的次数和网络开销，这个过滤条件就是 Runtime Filter，效果如下：

```text
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

如果能将过滤条件（Runtime Filter）下推到存储引擎，则某些情况下可以利用索引来直接减少扫描的数据量，从而大大减少扫描耗时，效果如下：

```text
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

可见，和谓词下推、分区裁剪不同，Runtime Filter 是在运行时动态生成的过滤条件，即在查询运行时解析 join on clause 确定过滤表达式，并将表达式广播给正在读取左表的 ScanNode，从而减少扫描的数据量，进而减少 probe hash table 的次数，避免不必要的 I/O 和计算。

Runtime Filter 主要用于大表 join 小表的优化。如果左表的数据量太小，rf的提前过滤效果可能不大。如果右表的数据量太大，则在构建和传输rf时会有比较大的成本。

## 使用方式

### Runtime Filter 配置项

默认的配置已经尽可能的适配了大多数场景。仅在某些特定场景下，才需进一步调整以达到最优效果。通常只在性能测试后，针对资源密集型、运行耗时足够长且频率足够高的查询进行优化。
与 Runtime Filter 相关的配置选项，请参阅以下部分：
  - `enable_sync_runtime_filter_size`: 在优化器无法准确估计基数时，令执行器在生成rf之前同步并获取全局的Build端大小总和，根据这个实际大小来决定 IN Or Bloom Filter 的最终类型和 Bloom Filter 的大小。如果设置为 false 则不做同步操作获取全局大小，该变量默认值为 true 。

  - `runtime_filter_max_in_num`: 如果Build端大小大于这个值，我们将不生成 IN predicate。该变量默认值为 1024 。

  - `runtime_filter_mode`: 用于调整 rf 的生成策略，包括 OFF、LOCAL、GLOBAL 三种策略。如果设置为 OFF 则不会生成rf。该变量默认值为 GLOBAL 。

  - `runtime_filter_type`: 允许生成的rf类型，包括 Bloom Filter、MinMax Filter、IN predicate、IN Or Bloom Filter、Bitmap Filter。该变量默认值为 IN_OR_BLOOM_FILTER,MIN_MAX 。

  - `runtime_filter_wait_infinitely`: 如果设置为 true，那么左表的 scan 节点将会一直等待直到接收到 rf 或者查询超超时，相当于 runtime_filter_wait_time_ms 被设置为无限大。该变量默认值为 false 。

  - `runtime_filter_wait_time_ms`: 左表的 ScanNode 等待 rf 的时间。如果超过了等待时间仍然没有收到 rf，则 ScanNode 会先开始扫描数据，后续收到的rf会对此时刻该 ScanNode 还没有返回的数据生效。该变量默认值为 1000 。

  - `runtime_bloom_filter_min_size`: 优化器预估的 rf 中 Bloom Filter 的最小长度，该变量默认值为 1048576（1M）。

  - `runtime_bloom_filter_max_size`: 优化器预估的 rf 中 Bloom Filter 的最大长度，该变量默认值为 16777216（16M）。

  - `runtime_bloom_filter_size`: 优化器预估的 rf 中 Bloom Filter 的默认长度，该变量默认值为 2097152（2M）。

  

下面对查询选项做进一步说明。

**1. runtime_filter_type**

使用的 Runtime Filter 类型。

**类型**: 数字 (1, 2, 4, 8, 16) 或者相对应的助记符字符串 (IN, BLOOM_FILTER, MIN_MAX, IN_OR_BLOOM_FILTER, BITMAP_FILTER)，默认 12(MIN_MAX,IN_OR_BLOOM_FILTER)，使用多个时用逗号分隔，注意需要加引号，或者将任意多个类型的数字相加，例如：

```sql
set runtime_filter_type="BLOOM_FILTER,IN,MIN_MAX";
```

等价于：

```sql
set runtime_filter_type=7;
```

**使用注意事项**

- **IN or Bloom Filter**: 根据右表在执行过程中的真实行数，由系统自动判断使用 IN predicate 还是 Bloom Filter
  
  - 默认在右表数据行数少于 runtime_filter_max_in_num 时会使用 IN predicate，否则使用 Bloom filter。

- **Bloom Filter**: 有一定的误判率，导致过滤的数据比预期少一点，但不会导致最终结果不准确，在大部分情况下 Bloom Filter 都可以提升性能或对性能没有显著影响，但在部分情况下会导致性能降低。

  - Bloom Filter 构建和应用的开销较高，所以当过滤率较低时，或者左表数据量较少时，Bloom Filter 可能会导致性能降低。
  - Bloom Filter 过大，可能会导致构建/传输/过滤耗时较大。
  

- **MinMax Filter**: 包含最大值和最小值，从而过滤小于最小值和大于最大值的数据，MinMax Filter 的过滤效果与 join on clause 中 Key 列的类型和左右表数据分布有关。

  - 当 join on clause 中 Key 列的类型为 int/bigint/double 等时，极端情况下，如果左右表的最大最小值相同则没有效果，反之右表最大值小于左表最小值，或右表最小值大于左表最大值，则效果最好。

  - 当 join on clause 中 Key 列的类型为 varchar 等时，应用 MinMax Filter 往往会导致性能降低。

- **IN predicate**: 根据 join on clause 中 Key 列在右表上的所有值构建 IN predicate，使用构建的 IN predicate 在左表上过滤，相比 Bloom Filter 构建和应用的开销更低，在右表数据量较少时往往性能更高。

  - 当同时指定 In predicate 和其他 filter，并且 in 的过滤数值没达到 runtime_filter_max_in_num 时，会尝试把其他 filter 去除掉。原因是 In predicate 是精确的过滤条件，即使没有其他 filter 也可以高效过滤，如果同时使用则其他 filter 会做无用功。

- **Bitmap Filter**:

  - 当前仅当[in subquery](../../sql-manual/sql-statements/Operators/in)操作中的子查询返回 bitmap 列时会使用 bitmap filter.

**2. runtime_filter_mode**

用于控制 Runtime Filter 在 instance 之间传输的范围。

**类型**: 数字 (0, 1, 2) 或者相对应的助记符字符串 (OFF, LOCAL, GLOBAL)，默认 2(GLOBAL)。

**使用注意事项**

LOCAL：相对保守，构建的 Runtime Filter 只能在同一个 instance（查询执行的最小单元）上同一个 Fragment 中使用，即 Runtime Filter 生产者（构建 Filter 的 HashJoinNode）和消费者（使用 RuntimeFilter 的 ScanNode）在同一个 Fragment，比如 broadcast join 的一般场景；

GLOBAL：相对激进，除满足 LOCAL 策略的场景外，还可以将 Runtime Filter 合并后通过网络传输到不同 instance 上的不同 Fragment 中使用，比如 Runtime Filter 生产者和消费者在不同 Fragment，比如 shuffle join。

大多数情况下 GLOBAL 策略可以在更广泛的场景对查询进行优化，但在有些 shuffle join 中生成和合并 Runtime Filter 的开销超过给查询带来的性能优势，可以考虑更改为 LOCAL 策略。

如果集群中涉及的 join 查询不会因为 Runtime Filter 而提高性能，您可以将设置更改为 OFF，从而完全关闭该功能。

在不同 Fragment 上构建和应用 Runtime Filter 时，需要合并 Runtime Filter 的原因和策略可参阅 [ISSUE 6116(opens new window)](https://github.com/apache/incubator-doris/issues/6116)

**3. runtime_filter_wait_time_ms**

Runtime Filter 的等待耗时。

**类型**: 整数，默认 1000，单位 ms

**使用注意事项**

在开启 Runtime Filter 后，左表的 ScanNode 会为分配给自己的 Runtime Filter 等待一段时间再扫描数据。

因为 Runtime Filter 的构建和合并均需要时间，ScanNode 会尝试将等待时间内到达的 Runtime Filter 下推到存储引擎，如果超过等待时间后，ScanNode 会使用已经到达的 Runtime Filter 直接开始扫描数据。

如果 Runtime Filter 在 ScanNode 开始扫描之后到达，则 ScanNode 不会将该 Runtime Filter 下推到存储引擎，而是对已经从存储引擎扫描上来的数据，在 ScanNode 上基于该 Runtime Filter 使用表达式过滤，之前已经扫描的数据则不会应用该 Runtime Filter，这样得到的中间数据规模会大于最优解，但可以避免严重的劣化。

如果集群比较繁忙，并且集群上有许多资源密集型或长耗时的查询，可以考虑增加等待时间，以避免复杂查询错过优化机会。如果集群负载较轻，并且集群上有许多只需要几秒的小查询，可以考虑减少等待时间，以避免每个查询增加 1s 的延迟。

**4. Bloom Filter 长度相关参数**

包括`runtime_bloom_filter_min_size`、`runtime_bloom_filter_max_size`、`runtime_bloom_filter_size`，用于确定 Runtime Filter 使用的 Bloom Filter 数据结构的大小（以字节为单位）。

**类型**: 整数

**使用注意事项** 因为需要保证每个 HashJoinNode 构建的 Bloom Filter 长度相同才能合并，所以目前在 FE 查询规划时计算 Bloom Filter 的长度。

如果能拿到 join 右表统计信息中的数据行数 (Cardinality)，则会尝试根据 Cardinality 估计 Bloom Filter 的最佳大小，并四舍五入到最接近的 2 的幂 (以 2 为底的 log 值)。如果没有准确的统计信息，但是打开了 enable_sync_runtime_filter_size ，会根据实际运行时的数据行数来估计 Bloom Filter 的最佳大小，但是会有一些运行时统计带来的性能开销。
最后如果仍无法拿到右表的 Cardinality，则会使用默认的 Bloom Filter 长度`runtime_bloom_filter_size`。`runtime_bloom_filter_min_size`和`runtime_bloom_filter_max_size`用于限制最终使用的 Bloom Filter 长度最小和最大值。

更大的 Bloom Filter 在处理高基数的输入集时更有效，但需要消耗更多的内存。假如查询中需要过滤高基数列（比如含有数百万个不同的取值），可以考虑增加`runtime_bloom_filter_size`的值进行一些基准测试，这有助于使 Bloom Filter 过滤的更加精准，从而获得预期的性能提升。

Bloom Filter 的有效性取决于查询的数据分布，因此通常仅对一些特定查询额外调整其 Bloom Filter 长度，而不是全局修改，一般仅在对涉及大表间 join 的某些长耗时查询进行调优时，才需要调整此查询选项。

### 查看 query 生成的 Runtime Filter

`explain`命令可以显示的查询计划中包括每个 Fragment 使用的 join on clause 信息，以及 Fragment 生成和使用 Runtime Filter 的注释，从而确认是否将 Runtime Filter 应用到了期望的 join on clause 上。

- 生成 Runtime Filter 的 Fragment 包含的注释例如`runtime filters: filter_id[type] <- table.column`。

- 使用 Runtime Filter 的 Fragment 包含的注释例如`runtime filters: filter_id[type] -> table.column`。

下面例子中的查询使用了一个 ID 为 RF000 的 Runtime Filter。

```sql
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
-- 上面`runtime filters`的行显示了`PLAN FRAGMENT 1`的`2:HASH JOIN`生成了 ID 为 RF000 的 min_max 和 RF001 的 in_or_bloom，
-- 在`2:VOlapScanNode(150)`使用了 RF000/RF001 用于在读取`test`.`t1`时过滤不必要的数据。

SELECT t1 FROM test JOIN test2 where test.t1 = test2.t2; 
-- 返回 2 行结果 [3, 4];

-- 通过 query 的 profile（set enable_profile=true;）可以查看查询内部工作的详细信息，
-- 包括每个 Runtime Filter 是否下推、等待耗时、以及 OLAP_SCAN_NODE 从 prepare 到接收到 Runtime Filter 的总时长。
RuntimeFilter:  (id  =  1,  type  =  in_or_bloomfilter):
      -  Info:  [IsPushDown  =  true,  RuntimeFilterState  =  READY,  HasRemoteTarget  =  false,  HasLocalTarget  =  true,  Ignored  =  false]
      -  RealRuntimeFilterType:  in
      -  InFilterSize:  3
      -  always_true:  0
      -  expr_filtered_rows:  0
      -  expr_input_rows:  0
-- 这里的 expr_input_rows 和 expr_filtered_rows 均为 0 是因为 in filter 根据 key range 直接提前过滤了数据，没有经过逐行计算。


-- 此外，在 profile 的 OLAP_SCAN_NODE 中还可以查看 Runtime Filter 下推后的过滤效果和耗时。
    -  RowsVectorPredFiltered:  9.320008M  (9320008)
    -  VectorPredEvalTime:  364.39ms
```
