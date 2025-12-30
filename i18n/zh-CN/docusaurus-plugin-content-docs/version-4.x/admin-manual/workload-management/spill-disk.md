---
{
    "title": "落盘",
    "language": "zh-CN",
    "description": "Doris 的计算层是一个MPP的架构，所有的计算任务都是在BE的内存中完成的，各个BE之间也是通过内存来完成数据交换，所以内存管理对查询的稳定性有至关重要的影响，从线上查询统计看，有一大部分的查询报错也是跟内存相关。当前越来越多的用户将ETL 数据加工，多表物化视图处理，"
}
---

# 概述

Doris 的计算层是一个MPP的架构，所有的计算任务都是在BE的内存中完成的，各个BE之间也是通过内存来完成数据交换，所以内存管理对查询的稳定性有至关重要的影响，从线上查询统计看，有一大部分的查询报错也是跟内存相关。**当前越来越多的用户将ETL 数据加工，多表物化视图处理，复杂的AdHoc查询**等任务迁移到Doris 上运行，所以，需要将中间操作结果卸载到磁盘上，使那些所需内存量超出每个查询或每个节点限制的查询能够得以执行。具体来说，当处理大型数据集或执行复杂查询时，内存消耗可能会迅速增加，超出单个节点或整个查询处理过程中可用的内存限制。Doris通过将其中的中间结果（如聚合的中间状态、排序的临时数据等）写入磁盘，而不是完全依赖内存来存储这些数据，从而缓解了内存压力。这样做有几个好处：

* 扩展性：允许Doris处理比单个节点内存限制大得多的数据集。
* 稳定性：减少因内存不足导致的查询失败或系统崩溃的风险。
* 灵活性：使得用户能够在不增加硬件资源的情况下，执行更复杂的查询。

为了避免申请内存时触发OOM，Doris 引入了reserve memory机制，这个机制的工作流程如下：

* Doris在执行过程中，会预估每次处理一个Block 需要的内存大小，然后到一个统一的内存管理器中去申请；
* 全局的内存分配器会判断当前内存申请，是否超过了Query、Workload Group或者整个进程的内存限制，如果超过了，那么就返回失败；
* Doris 在收到失败消息时，会将当前Query 挂起，然后选择最大的算子进行落盘，等到落盘结束后，Query再继续执行。

目前支持落盘的算子有：

* Hash Join算子
* 聚合算子
* 排序算子
* CTE

当查询触发落盘时，由于会有额外的硬盘读写操作，查询时间可能会显著增长，建议调大FE Session变量`query_timeout`。同时落盘会有比较大的磁盘IO，建议单独配置一个磁盘目录或者使用SSD磁盘降低查询落盘对正常的导入或者查询的影响。目前查询落盘功能默认关闭。

# 内存管理机制

Doris 的内存管理分为三个级别： 进程级别、WorkloadGroup 级别、Query 级别。

## BE 进程内存配置

整个BE 进程的内存由be.conf中的参数`mem_limit` 控制，一旦Doris 使用的内存超过这个阈值，Doris 就会把当前正在申请内存的Query 取消，同时后台也会有一个定时任务，异步的Kill 一部分 Query来释放内存 或者 释放一些Cache。所以Doris 内部的各种管理操作（比如spill disk ， flush memtable等）需要在快接近这个阈值的时候，就需要运行，尽可能的避免内存达到这个阈值，一旦到达这个阈值，为了避免整个进程OOM，Doris 会采取一些非常暴力的自我保护措施。

当Doris的BE跟其他的进程混部（比如Doris FE 、Kafka、HDFS）的时候，会导致Doris BE 实际可用的内存远小于用户设置的`mem_limit` 导致内部的释放内存机制失效，然后导致Doris 进程被操作系统的OOM Killer 杀死。

当Doris 进程部署在K8S里或者用Cgroup 管理的时候，Doris 会自动感知容器的内存配置。

## Workload group 内存配置

