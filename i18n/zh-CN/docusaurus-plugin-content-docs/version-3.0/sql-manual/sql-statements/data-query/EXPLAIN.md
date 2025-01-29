---
{
    "title": "EXPLAIN",
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

## 描述

EXPLAIN 语句用于展示 Doris 对于给定的查询所规划的查询计划。Doris 查询优化器的核心目标在于，针对任意给定的查询，生成一个高效且优化的执行计划。该优化器充分利用统计信息、数据特性以及 Doris 本身的功能优势，例如 HASH JOIN、分区和分桶等，来精心制定执行计划。然而，由于路径搜索的固有理论限制以及优化器实现过程中的实际情况，有时生成的执行计划可能无法达到预期的执行效果。为了进一步提升执行性能，我们的首要任务是深入分析优化器当前生成的执行计划。本文将介绍如何使用 EXPLAIN 语句，以便为后续的优化工作奠定坚实基础。

## 语法

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```

## 必选参数

**<query_block>**

> 需要查看执行计划的查询语句。

## 可选参数

**[VERBOSE]**

> 是否展示明细信息。当指定 VERBOSE 时，展示明细信息。否则，展示简略信息。详细信息包括每个算子上的详细信息，算子使用的 tuple 序号，以及对每个 tuple 的详细说明。

## 返回结果

### 基本概念

为了能够更好的理解 EXPLAIN 所展示的信息，这里先介绍几个 DORIS 执行计划的核心概念。

| 名称      | 解释                                                         |
| :-------- | :----------------------------------------------------------- |
| PLAN      | 执行计划，一个查询会被执行规划器翻译成一个执行计划，之后执行计划会提供给执行引擎执行。 |
| FRAGMENT  | 执行片段。由于 DORIS 是一个分布式执行引擎。一个完整的执行计划会被切分为多个单机的执行片段。一个 FRAGMENT 表是一个完整的单机执行片段。多个 FRAGMENT 组合在一起，构成一个完整的 PLAN。 |
| PLAN NODE | 算子。执行计划的最小单位。一个 FRAGMENT 由多个算子构成。每一个算子负责一个实际的执行逻辑，比如聚合，连接等。 |

### 返回结果结构

Doris EXPLAIN 语句的结果是一个完整的 PLAN。PLAN 内部是按照执行顺序从后到前有序排列的 FRAGMENT。FRAGMENT 内部是按照执行顺序从后到前有序排列的算子（PLAN NODE）。

示例如下：

```sql
+--------------------------------------------------+
| Explain String(Nereids Planner)                  |
+--------------------------------------------------+
| PLAN FRAGMENT 0                                  |
|   OUTPUT EXPRS:                                  |
|     cnt[#10]                                     |
|     cnt[#11]                                     |
|   PARTITION: UNPARTITIONED                       |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   VRESULT SINK                                   |
|      MYSQL_PROTOCAL                              |
|                                                  |
|   7:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 1                                  |
|                                                  |
|   PARTITION: RANDOM                              |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   STREAM DATA SINK                               |
|     EXCHANGE ID: 07                              |
|     UNPARTITIONED                                |
|                                                  |
|   6:VHASH JOIN(354)                              |
|   |  join op: INNER JOIN(BROADCAST)[]            |
|   |  equal join conjunct: cnt[#7] = cnt[#5]      |
|   |  cardinality=1                               |
|   |  vec output tuple id: 8                      |
|   |  vIntermediate tuple ids: 7                  |
|   |  hash output slot ids: 5 7                   |
|   |  distribute expr lists:                      |
|   |  distribute expr lists:                      |
|   |                                              |
|   |----4:VEXCHANGE                               |
|   |       offset: 0                              |
|   |       distribute expr lists:                 |
|   |                                              |
|   5:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 2                                  |
|   ...                                            |
|                                                  |
| PLAN FRAGMENT 3                                  |
|   ...                                            |
+--------------------------------------------------+
```

算子与其孩子节点之间，以虚线连接。当一个算子存在多个孩子时，孩子算子从上之下排布，表示从右至左的关系。以上面的示例为例。6 号算子 VHASH JOIN 的左孩子是 5 号 EXCHANGE 算子，右孩子是 4 号 EXCHANGE 算子。

### Fragment 字段说明

| 名称               | 解释                                     |
| :----------------- | :--------------------------------------- |
| PARTITION          | 展示当前 Fragment 的数据分布情况           |
| HAS_COLO_PLAN_NODE | 当前 fragment 中是否存在 colocate 的算子 |
| Sink               | fragment 数据输出的方式，具体方式见下表  |

Sink 方式

| 名称               | 解释                                                         |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK   | 向下一个 Fragment 输出数据。这里主要包含两行信息。<br /> 第一行：数据发送给哪个下游的 EXCHANGE NODE 节点。<br /> 第二行：数据按照何种方式发送 <br /> -  UNPARTITIONED 下游的每个 instance 都会获得全量的数据。这一般出现在两种情况下。一个是 broadcast join，另外一个是需要单 instance 计算的逻辑，比如全局的 limit，order by 等。<br /> - RANDOM 下游的每个 instance 获得随机的一组数据，不同 instance 之间的数据不重复。<br /> - HASH_PARTITIONED 以后续列出的 slot 为 key 做 hash，将同一个 hash 分片的数据发送到同一个下游的 instance 中。这多用于 partition hash join，两阶段聚合的第二阶段等算子的上游。 |
| RESULT SINK        | 向 FE 发送结果数据。第一行，表名发送数据采用的协议。现在有 MySQL 协议和 arrow 协议 |
| OLAP TABLE SINK    | 向 OLAP 表中写入数据                                         |
| MultiCastDataSinks | 多发算子，下面包含多个 STREAM DATA SINK。每一个 STREAM DATA SINK 都发送全量的数据给下游。 |

### Tuple 信息说明

在使用 VERBOSE 模式时，会输出 Tuple 信息。Tuple 信息描述了一行数据内的 SLOT 信息。包括 SLOT 的类型，nullable 等。

输出的信息包含多个 TupleDescriptor，每个 TupleDescriptor 中又包含多个 SlotDescriptor。示例如下：

```sql
Tuples:
TupleDescriptor{id=0, tbl=t1}
  SlotDescriptor{id=0, col=c1, colUniqueId=0, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
  SlotDescriptor{id=2, col=c3, colUniqueId=2, type=int, nullable=true, isAutoIncrement=false, subColPath=null}    
```

#### TupleDescriptor

| 名称 | 解释                           |
| :--- | :----------------------------- |
| id   | tuple descriptor 的 id         |
| tbl  | tuple 对应的表，如果没有则留空 |

#### SlotDescriptor

| 名称            | 解释                                       |
| :-------------- | :----------------------------------------- |
| id              | slot descriptor 的 id                      |
| col             | slot 对应的列，如果没有则留空              |
| colUniqueId     | slot 对应的列的 unique id，如果没有则为 -1 |
| type            | slot 的类型                                |
| nullable        | slot 对应的数据是否可能为 null             |
| isAutoIncrement | 是否是自增列                               |
| subColPath      | 列中的子列路径，当前只应用于 variant 类型  |

### 算子说明

#### 算子列表

| 名称                  | 解释                                       |
| :-------------------- | :----------------------------------------- |
| AGGREGATE             | 聚合算子                                   |
| ANALYTIC              | 窗口函数算子                               |
| ASSERT NUMBER OF ROWS | 检查下游输出行数算子                       |
| EXCHANGE              | 数据交换接收算子                           |
| MERGING-EXCHANGE      | 带排序和限制输出行数功能的数据交换接收算子 |
| HASH JOIN             | 哈希连接算子                               |
| NESTED LOOP JOIN      | 嵌套循环连接算子                           |
| PartitionTopN         | 分组内数据预过滤算子                       |
| REPEAT_NODE           | 数据重复生成算子                           |
| DataGenScanNode       | 表值函数算子                               |
| EsScanNode            | ES 表扫描算子                              |
| HIVE_SCAN_NODE        | Hive 表扫描算子                            |
| HUDI_SCAN_NODE        | Hudi 表扫描算子                            |
| ICEBERG_SCAN_NODE     | Iceberg 表扫描算子                         |
| PAIMON_SCAN_NODE      | Paimon 表扫描算子                          |
| JdbcScanNode          | Jdbc 表扫描算子                            |
| OlapScanNode          | Olap 表扫描算子                            |
| SELECT                | 过滤算子                                   |
| UNION                 | 集合并集算子                               |
| EXCEPT                | 集合差集算子                               |
| INTERSECT             | 集合交集算子                               |
| SORT                  | 排序算子                                   |
| TOP-N                 | 排序并返回前 N 个结果算子                    |
| TABLE FUNCTION NODE   | 表函数算子（lateral view）                 |

#### 通用字段

| 名称                    | 解释                                                         |
| :---------------------- | :----------------------------------------------------------- |
| limit                   | 限制输出行数                                                 |
| offset                  | 输出前偏移的行数                                             |
| conjuncts               | 对于当前节点的结果做过滤。在 projections 前执行。              |
| projections             | 当前算子结束后，再进行的投影操作。在 conjuncts 后执行。        |
| project output tuple id | 投影之后的输出 tuple，可以通过 tuple desc 看到具体的数据 tuple 内的 slot 排列 |
| cardinality             | 优化器预估的行数                                             |
| distribute expr lists   | 当前节点的孩子节点的原始数据分布方式                         |
| 表达式的 slot id         | slot id 对应的具体 slot 可以在 verbose 模式中的 tuple 列表中找到。通过此列表，可以查看 slot 的类型和 nullable 属性等信息。表现形式是表达式后的`[#5]` |

#### AGGREGATE

| 名称         | 解释                                                         |
| :----------- | :----------------------------------------------------------- |
| （聚合阶段） | 聚合阶段有前后两个词表示。<br /> 第一个词有两个可选，update 和 merge。update 表示本地聚合。merge 表示 全局聚合。<br /> 第二个词表示当前数据是否被序列化。serialize 表示数据处在序列化的状态，finalize 表示已经完成最终计算。 |
| STREAMING    | 只有多阶段聚合的局部聚合算子截断有此标识。表示当前聚合节点可能使用 STREAMING 模式。即透不进行实际计算，直接将输入数据透传给下一阶段的聚合算子。 |
| output       | 当前聚合算子的输出。所有本地预聚合的函数，都会被冠以 partial 前缀 |
| group by     | 聚合的 key                                                   |

#### ANALYTIC

| 名称         | 解释                                                  |
| :----------- | :---------------------------------------------------- |
| functions    | 当前的窗口函数名字                                    |
| partition by | 对应窗口函数中 over 后面的 partition by。开窗表达式。 |
| order by     | 窗内排序的表达式和排序方式                            |
| window       | 窗口范围                                              |

#### ASSERT NUMBER OF ROWS

| 名称 | 解释                               |
| :--- | :--------------------------------- |
| EQ   | 下游的输出必须满足等于此约束的行数 |

#### HASH JOIN

| 名称                  | 解释                                                  |
| :-------------------- | :---------------------------------------------------- |
| join op               | 连接的类型                                            |
| equal join conjunct   | 连接条件中的等值条件                                  |
| other join predicates | 连接条件中，除等值条件外的其他条件                    |
| mark join predicates  | mark join 所使用的条件                                |
| other predicates      | 在 join 执行后的过滤谓词                              |
| runtime filters       | 生成的 runtime filter                                 |
| output slot ids       | 最终输出的 slot 列表                                  |
| hash output slot ids  | hash 连接执行后，执行其他连接条件前，输出的 slot 列表 |
| isMarkJoin            | 是否为 mark join                                      |

#### NESTED LOOP JOIN

| 名称                 | 解释                     |
| :------------------- | :----------------------- |
| join op              | 连接的类型               |
| join conjuncts       | 连接的条件               |
| mark join predicates | mark join 所使用的条件   |
| predicates           | 在 join 执行后的过滤谓词 |
| runtime filters      | 生成的 runtime filter    |
| output slot ids      | 最终输出的 slot 列表     |
| isMarkJoin           | 是否为 mark join         |

#### PartitionTopN

| 名称                 | 解释                                                         |
| :------------------- | :----------------------------------------------------------- |
| functions            | 应用分组过滤优化的窗口函数                                   |
| has global limit     | 是否有全局的 limit 行数限制                                    |
| partition limit      | 分组内的 limit 行数                                            |
| partition topn phase | 当前阶段：TWO_PHASE_GLOBAL_PTOPN：global 阶段，数据按照 partition key shuffle 之后执行 TWO_PHASE_LOCAL_PTOPN：local 阶段，数据按照 partition key shuffle 之前执行 |

#### REPEAT_NODE

| 名称   | 解释                                                         |
| :----- | :----------------------------------------------------------- |
| repeat | 每一行数据会生成重复生成多少行，以及其对应的聚合列 slot id 列表 |
| exprs  | 数据重复后输出数据的表达式列表                               |

#### DataGenScanNode

| 名称                 | 解释       |
| :------------------- | :--------- |
| table value function | 表函数名字 |

#### EsScanNode

| 名称              | 解释                       |
| :---------------- | :------------------------- |
| SORT COLUMN       | 返回结果排序列             |
| LOCAL_PREDICATES  | 在 Doris 内执行的过滤条件  |
| REMOTE_PREDICATES | 在 ES 内执行的过滤条件     |
| ES index/type     | 查询的 ES 的 index 和 type |

#### HIVE_SCAN_NODE

| 名称          | 解释                           |
| :------------ | :----------------------------- |
| inputSplitNum | 扫描的分段数量                 |
| totalFileSize | 扫描的总文件大小               |
| scanRanges    | 扫描分段信息                   |
| partition     | 扫描分区数                     |
| backends      | 每个 BE 需要扫描的具体数据信息 |
| cardinality   | 优化器预估的扫描行数           |
| avgRowSize    | 优化器预估的每行数据平均大小   |
| numNodes      | 当前算子使用的 BE 数量         |
| pushdown agg  | 下压到扫描中的聚合计算         |

#### HUDI_SCAN_NODE

| 名称                 | 解释                           |
| :------------------- | :----------------------------- |
| inputSplitNum        | 扫描的分段数量                 |
| totalFileSize        | 扫描的总文件大小               |
| scanRanges           | 扫描分段信息                   |
| partition            | 扫描分区数                     |
| backends             | 每个 BE 需要扫描的具体数据信息 |
| cardinality          | 优化器预估的扫描行数           |
| avgRowSize           | 优化器预估的每行数据平均大小   |
| numNodes             | 当前算子使用的 BE 数量         |
| pushdown agg         | 下压到扫描中的聚合计算         |
| hudiNativeReadSplits | 使用 native 方式读取的分片数量  |

#### ICEBERG_SCAN_NODE

| 名称                     | 解释                           |
| :----------------------- | :----------------------------- |
| inputSplitNum            | 扫描的分段数量                 |
| totalFileSize            | 扫描的总文件大小               |
| scanRanges               | 扫描分段信息                   |
| partition                | 扫描分区数                     |
| backends                 | 每个 BE 需要扫描的具体数据信息 |
| cardinality              | 优化器预估的扫描行数           |
| avgRowSize               | 优化器预估的每行数据平均大小   |
| numNodes                 | 当前算子使用的 BE 数量         |
| pushdown agg             | 下压到扫描中的聚合计算         |
| icebergPredicatePushdown | 下压给 iceberg api 的过滤条件    |

#### PAIMON_SCAN_NODE

| 名称                   | 解释                           |
| :--------------------- | :----------------------------- |
| inputSplitNum          | 扫描的分段数量                 |
| totalFileSize          | 扫描的总文件大小               |
| scanRanges             | 扫描分段信息                   |
| partition              | 扫描分区数                     |
| backends               | 每个 BE 需要扫描的具体数据信息 |
| cardinality            | 优化器预估的扫描行数           |
| avgRowSize             | 优化器预估的每行数据平均大小   |
| numNodes               | 当前算子使用的 BE 数量         |
| pushdown agg           | 下压到扫描中的聚合计算         |
| paimonNativeReadSplits | 使用 native 方式读取的分片数量  |

#### JdbcScanNode

| 名称  | 解释                 |
| :---- | :------------------- |
| TABLE | 扫描的 JDBC 侧的表名 |
| QUERY | 扫描使用的查询语句   |

#### OlapScanNode

| 名称           | 解释                                                         |
| :------------- | :----------------------------------------------------------- |
| TABLE          | 当前算子扫描的表。表名后面的括号，表明当前命中的同步物化视图的名字 |
| SORT INFO      | 规划出 SCAN 预排序时，有此字段。表明 SCAN 输出采用了局部预排序，和预截断。 |
| SORT LIMIT     | 规划出 SCAN 预排序时，有此字段。表明预截断的截断数据长度。   |
| TOPN OPT       | 规划出 TOP-N Runtime Filter 时，有此字段。                   |
| PREAGGREGATION | 是否开启预聚合，聚合模型和主键模型 MOR 需要关注此字段。当为 ON 时，表名存储层数据以满足上层需求，不需要执行额外的聚合操作。为 OFF 时，会执行额外的聚合操作。 |
| partitions     | 当前扫描的 PARTITION 个数，总 PARTITION 个数，以及扫描的 PARTITION 名字列表 |
| tablets        | 扫描的 TABLET 个数和表的总 TABLET 个数                       |
| tabletList     | 扫描的 TABLET 的列表                                         |
| avgRowSize     | 优化器预估的每行数据大小                                     |
| numNodes       | 当前扫描被分配到的 BE 的个数                                 |
| pushAggOp      | 通过读取 zonemap 元数据返回结果。支持 MIN，MAX，COUNT 三个聚合信息 |

#### UNION

| 名称           | 解释                                                 |
| :------------- | :--------------------------------------------------- |
| constant exprs | 常量表达式列表，输出中将包含这些常量表达式           |
| child exprs    | 孩子的输出通过此表达式列表投影后，作为集合算子的输入 |

#### EXCEPT

| 名称        | 解释                                                 |
| :---------- | :--------------------------------------------------- |
| child exprs | 孩子的输出通过此表达式列表投影后，作为集合算子的输入 |

#### INTERSECT

| 名称        | 解释                                                 |
| :---------- | :--------------------------------------------------- |
| child exprs | 孩子的输出通过此表达式列表投影后，作为集合算子的输入 |

#### SORT

| 名称     | 解释                         |
| :------- | :--------------------------- |
| order by | 排序的键，以及具体的排序顺序 |

#### TABLE FUNCTION NODE

| 名称                  | 解释                                     |
| :-------------------- | :--------------------------------------- |
| table function        | 使用的 table function 的名字             |
| lateral view tuple id | 新生成的列对应的 tuple 的 id             |
| output slot id        | 当前节点经过列裁剪后输出的列的 slot 列表 |

#### TOP-N

| 名称          | 解释                                    |
| :------------ | :-------------------------------------- |
| order by      | 排序的键，以及具体的排序顺序            |
| TOPN OPT      | 命中 topn runtime filter 优化时有此字段 |
| OPT TWO PHASE | 命中 topn 延迟物化时，有此字段          |