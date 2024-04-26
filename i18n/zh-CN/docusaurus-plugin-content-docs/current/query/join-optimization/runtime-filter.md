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

Runtime Filter 旨在为某些 Join 查询在运行时动态生成过滤条件，来减少扫描的数据量，避免不必要的 I/O 和网络传输，从而加速查询。

## 名词解释

- 左表：Join 查询时，左边的表。进行 Probe 操作。可被 Join Reorder 调整顺序。

- 右表：Join 查询时，右边的表。进行 Build 操作。可被 Join Reorder 调整顺序。

- Fragment：FE 会将具体的 SQL 语句的执行转化为对应的 Fragment 并下发到 BE 进行执行。BE 上执行对应 Fragment，并将结果汇聚返回给 FE。

- Join on clause: `A join B on A.a=B.b`中的`A.a=B.b`，在查询规划时基于此生成 join conjuncts，包含 join Build 和 Probe 使用的 expr，其中 Build expr 在 Runtime Filter 中称为 src expr，Probe expr 在 Runtime Filter 中称为 target expr。

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

可见，和谓词下推、分区裁剪不同，Runtime Filter 是在运行时动态生成的过滤条件，即在查询运行时解析 join on clause 确定过滤表达式，并将表达式广播给正在读取左表的 ScanNode，从而减少扫描的数据量，进而减少 probe hash table 的次数，避免不必要的 I/O 和网络传输。

Runtime Filter 主要用于大表 join 小表的优化，如果左表的数据量太小，或者右表的数据量太大，则 Runtime Filter 可能不会取得预期效果。

## 使用方式

### Runtime Filter 查询选项

与 Runtime Filter 相关的查询选项信息，请参阅以下部分：

- 第一个查询选项是调整使用的 Runtime Filter 类型，大多数情况下，您只需要调整这一个选项，其他选项保持默认即可。
  
  - `runtime_filter_type`: 包括 Bloom Filter、MinMax Filter、IN predicate、IN Or Bloom Filter、Bitmap Filter，默认会使用 IN Or Bloom Filter，部分情况下同时使用 Bloom Filter、MinMax Filter、IN predicate 时性能更高。

- 其他查询选项通常仅在某些特定场景下，才需进一步调整以达到最优效果。通常只在性能测试后，针对资源密集型、运行耗时足够长且频率足够高的查询进行优化。

  - `runtime_filter_mode`: 用于调整 Runtime Filter 的下推策略，包括 OFF、LOCAL、GLOBAL 三种策略，默认设置为 GLOBAL 策略

  - `runtime_filter_wait_time_ms`: 左表的 ScanNode 等待每个 Runtime Filter 的时间，默认 1000ms

  - `runtime_filters_max_num`: 每个查询可应用的 Runtime Filter 中 Bloom Filter 的最大数量，默认 10

  - `runtime_bloom_filter_min_size`: Runtime Filter 中 Bloom Filter 的最小长度，默认 1048576（1M）

  - `runtime_bloom_filter_max_size`: Runtime Filter 中 Bloom Filter 的最大长度，默认 16777216（16M）

  - `runtime_bloom_filter_size`: Runtime Filter 中 Bloom Filter 的默认长度，默认 2097152（2M）

  - `runtime_filter_max_in_num`: 如果 join 右表数据行数大于这个值，我们将不生成 IN predicate，默认 1024
  
  - `runtime_filter_wait_infinitely`: 如果参数为 true，那么左表的scan节点将会一直等待直到接收到 runtime filer或者查询超超时，默认为false

下面对查询选项做进一步说明。

**1. runtime_filter_type**

使用的 Runtime Filter 类型。

**类型**: 数字(1, 2, 4, 8, 16)或者相对应的助记符字符串(IN, BLOOM_FILTER, MIN_MAX, IN_OR_BLOOM_FILTER, BITMAP_FILTER)，默认12(MIN_MAX,IN_OR_BLOOM_FILTER)，使用多个时用逗号分隔，注意需要加引号，或者将任意多个类型的数字相加，例如:

```sql
set runtime_filter_type="BLOOM_FILTER,IN,MIN_MAX";
```

等价于：

```sql
set runtime_filter_type=7;
```

**使用注意事项**

- **IN or Bloom Filter**: 根据右表在执行过程中的真实行数，由系统自动判断使用 IN predicate 还是 Bloom Filter
  
  - 默认在右表数据行数少于 102400 时会使用 IN predicate（可通过 session 变量中的`runtime_filter_max_in_num`调整），否则使用 Bloom filter。

- **Bloom Filter**: 有一定的误判率，导致过滤的数据比预期少一点，但不会导致最终结果不准确，在大部分情况下 Bloom Filter 都可以提升性能或对性能没有显著影响，但在部分情况下会导致性能降低。

  - Bloom Filter 构建和应用的开销较高，所以当过滤率较低时，或者左表数据量较少时，Bloom Filter 可能会导致性能降低。

  - 目前只有左表的 Key 列应用 Bloom Filter 才能下推到存储引擎，而测试结果显示 Bloom Filter 不下推到存储引擎时往往会导致性能降低。

  - 目前 Bloom Filter 仅在 ScanNode 上使用表达式过滤时有短路 (short-circuit) 逻辑，即当假阳性率过高时，不继续使用 Bloom Filter，但当 Bloom Filter 下推到存储引擎后没有短路逻辑，所以当过滤率较低时可能导致性能降低。