* max\_memory\_percent，意味着当请求在该池中运行时，它们占用的内存绝不会超过总内存的这一百分比，一旦超过那么Query 将会触发落盘或者被Kill。
* min\_memory\_percent，为某个池设置最小内存值，当资源空闲时，可以使用超过MIN\_MEMORY\_PERCENT的内存，但是当内存不足时，系统将按照min\_memory\_percent（最小内存百分比）分配内存，可能会选取一些Query Kill，将Workload Group 的内存使用量降低到min\_memory\_percent，以确保其他Workload Group有足够的内存可用。
* 所有的Workload Group的 MIN\_MEMORY\_PERCENT 之和不能超过 100%，并且 MIN\_MEMORY\_PERCENT 不能大于 MAX\_MEMORY\_PERCENT。
* memory\_low\_watermark: 默认是80%。表示当前workload group的内存使用率低水位线。
* memory\_high\_watermark：默认是95%。表示当前workload group的内存使用率高水位线。workload group的内存使用率大于此值时，reserve memory会失败，触发查询落盘。

## Query 内存管理

### 静态内存分配

Query 运行的内存受exec\_mem\_limit这个参数控制，在query 运行之前用户就需要在session variable 里设置好，运行期间不能够动态修改。

* exec\_mem\_limit，表示一个query 最大可以使用的内存，默认值100G；这个值在3.1 版本之前，默认值是2G，实际偏小，大部分查询都需要超过2G的内存，由于这个参数并没有真正在BE端生效，所以对查询并没有影响；在3.1 版本之后，当查询使用的内存达到这个限制时，查询会被Cancel或者触发落盘，所以在升级之前用户需要把这个默认值改为100G。

### 基于Slot的内存分配

静态内存分配方式，在使用过程中我们发现，很多时候用户不知道一个query 应该分配多少内存，所以经常把exec\_mem\_limit 设置为整个BE 进程内存的一半，也就是整个BE内所有的query 使用的内存都不允许超过整个进程内存的一半，这个功能在这种场景下实际变成了一个类似熔断的功能。当我们要根据内存的大小做一些更精细的策略控制，比如spill disk时，由于这个值太大了，所以不能依赖它来做一些控制。

所以我们基于workload group 实现了一个新的基于slot的内存限制方式，这个策略的原理如下：

* 每个workload group 用户都配置了2个参数，max\_memory\_percent和max\_concurrency，那么就认为整个be 的内存被划分为 max\_concurrency 个slot，每个slot 占用的内存是max\_memory\_percent \* mem\_limit / max\_concurrency。
* 默认情况下，每个query 运行占用1个slot，如果用户想让一个query 使用更多的内存，那么就需要修改`query_slot_count` 的值。
* 由于workload group 的slot的总数是固定的，假如用户调大query\_slot\_count，相当于每个query 占用了更多的slot，那么整个workload group 可同时运行的query的数量就动态减少了，新来的query 就自动排队。

Workload group的slot\_memory\_policy，这个参数可以有3个可选的值：

* none，默认值，表示不启用；在这种方式下，Query 就尽量的使用内存，但是一旦达到Workload Group的上限，就会触发落盘；此时不会根据查询的大小选择。
* fixed，每个query 可以使用的的内存 = `workload group的mem_limit * query_slot_count/ max_concurrency`；这种内存分配策略实际是按照并发，给每个Query 分配了固定的内存。
* dynamic，每个query 可以使用的的内存 = `workload group的mem_limit * query_slot_count/ `​`sum(running query slots)`，它主要是克服了fixed 模式下，会存在有一些slot 没有使用的情况；实际就是把大的查询先落盘。

fixed或者dynamic 都是设置的query的硬限，一旦超过，就会落盘或者kill；而且会覆盖用户设置的静态内存分配的参数。 所以当要设置slot\_memory\_policy时，一定要设置好workload group的max\_concurrency，否则会出现内存不足的问题。

# 落盘

## 开启查询中间结果落盘

### BE配置项

```JavaScript
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```

