---
{
    "title": "诊断工具",
    "language": "zh-CN",
    "description": "高效好用的性能诊断工具对于数据库系统的调优至关重要，因为这取决于是否能快速定位到存在性能问题的业务 SQL，继而快速定位和解决性能瓶颈，保证数据库系统服务的 SLA。"
}
---

## 概述

高效好用的性能诊断工具对于数据库系统的调优至关重要，因为这取决于是否能快速定位到存在性能问题的业务 SQL，继而快速定位和解决性能瓶颈，保证数据库系统服务的 SLA。

当前，Doris 系统默认将执行时间超过 5 秒的 SQL 认定为慢 SQL，此阈值可通过 `config.qe_slow_log_ms` 进行配置。目前 Doris 提供了以下三种诊断渠道，能够帮助快速定位存在性能问题的慢 SQL，分别如下：

## Doris Manager 日志

Doris Manager 的日志模块提供了慢 SQL 筛选功能。用户可以通过选择特定 FE 节点上的 `fe.audit.log` 来查看慢 SQL。只需在搜索框中输入“slow_query”，即可在页面上展示当前系统的历史慢 SQL 信息，如下图所示：

![Doris Manager 监控与日志](/images/doris-manage-trace-log-2.png)

## Audit Log

当前 Doris FE 提供了四种类型的 Audit Log，包括 `slow_query`、`query`、`load` 和 `stream_load`。Audit Log 除了在安装部署 Manager 服务的集群上通过日志页面访问获取之外，也可以直接访问 FE 所在节点的 `fe/log/fe.audit.log` 文件获取信息。

通过直查 `fe.audit.log` 中的 `slow_query` 标签，可以快速筛选出执行缓慢的查询 SQL，如下所示：

```sql
2024-07-18 11:23:13,042 [slow_query] |Client=127.0.0.1:63510|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=11603|ScanBytes=236667379712|ScanRows=13649979418|ReturnRows=100|StmtId=1689|QueryId=91ff336304f14182-9ca537eee75b3856|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice,     sum(l_quantity) from     customer,     orders,     lineitem where     o_orderkey  in  (         select             l_orderkey         from             lineitem         group  by             l_orderkey  having                 sum(l_quantity)  >  300     )     and  c_custkey  =  o_custkey     and  o_orderkey  =  l_orderkey group  by     c_name,     c_custkey,     o_orderkey,     o_orderdate,     o_totalprice order  by     o_totalprice  desc,     o_orderdate limit  100|CpuTimeMS=918556|ShuffleSendBytes=3267419|ShuffleSendRows=89668|SqlHash=b4e1de9f251214a30188180f37907f7d|peakMemoryBytes=38720935552|SqlDigest=f23c7a7ecff61da33f537b2699e9b053|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:33,043 [slow_query] |Client=127.0.0.1:26672|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8978|ScanBytes=334985555968|ScanRows=10717654374|ReturnRows=100|StmtId=1815|QueryId=6e1fae453cb04d9a-b1e5f94d9cea1885|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=990127|ShuffleSendBytes=59208164|ShuffleSendRows=3651504|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10495660672|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:41,044 [slow_query] |Client=127.0.0.1:26684|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8514|ScanBytes=334986551296|ScanRows=10717654374|ReturnRows=100|StmtId=1833|QueryId=4f91483464ce4aa8-beeed7dcb8675bc8|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=925841|ShuffleSendBytes=59223190|ShuffleSendRows=3651602|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10505123104|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
2024-07-18 11:23:49,044 [slow_query] |Client=127.0.0.1:10748|User=root|Ctl=internal|Db=tpch_sf1000|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=8660|ScanBytes=334987673600|ScanRows=10717654374|ReturnRows=100|StmtId=1851|QueryId=4599cb1bab204f80-ac430dd78b45e3da|IsQuery=true|isNereids=true|feIp=172.21.0.10|Stmt=select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where     s_suppkey = l1.l_suppkey     and o_orderkey = l1.l_orderkey     and o_orderstatus = 'F'     and l1.l_receiptdate > l1.l_commitdate     and exists (         select             *         from             lineitem l2         where                 l2.l_orderkey = l1.l_orderkey           and l2.l_suppkey <> l1.l_suppkey     )     and not exists (         select             *         from             lineitem l3         where                 l3.l_orderkey = l1.l_orderkey           and l3.l_suppkey <> l1.l_suppkey           and l3.l_receiptdate > l3.l_commitdate     )     and s_nationkey = n_nationkey     and n_name = 'SAUDI ARABIA' group by     s_name order by     numwait desc,     s_name limit 100|CpuTimeMS=932664|ShuffleSendBytes=59223178|ShuffleSendRows=3651991|SqlHash=f8a30e4182d72cce3eff6cb385005b1f|peakMemoryBytes=10532849344|SqlDigest=fec5a7136f9375aa968a4de971b994da|cloudClusterName=UNKNOWN|TraceId=|WorkloadGroup=normal|FuzzyVariables=|scanBytesFromLocalStorage=0|scanBytesFromRemoteStorage=0
```

通过 `fe.audit.log` 获取的慢 SQL，使用者可以方便地获取执行时间、扫描行数、返回行数、SQL 语句等详细信息，为进一步重现和定位性能问题奠定了基础。