- **MinMax Filter**: 包含最大值和最小值，从而过滤小于最小值和大于最大值的数据，MinMax Filter 的过滤效果与 join on clause 中 Key 列的类型和左右表数据分布有关。

  - 当 join on clause 中 Key 列的类型为 int/bigint/double 等时，极端情况下，如果左右表的最大最小值相同则没有效果，反之右表最大值小于左表最小值，或右表最小值大于左表最大值，则效果最好。

  - 当 join on clause 中 Key 列的类型为 varchar 等时，应用 MinMax Filter 往往会导致性能降低。

- **IN predicate**: 根据 join on clause 中 Key 列在右表上的所有值构建 IN predicate，使用构建的 IN predicate 在左表上过滤，相比 Bloom Filter 构建和应用的开销更低，在右表数据量较少时往往性能更高。

  - 目前 IN predicate 已实现合并方法。

  - 当同时指定 In predicate 和其他 filter，并且 in 的过滤数值没达到 runtime_filter_max_in_num 时，会尝试把其他 filter 去除掉。原因是 In predicate 是精确的过滤条件，即使没有其他 filter 也可以高效过滤，如果同时使用则其他 filter 会做无用功。目前仅在 Runtime filter 的生产者和消费者处于同一个 fragment 时才会有去除非 in filter 的逻辑。

- **Bitmap Filter**:

  - 当前仅当[in subquery](../../sql-manual/sql-reference/Operators/in.md)操作中的子查询返回 bitmap 列时会使用 bitmap filter.

  - 当前仅在向量化引擎中支持 bitmap filter.

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

在开启 Runtime Filter 后，左表的 ScanNode 会为每一个分配给自己的 Runtime Filter 等待一段时间再扫描数据，即如果 ScanNode 被分配了 3 个 Runtime Filter，那么它最多会等待 3000ms。

因为 Runtime Filter 的构建和合并均需要时间，ScanNode 会尝试将等待时间内到达的 Runtime Filter 下推到存储引擎，如果超过等待时间后，ScanNode 会使用已经到达的 Runtime Filter 直接开始扫描数据。

如果 Runtime Filter 在 ScanNode 开始扫描之后到达，则 ScanNode 不会将该 Runtime Filter 下推到存储引擎，而是对已经从存储引擎扫描上来的数据，在 ScanNode 上基于该 Runtime Filter 使用表达式过滤，之前已经扫描的数据则不会应用该 Runtime Filter，这样得到的中间数据规模会大于最优解，但可以避免严重的裂化。

如果集群比较繁忙，并且集群上有许多资源密集型或长耗时的查询，可以考虑增加等待时间，以避免复杂查询错过优化机会。如果集群负载较轻，并且集群上有许多只需要几秒的小查询，可以考虑减少等待时间，以避免每个查询增加 1s 的延迟。

**4. runtime_filters_max_num**

每个查询生成的 Runtime Filter 中 Bloom Filter 数量的上限。

**类型**: 整数，默认 10

**使用注意事项** 目前仅对 Bloom Filter 的数量进行限制，因为相比 MinMax Filter 和 IN predicate，Bloom Filter 构建和应用的代价更高。

如果生成的 Bloom Filter 超过允许的最大数量，则保留选择性大的 Bloom Filter，选择性大意味着预期可以过滤更多的行。这个设置可以防止 Bloom Filter 耗费过多的内存开销而导致潜在的问题。

```text
选择性=(HashJoinNode Cardinality / HashJoinNode left child Cardinality)
-- 因为目前 FE 拿到 Cardinality 不准，所以这里 Bloom Filter 计算的选择性与实际不准，因此最终可能只是随机保留了部分 Bloom Filter。
```

仅在对涉及大表间 join 的某些长耗时查询进行调优时，才需要调整此查询选项。

**5. Bloom Filter 长度相关参数**

包括`runtime_bloom_filter_min_size`、`runtime_bloom_filter_max_size`、`runtime_bloom_filter_size`，用于确定 Runtime Filter 使用的 Bloom Filter 数据结构的大小（以字节为单位）。

**类型**: 整数

**使用注意事项** 因为需要保证每个 HashJoinNode 构建的 Bloom Filter 长度相同才能合并，所以目前在 FE 查询规划时计算 Bloom Filter 的长度。