* spill\_storage\_root\_path：查询中间结果落盘文件存储路径，默认和storage\_root\_path一样。
* spill\_storage\_limit: 落盘文件占用磁盘空间限制。可以配置具体的空间大小（比如100G, 1T）或者百分比，默认是20%。如果spill\_storage\_root\_path配置单独的磁盘，可以设置为100%。这个参数主要是防止落盘占用太多的磁盘空间，导致无法进行正常的数据存储。

修改配置项之后，需要重启BE才能生效。

### FE Session Variable

```JavaScript
set enable_spill=true;
set exec_mem_limit = 10g;
set query_timeout = 3600;
```

* enable\_spill 表示一个query 是否开启落盘，默认关闭；如果开启，在内存紧张的情况下，会触发查询落盘；
* exec\_mem\_limit 表示一个query 使用的最大的内存大小；
* query\_timeout 开启落盘，查询时间可能会显著增加，query\_timeout需要进行调整。

### Workload Group

* `max_`​`memory_`percent 默认workload group 的`max_memory_`percent默认值是100%，可按实际的workload group的数量合理修改。如果只有一个workload group，可以调整为90%。

```Bash
alter workload group normal properties ( 'max_memory_percent'='90%' );
```

* `slot_memory_policy` 设置为`fixed`或者`dynamic`。具体含义参见`基于Slot的内存分配`章节。

```C++
alter workload group normal properties ('slot_memory_policy'='dynamic');
```

## 监测落盘

### 审计日志

FE audit log中增加了`SpillWriteBytesToLocalStorage`和`SpillReadBytesFromLocalStorage`字段，分别表示落盘时写盘和读盘数据总量。

```Plain
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```

### Profile

如果查询过程中触发了落盘，在Query Profile中增加了`Spill` 前缀的一些Counter进行标记和落盘相关counter。以HashJoin时Build HashTable为例，可以看到下面的Counter：

```Bash
PARTITIONED_HASH_JOIN_SINK_OPERATOR  (id=4  ,  nereids_id=179):(ExecTime:  6sec351ms)
      -  Spilled:  true
      -  CloseTime:  528ns
      -  ExecTime:  6sec351ms
      -  InitTime:  5.751us
      -  InputRows:  6.001215M  (6001215)
      -  MemoryUsage:  0.00  
      -  MemoryUsagePeak:  554.42  MB
      -  MemoryUsageReserved:  1024.00  KB
      -  OpenTime:  2.267ms
      -  PendingFinishDependency:  0ns
      -  SpillBuildTime:  2sec437ms
      -  SpillInMemRow:  0
      -  SpillMaxRowsOfPartition:  68.569K  (68569)
      -  SpillMinRowsOfPartition:  67.455K  (67455)
      -  SpillPartitionShuffleTime:  836.302ms
      -  SpillPartitionTime:  131.839ms
      -  SpillTotalTime:  5sec563ms
      -  SpillWriteBlockBytes:  714.13  MB
      -  SpillWriteBlockCount:  1.344K  (1344)
      -  SpillWriteFileBytes:  244.40  MB
      -  SpillWriteFileTime:  350.754ms
      -  SpillWriteFileTotalCount:  32
      -  SpillWriteRows:  6.001215M  (6001215)
      -  SpillWriteSerializeBlockTime:  4sec378ms
      -  SpillWriteTaskCount:  417
      -  SpillWriteTaskWaitInQueueCount:  0
      -  SpillWriteTaskWaitInQueueTime:  8.731ms
      -  SpillWriteTime:  5sec549ms
```

### 系统表

#### backend\_active\_tasks

增加了`SPILL_WRITE_BYTES_TO_LOCAL_STORAGE`和`SPILL_READ_BYTES_FROM_LOCAL_STORAGE`字段，分别表示一个查询目前落盘中间结果写盘数据和读盘数据总量。

```Bash
mysql [information_schema]>select * from backend_active_tasks;
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
2 rows in set (0.00 sec)
```

# 测试

## 测试环境

### 机器配置

测试使用阿里云服务器，具体配置如下。

1FE:

```Bash
16核(vCPU) 32 GiB 200 Mbps ecs.c6.4xlarge
```