此外，Audit Log 中还包含 `SqlDigest` 字段（如上述示例中的 `SqlDigest=...`）。该字段是根据 SQL 语句的结构生成的哈希值（去除了具体的参数值）。通过对 `slow_query` 中的 `SqlDigest` 进行聚合分析，可以识别出慢查询的“模式”。这意味着，即使具体的 SQL 语句因参数不同而略有差异，只要结构相同，它们的 `SqlDigest` 就是一致的。

基于 `SqlDigest`，用户可以统计出哪类 SQL 模式出现的频率最高，或者总耗时最长，从而优先针对这些“高频”或“高耗时”的慢查询模式进行优化。这种方法能显著提高慢查询优化的效率，避免陷入逐条分析具体 SQL 的低效工作中。

需要注意的是，`SqlDigest` 本身只是一个哈希值，无法直接阅读。在确定了需要优化的慢查询模式后，还需要结合 Audit Log 中的 `Stmt` 字段来获取该模式对应的具体 SQL 语句内容。进一步地，可以通过 `QueryId` 字段获取该查询的详细 Profile 信息（Profile 的获取与分析将在后续章节详细介绍），从而进行深度的性能分析和优化。

### 慢查询分析示例

以上述 `fe.audit.log` 中的 4 条慢查询日志为例，我们可以看到：

1.  第一条日志（`Time(ms)=11603`）的 `SqlDigest` 为 `f23c7a7ecff61da33f537b2699e9b053`。
2.  后三条日志（`Time(ms)=8978`, `8514`, `8660`）的 `SqlDigest` 均为 `fec5a7136f9375aa968a4de971b994da`。

这表明后三条慢查询虽然执行时间（`Time(ms)`）和部分执行细节略有不同，但它们属于同一种 SQL 模式（结构相同）。

在实际优化场景中，如果我们发现某个 `SqlDigest`（如 `fec5a7136f9375aa968a4de971b994da`）在慢查询日志中反复出现，或者其累计耗时占比很高，那么我们应该优先关注这个模式。

**优化步骤建议：**

1.  **定位业务逻辑**：通过查看该模式下任意一条日志的 `Stmt` 字段：
    ```sql
    select     s_name,     count(*) as numwait from     supplier,     lineitem l1,     orders,     nation where ...
    ```
    我们可以确定具体的 SQL 业务逻辑。

2.  **深度分析**：利用日志中的 `QueryId`（如 `6e1fae453cb04d9a-b1e5f94d9cea1885`）在 Doris 中查找对应的 Query Profile。通过 Profile 可以进一步分析是扫描数据量过大、Join 耗时过长，还是其他原因，从而制定针对性的优化策略（如增加索引、优化 SQL 写法或调整表结构）。

一旦解决了这个模式的问题，所有属于该模式的慢查询都能得到改善。



## audit_log 系统表

Doris 2.1 以后的版本在 `__internal_schema` 数据库下提供了 `audit_log` 系统表，供用户查看 SQL 运行的情况。使用前需要打开全局配置 `set global enable_audit_plugin=true;`（此开关默认关闭）。

```sql
mysql> use __internal_schema;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+-----------------------------+
| Tables_in___internal_schema |
+-----------------------------+
| audit_log                   |
| column_statistics           |
| histogram_statistics        |
| partition_statistics        |
+-----------------------------+
4 rows in set (0.00 sec)

mysql> desc audit_log;
+-------------------+--------------+------+-------+---------+-------+
| Field             | Type         | Null | Key   | Default | Extra |
+-------------------+--------------+------+-------+---------+-------+
| query_id          | varchar(48)  | Yes  | true  | NULL    |       |
| time              | datetime     | Yes  | true  | NULL    |       |
| client_ip         | varchar(128) | Yes  | true  | NULL    |       |
| user              | varchar(128) | Yes  | false | NULL    | NONE  |
| catalog           | varchar(128) | Yes  | false | NULL    | NONE  |
| db                | varchar(128) | Yes  | false | NULL    | NONE  |
| state             | varchar(128) | Yes  | false | NULL    | NONE  |
| error_code        | int          | Yes  | false | NULL    | NONE  |
| error_message     | text         | Yes  | false | NULL    | NONE  |
| query_time        | bigint       | Yes  | false | NULL    | NONE  |
| scan_bytes        | bigint       | Yes  | false | NULL    | NONE  |
| scan_rows         | bigint       | Yes  | false | NULL    | NONE  |
| return_rows       | bigint       | Yes  | false | NULL    | NONE  |
| stmt_id           | bigint       | Yes  | false | NULL    | NONE  |
| is_query          | tinyint      | Yes  | false | NULL    | NONE  |
| frontend_ip       | varchar(128) | Yes  | false | NULL    | NONE  |
| cpu_time_ms       | bigint       | Yes  | false | NULL    | NONE  |
| sql_hash          | varchar(128) | Yes  | false | NULL    | NONE  |
| sql_digest        | varchar(128) | Yes  | false | NULL    | NONE  |
| peak_memory_bytes | bigint       | Yes  | false | NULL    | NONE  |
| stmt              | text         | Yes  | false | NULL    | NONE  |
+-------------------+--------------+------+-------+---------+-------+
```

通过 audit_log 内部表，用户可以查询详细的 SQL 执行信息，进行如慢查询筛选等详细统计分析。

## 总结

Doris Manager 日志，audit log 以及 audit_log 系统表等工具，可以提供慢 SQL 自动或手动筛选过滤，以及细粒度 SQL 执行信息统计分析等能力。这些工具为系统性的性能诊断和调优提供了强大支撑。
