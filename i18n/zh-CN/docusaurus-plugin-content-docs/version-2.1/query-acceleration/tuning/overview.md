---
{
    "title": "查询调优概述",
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

查询性能调优是一个系统工程，需要从多层次、多维度对数据库系统进行调优。以下是调优流程和方法论概述：

1. 首先，业务人员和数据库运维管理人员（DBA）需要对所使用的系统有全面的了解，这包括业务系统使用的硬件、集群的规模、使用的数据库软件版本，以及具体软件版本所提供的特性等。

2. 其次，一个好用的性能诊断工具是定位性能问题的必要前提。只有高效快速地定位到慢 SQL，才能进行后续的具体 SQL 性能调优。

3. 在进入性能调优环节之后，一些常用的调优工具是必不可少的。这些工具需要提供 SQL 具体执行时的详细信息，以便定位相应的性能瓶颈。

综上所述，性能调优需要从全局视角来观察和审视当前系统的性能状况，能够定位到具体的存在性能问题的业务 SQL，然后运用调优工具发现具体的性能瓶颈，再进行具体的性能调优。

基于上述调优流程和方法论，Apache Doris 在上述各个层面都提供了相应的工具。下文将分别对**性能诊断工具、调优工具、调优流程**三个方面进行介绍。

## 性能诊断工具

高效好用的性能诊断工具对于数据库系统的调优至关重要，因为这关系到是否能快速定位到存在性能问题的业务 SQL，继而快速定位和解决具体的性能瓶颈，保证数据库系统服务的 SLA。

当前，Doris 系统默认将执行时间超过 5s 的 SQL 认定为慢 SQL（这一阈值可通过`config.qe_slow_log_ms` 进行配置）。Doris 提供了两种诊断渠道，能够帮助快速定位存在性能问题的慢 SQL，分别如下：

### Doris Manager 监控与日志

Doris Manager 监控提供了丰富的功能界面，用户可以方便地获取包括集群信息、硬件信息、Doris 版本信息等基础信息，以及 FE / BE 节点信息和 CPU / MEM / IO / NETWORK 等维度的实时监控信息。如下图所示：

![Doris Manager 监控与日志](/images/doris-manage-trace-log-1.png)

在性能监控方面，当前 Manager 提供了基于日志的慢 SQL 定位方式。用户可以通过选择特定 FE 节点上的`fe.audit.log`来查看慢 SQL。只需在搜索框中输入“slow_query”，即可在页面上展示出当前系统的历史慢 SQL 信息，如下图所示：

![Doris Manager 监控与日志](/images/doris-manage-trace-log-2.png)

### 直查 fe.audit.log

当前 Doris FE 提供了四种类型的 Audit Log，包括 `slow_query`、`query`、`load` 和 `stream_load`。Audit Log  除了在安装部署 Manager 服务的集群上通过日志页面访问获取之外，也可以直接访问 FE 所在节点的 `fe/log/fe.audit.log` 文件。

通过直查 `fe.audit.log` 中的 `slow_query` 标签，可以快速筛选出执行缓慢的查询 SQL，如下所示：

```sql
2024-07-18 11:23:13,042 [slow_query] |Client=127.0.0.1:63510|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=11603|ScanBytes=236667379712|ScanRows=13649979418|ReturnRows=100|StmtId=1689|QueryId=91ff336304f14182-9ca537eee75b3856|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice,     sum(l_quantity) from     customer,     orders,     lineitem where     o_orderkey  in  (         select             l_orderkey         from             lineitem         group  by             l_orderkey  having                 sum(l_quantity)  >  300     )     and  c_custkey  =  o_custkey     and  o_orderkey  =  l_orderkey group  by     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice order  by     o_totalprice  desc,     o_orderdate limit  100|CpuTimeMS=918556|ShuffleSendBytes=3267419|ShuffleSendRows=89668|SqlHash=b4e1de9f251214a30188180f37907f7d|peakMemoryBytes=38720935552|SqlDigest=d41d8cd98f00b204e9800998ecf8427e|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:33,043 [slow_query] |Client=127.0.0.1:26672|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8978|ScanBytes=334985555968|ScanRows=10717654374|ReturnRows=100|StmtId=1815|QueryId=6e1fae453cb04d9a-b1e5f94d9cea1885|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=990127|ShuffleSendBytes=59208164|ShuffleSendRows=3651504|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10495660672|SqlDigest=d41d8cd98f00b204e9800998ecf8427e|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:41,044 [slow_query] |Client=127.0.0.1:26684|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8514|ScanBytes=334986551296|ScanRows=10717654374|ReturnRows=100|StmtId=1833|QueryId=4f91483464ce4aa8-beeed7dcb8675bc8|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=925841|ShuffleSendBytes=59223190|ShuffleSendRows=3651602|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10505123104|SqlDigest=d41d8cd98f00b204e9800998ecf8427e|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:49,044 [slow_query] |Client=127.0.0.1:10748|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8660|ScanBytes=334987673600|ScanRows=10717654374|ReturnRows=100|StmtId=1851|QueryId=4599cb1bab204f80-ac430dd78b45e3da|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=932664|ShuffleSendBytes=59223178|ShuffleSendRows=3651991|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10532849344|SqlDigest=d41d8cd98f00b204e9800998ecf8427e|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```

通过 `fe.audit.log` 获取的慢 SQL，使用者可以方便地获取执行时间、扫描行数、返回行数、SQL 语句等详细信息，为进一步重现和定位性能问题奠定了基础。

## 性能调优工具

上述诊断工具已经帮助使用和运维人员定位到具体的慢 SQL。接下来，我们开始对具体的慢 SQL 进行分析和调优。

对于一条具体的慢 SQL 来说，首先需要进行性能瓶颈的分析，以确定具体慢在哪个环节。

SQL 的执行过程大致可以分为计划生成和计划执行两个阶段，这两个部分出现问题都可能导致性能瓶颈的发生。基于此，Doris 提供了两个主要工具，来分别分析计划以及计划的执行性能。下面分别就这两个主要的分析调优工具进行介绍：

### Doris Explain

执行计划是对一条 SQL 具体的执行方式和执行过程的描述。例如，对于一个涉及两表连接的 SQL，执行计划会展示这两张表的访问方式信息、连接方式信息，以及各个操作之间的顺序。

在 Doris 系统中提供了 Explain 工具，它可以展示一个 SQL 的具体执行计划的详细信息。通过对 Explain 输出的计划进行分析，可以帮助使用者定位计划层面的瓶颈，从而针对不同的情况进行执行计划层面的调优。

Doris 提供了多种不同粒度的 Explain 工具，如 Explain Verbose、Explain All Plan、Explain Memo Plan、Explain Shape Plan，分别用于展示最终物理计划、各阶段逻辑计划、基于成本优化过程的计划、计划形态等。

获取 Explain 输出后，业务人员或者 DBA 就可以分析当前计划的性能瓶颈。例如，通过分析执行计划发现 Filter 没有下推到基表，导致没有提前过滤数据，使得参与计算的数据量过多，从而导致性能问题。

又如，两表的 Inner 等值连接中，连接条件一侧的过滤条件没有推导到另外一侧，导致没有对推导一侧的表进行提前过滤，也可能导致性能问题等。此类性能瓶颈都可以通过分析 Explain 的输出来定位和解决。

详细信息请参考[计划调优](../../query-acceleration/tuning/tuning-plan/optimizing-table-schema)

### Doris Profile

此外，还有很多常用的系统级别的调优工具，可以用来辅助定位执行期的性能瓶颈，比如常用的 Linux 下 top / free/ perf/ sar/ iostats 等，都可以用来观察 SQL 运行时系统 CPU/ MEM / IO / NETWORK 状态，以辅助定位性能瓶颈。 

详细信息请参考 [Profile](../../query-acceleration/tuning/query-profile)

## 性能调优流程

如上所述，性能调优作为系统工程，需要一个流程化、分阶段的方法体系，来进行系统化的性能诊断和调优。

Doris 性能调优推荐使用如下流程，并辅助使用上述性能诊断和调优工具，来进行系统化的定位和解决。完整的调优四步流程如下所示：

![性能调优流程](/images/query-tuning-steps.jpg)

### 第一步：使用性能诊断工具进行慢查询定位

针对运行在 Doris 上的业务系统，使用上述性能诊断工具进行 慢 SQL 的定位。

- 如果已经安装了 Doris Manager，推荐使用 Manager 的监控和日志页面，进行可视化的慢查询定位。

- 如果没有安装 Manager，可以直接查看 FE 节点上的 `fe.audit.log`来获取。针对筛选出的慢 SQL 列表，逐一按照优先级和严重程度进行 SQL 级别的调优。

### 第二步：Schema 设计与调优

定位到具体的慢 SQL 之后，优先需要对业务 Schema 设计进行检查与调优，排除因为 Schema 设计不合理导致的性能问题。

Schema 设计调优基本可分为三个方面：

- 表级别 Schema 设计调优，如分区分桶个数和字段调优；

- 索引的设计和调优；

- 特定优化手段的使用，如建立 Colocate Group 等。主要目的是排除因为 Schema 设计不合理或者没有充分利用 Doris 现有优化能力导致的性能问题

详细调优案例请参考文档[计划调优](../../query-acceleration/tuning/tuning-plan/optimizing-table-schema)

### 第三步：计划调优

检查和优化完业务 Schema 后，将进入调优的主体工作，即计划调优与执行调优。如上所述，在性能调优工具中，这个阶段的主要工作是充分利用 Doris 所提供的各种层级的 Explain 工具，对慢 SQL 的执行计划进行系统分析，以找到关键优化点进行针对性优化。

- 针对单表查询和分析场景，可以通过分析执行计划、查看分区裁剪是否正常、是否可以构建单表物化视图进行查询加速等。

- 针对复杂多表分析场景，可以分析统计信息是否正常、分析 Join Order 是否合理、分析 Runtime Filter 是否正常规划等，定位具体的性能瓶颈。如果出现非预期的情况，比如 Join Order 不合理，通过观察 Explain 的结果、手工指定 Join Jint 进行执行计划的绑定、控制 Join 顺序和 Shuffle 方式、控制代价改写行为等操作方法，从而达到调优执行计划的目的。

- 针对部分特定场景，可以通过使用 Doris 提供的高级功能，比如异步物化视图改写、SQL Cache 等来加速查询。

详细调优案例请参考文档[计划调优](../../query-acceleration/tuning/tuning-plan/optimizing-table-schema)。

:::tip 提示

在分析具体性能问题的时候，推荐优先使用 Explain 工具进行执行计划的分析和调优。计划问题解决之后，再利用 Doris 提供的执行调优工具，即 Profile 进行后续执行性能的定位和调优。如果使用工具的顺序颠倒，有可能会导致分析效率低下，不利于快速进行性能问题的定位。

:::

### 第四步：执行调优

在这个阶段，我们需要根据 SQL 的实际运行情况，来验证前几步的调优效果是否显著，或者发现慢 SQL 的新瓶颈点。接着，我们可以按图索骥，找到对应的性能优化方案。

以多表分析的查询为例，我们可以通过分析 Query Profile，来检查 Join 的顺序是否合理，Runtime Filter 是否生效，以及等待时间是否合适。很多时候，执行时的调优更多是为了佐证之前的 Schema 和计划调优是否符合预期。详细的调优案例，请参考[查询 Profile 分析](../../query-acceleration/tuning/query-profile)章节。此外，Query Profile 还能反馈出一些 BE 或机器负载的情况，例如 CPU 占用高、网络卡顿等运行状态问题。在针对这些问题进行调优时，我们需要跳出 Doris 本身，进行操作系统级别的调优。

## 总结

查询调优是一个系统工程，Doris 为用户提供了各个维度的工具，方便从不同层面进行性能问题的诊断、定位、分析与解决。业务人员和 DBA 只需要熟练掌握工具使用，就能更好的发挥 Doris 强大性能优势，更好的适配业务场景进行业务赋能。