3BE:

```Bash
16核(vCPU) 64 GiB 0 Mbps ecs.g6.4xlarge
```

### 测试数据

测试数据使用TPC-DS 10TB作为数据输入，使用阿里云DLF数据源，使用Catalog的方式挂载到Doris 内，SQL 语句如下：

```Bash
CREATE CATALOG dlf PROPERTIES (
"type"="hms",
"hive.metastore.type" = "dlf",
"dlf.proxy.mode" = "DLF_ONLY",
"dlf.endpoint" = "dlf-vpc.cn-beijing.aliyuncs.com",
"dlf.region" = "cn-beijing",
"dlf.uid" = "217316283625971977",
"dlf.catalog.id" = "emr_dev"
);
```

参考官网链接: https://doris.apache.org/zh-CN/docs/dev/benchmark/tpcds

## 测试结果

### 单并发

数据的规模是10TB。内存和数据规模的比例是1:52，整体运行时间28102.386s，能够跑出所有的99条query。未来我们将对更多的算子提供落盘能力（如window function， Intersect等），同时继续优化落盘情况下的性能，降低对磁盘的消耗，提升查询的稳定性。

| Query    | Doris |
| ---------- | ------- |
| query1   | 29092 |
| query2   | 130003 |
| query3   | 96119 |
| query4   | 1199097 |
| query5   | 212719 |
| query6   | 62259 |
| query7   | 209154 |
| query8   | 62433 |
| query9   | 579371 |
| query10  | 54260 |
| query11  | 560169 |
| query12  | 26084 |
| query13  | 228756 |
| query14  | 1137097 |
| query15  | 27509 |
| query16  | 84806 |
| query17  | 288164 |
| query18  | 94770 |
| query19  | 124955 |
| query20  | 30970 |
| query21  | 4333 |
| query22  | 9890 |
| query23  | 1757755 |
| query24  | 399553 |
| query25  | 291474 |
| query26  | 79832 |
| query27  | 175894 |
| query28  | 647497 |
| query29  | 1299597 |
| query30  | 11434 |
| query31  | 106665 |
| query32  | 33481 |
| query33  | 146101 |
| query34  | 84055 |
| query35  | 69885 |
| query36  | 148662 |
| query37  | 21598 |
| query38  | 164746 |
| query39  | 5874 |
| query40  | 51602 |
| query41  | 563 |
| query42  | 93005 |
| query43  | 67769 |
| query44  | 79527 |
| query45  | 26575 |
| query46  | 134991 |
| query47  | 161873 |
| query48  | 153657 |
| query49  | 259387 |
| query50  | 141421 |
| query51  | 158056 |
| query52  | 91392 |
| query53  | 89497 |
| query54  | 124118 |
| query55  | 82584 |
| query56  | 152110 |
| query57  | 83417 |
| query58  | 259580 |
| query59  | 177125 |
| query60  | 161729 |
| query61  | 258058 |
| query62  | 39619 |
| query63  | 91258 |
| query64  | 234882 |
| query65  | 278610 |
| query66  | 90246 |
| query67  | 3939554 |
| query68  | 183648 |
| query69  | 11031 |
| query70  | 137901 |
| query71  | 166454 |
| query72  | 2859001 |
| query73  | 92015 |
| query74  | 336694 |
| query75  | 838989 |
| query76  | 174235 |
| query77  | 174525 |
| query78  | 1956786 |
| query79  | 162259 |
| query80  | 602088 |
| query81  | 16184 |
| query82  | 56292 |
| query83  | 26211 |
| query84  | 11906 |
| query85  | 57739 |
| query86  | 34350 |
| query87  | 173631 |
| query88  | 449003 |
| query89  | 113799 |
| query90  | 30825 |
| query91  | 12239 |
| query92  | 26695 |
| query93  | 275828 |
| query94  | 56464 |
| query95  | 64932 |
| query96  | 48102 |
| query97  | 597371 |
| query98  | 112399 |
| query99  | 64472 |
| Sum      | 28102386 |