如果能拿到 join 右表统计信息中的数据行数 (Cardinality)，会尝试根据 Cardinality 估计 Bloom Filter 的最佳大小，并四舍五入到最接近的 2 的幂 (以 2 为底的 log 值)。如果无法拿到右表的 Cardinality，则会使用默认的 Bloom Filter 长度`runtime_bloom_filter_size`。`runtime_bloom_filter_min_size`和`runtime_bloom_filter_max_size`用于限制最终使用的 Bloom Filter 长度最小和最大值。

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
+-------------------------------------------------------------------+
| Explain String                                                    |
+-------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                   |
|  OUTPUT EXPRS:`t1`                                                |
|                                                                   |
|   4:EXCHANGE                                                      |
|                                                                   |
| PLAN FRAGMENT 1                                                   |
|  OUTPUT EXPRS:                                                    |
|   PARTITION: HASH_PARTITIONED: `default_cluster:ssb`.`test`.`t1`  |
|                                                                   |
|   2:HASH JOIN                                                     |
|   |  join op: INNER JOIN (BUCKET_SHUFFLE)                         |
|   |  equal join conjunct: `test`.`t1` = `test2`.`t2`              |
|   |  runtime filters: RF000[in] <- `test2`.`t2`                   |
|   |                                                               |
|   |----3:EXCHANGE                                                 |
|   |                                                               |
|   0:OlapScanNode                                                  |
|      TABLE: test                                                  |
|      runtime filters: RF000[in] -> `test`.`t1`                    |
|                                                                   |
| PLAN FRAGMENT 2                                                   |
|  OUTPUT EXPRS:                                                    |
|   PARTITION: HASH_PARTITIONED: `default_cluster:ssb`.`test2`.`t2` |
|                                                                   |
|   1:OlapScanNode                                                  |
|      TABLE: test2                                                 |
+-------------------------------------------------------------------+
-- 上面`runtime filters`的行显示了`PLAN FRAGMENT 1`的`2:HASH JOIN`生成了 ID 为 RF000 的 IN predicate，
-- 其中`test2`.`t2`的 key values 仅在运行时可知，
-- 在`0:OlapScanNode`使用了该 IN predicate 用于在读取`test`.`t1`时过滤不必要的数据。

SELECT t1 FROM test JOIN test2 where test.t1 = test2.t2; 
-- 返回 2 行结果 [3, 4];

-- 通过 query 的 profile（set enable_profile=true;）可以查看查询内部工作的详细信息，
-- 包括每个 Runtime Filter 是否下推、等待耗时、以及 OLAP_SCAN_NODE 从 prepare 到接收到 Runtime Filter 的总时长。
RuntimeFilter:in:
    -  HasPushDownToEngine:  true
    -  AWaitTimeCost:  0ns
    -  EffectTimeCost:  2.76ms

-- 此外，在 profile 的 OLAP_SCAN_NODE 中还可以查看 Runtime Filter 下推后的过滤效果和耗时。
    -  RowsVectorPredFiltered:  9.320008M  (9320008)
    -  VectorPredEvalTime:  364.39ms
```

## Runtime Filter 的规划规则

1. 只支持对 join on clause 中的等值条件生成 Runtime Filter，不包括 Null-safe 条件，因为其可能会过滤掉 join 左表的 null 值。

2. 不支持将 Runtime Filter 下推到 left outer、full outer、anti join 的左表；

3. 不支持 src expr 或 target expr 是常量；

4. 不支持 src expr 和 target expr 相等；

5. 不支持 src expr 的类型等于`HLL`或者`BITMAP`；

6. 目前仅支持将 Runtime Filter 下推给 OlapScanNode；

7. 不支持 target expr 包含 NULL-checking 表达式，比如`COALESCE/IFNULL/CASE`，因为当 outer join 上层其他 join 的 join on clause 包含 NULL-checking 表达式并生成 Runtime Filter 时，将这个 Runtime Filter 下推到 outer join 的左表时可能导致结果不正确；

8. 不支持 target expr 中的列（slot）无法在原始表中找到某个等价列；

9. 不支持列传导，这包含两种情况：

   - 一是例如 join on clause 包含 A.k = B.k and B.k = C.k 时，目前 C.k 只可以下推给 B.k，而不可以下推给 A.k；

   - 二是例如 join on clause 包含 A.a + B.b = C.c，如果 A.a 可以列传导到 B.a，即 A.a 和 B.a 是等价的列，那么可以用 B.a 替换 A.a，然后可以尝试将 Runtime Filter 下推给 B（如果 A.a 和 B.a 不是等价列，则不能下推给 B，因为 target expr 必须与唯一一个 join 左表绑定）；

10. Target expr 和 src expr 的类型必须相等，因为 Bloom Filter 基于 hash，若类型不等则会尝试将 target expr 的类型转换为 src expr 的类型；

11. 不支持`PlanNode.Conjuncts`生成的 Runtime Filter 下推，与 HashJoinNode 的`eqJoinConjuncts`和`otherJoinConjuncts`不同，`PlanNode.Conjuncts`生成的 Runtime Filter 在测试中发现可能会导致错误的结果，例如`IN`子查询转换为 join 时，自动生成的 join on clause 将保存在`PlanNode.Conjuncts`中，此时应用 Runtime Filter 可能会导致结果缺少一些行。
