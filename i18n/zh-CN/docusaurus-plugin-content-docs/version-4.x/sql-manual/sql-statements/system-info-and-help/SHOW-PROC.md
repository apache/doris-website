---
{
    "title": "SHOW PROC",
    "language": "zh-CN",
    "description": "Proc 系统是 Doris 的一个比较有特色的功能。使用过 Linux 的同学可能比较了解这个概念。在 Linux 系统中，proc 是一个虚拟的文件系统，通常挂载在 /proc 目录下。用户可以通过这个文件系统来查看系统内部的数据结构。"
}
---

## 描述

Proc 系统是 Doris 的一个比较有特色的功能。使用过 Linux 的同学可能比较了解这个概念。在 Linux 系统中，proc 是一个虚拟的文件系统，通常挂载在 /proc 目录下。用户可以通过这个文件系统来查看系统内部的数据结构。比如可以通过 /proc/pid 查看指定 pid 进程的详细情况。

和 Linux 中的 proc 系统类似，Doris 中的 proc 系统也被组织成一个类似目录的结构，根据用户指定的"目录路径（proc 路径）"，来查看不同的系统信息。

proc 系统被设计为主要面向系统管理人员，方便其查看系统内部的一些运行状态。如表的 tablet 状态、集群均衡状态、各种作业的状态等等。是一个非常实用的功能

Doris 中有两种方式可以查看 proc 系统。

1. 通过 Doris 提供的 WEB UI 界面查看，访问地址：`http://FE_IP:FE_HTTP_PORT`
2. 另外一种方式是通过命令

通过 ` SHOW PROC  "/";` 可看到 Doris PROC 支持的所有命令

通过 MySQL 客户端连接 Doris 后，可以执行 SHOW PROC 语句查看指定 proc 目录的信息。proc 目录是以 "/" 开头的绝对路径。

show proc 语句的结果以二维表的形式展现。而通常结果表的第一列的值为 proc 的下一级子目录。

```sql
mysql> show proc "/";
+---------------------------+
| name                      |
+---------------------------+
| auth                      |
| backends                  |
| bdbje                     |
| brokers                   |
| catalogs                  |
| cluster_balance           |
| cluster_health            |
| colocation_group          |
| current_backend_instances |
| current_queries           |
| current_query_stmts       |
| dbs                       |
| diagnose                  |
| frontends                 |
| jobs                      |
| load_error_hub            |
| monitor                   |
| resources                 |
| routine_loads             |
| statistic                 |
| stream_loads              |
| tasks                     |
| transactions              |
| trash                     |
+---------------------------+
23 rows in set (0.00 sec)
```

说明：

1. auth：用户名称及对应的权限信息
2. backends：显示集群中 BE 的节点列表，等同于 [SHOW BACKENDS](../cluster-management/instance-management/SHOW-BACKENDS)        
3. bdbje：查看 bdbje 数据库列表，需要修改 `fe.conf` 文件增加 `enable_bdbje_debug_mode=true` , 然后通过 `sh start_fe.sh --daemon` 启动 `FE` 即可进入 `debug` 模式。进入 `debug` 模式之后，仅会启动 `http server` 和  `MySQLServer` 并打开 `BDBJE` 实例，但不会进入任何元数据的加载及后续其他启动流程，
4. binlog: 查看binlog 相关信息， 包括 binlog记录数、字节数、时间范围等信息。
5. brokers : 查看集群 Broker 节点信息，等同于 [SHOW BROKER](../cluster-management/instance-management/SHOW-BROKER)
6. catalogs : 查看当前已创建的数据目录，等同于 [SHOW CATALOGS](../catalog/SHOW-CATALOG.md)
7. cluster_balance：查看集群均衡情况，具体参照 [数据副本管理](../../../admin-manual/maint-monitor/tablet-repair-and-balance.md)
8. cluster_health : 通过 <code>SHOW PROC '/cluster_health/tablet_health'</code>; 命令可以查看整个集群的副本状态。
9. colocation_group :   该命令可以查看集群内已存在的 Group 信息，具体可以查看 [Colocation Join](../../../query-acceleration/colocation-join) 章节
10. current_backend_instances：显示当前正在执行作业的 be 节点列表
11. current_queries  : 查看正在执行的查询列表，当前正在运行的 SQL 语句。                          
12. current_query_stmts : 返回当前正在执行的 query。
13. dbs：主要用于查看 Doris 集群中各个数据库以及其中的表的元数据信息。这些信息包括表结构、分区、物化视图、数据分片和副本等等。通过这个目录和其子目录，可以清楚的展示集群中的表元数据情况，以及定位一些如数据倾斜、副本故障等问题
14. diagnose : 报告和诊断集群中的常见管控问题，主要包括副本均衡和迁移、事务异常等
15. frontends：显示集群中所有的 FE 节点信息，包括 IP 地址、角色、状态、是否是 master 等，等同于 [SHOW FRONTENDS](../cluster-management/instance-management/SHOW-FRONTENDS)
16. jobs：各类任务的统计信息，可查看指定数据库的 Job 的统计信息，如果 `dbId` = -1, 则返回所有库的汇总信息
17. load_error_hub：Doris 支持将 load 作业产生的错误信息集中存储到一个 error hub 中。然后直接通过 <code>SHOW LOAD WARNINGS;</code> 语句查看错误信息。这里展示的就是 error hub 的配置信息。
18. monitor : 显示的是 FE JVM 的资源使用情况
19. resources : 查看系统资源，普通账户只能看到自己有 USAGE_PRIV 使用权限的资源。只有 root 和 admin 账户可以看到所有的资源。等同于 [SHOW RESOURCES](../cluster-management/compute-management/SHOW-RESOURCES)
20. routine_loads：显示所有的 routine load 作业信息，包括作业名称、状态等
21. statistics：主要用于汇总查看 Doris 集群中数据库、表、分区、分片、副本的数量。以及不健康副本的数量。这个信息有助于我们总体把控集群元信息的规模。帮助我们从整体视角查看集群分片情况，能够快速查看集群分片的健康情况。从而进一步定位有问题的数据分片。
22. stream_loads : 返回当前正在执行的 stream load 任务。
23. tasks :  显示现在各种作业的任务总量，及失败的数量。
24. transactions：用于查看指定 transaction id 的事务详情，等同于 [SHOW TRANSACTION](../transaction/SHOW-TRANSACTION)
25. trash：该语句用于查看 backend 内的垃圾数据占用空间。等同于 [SHOW TRASH](../table-and-view/data-and-status-management/SHOW-TRASH)

##  详细说明
1. /binlog

Binlog 是 Doris 中的一项重要功能，用于记录数据变更，可用于跨集群数据同步（CCR）等场景。通过此命令，管理员可以监控 Binlog 的状态，确保其正常运行并合理规划存储空间。

| 字段名 | 数据类型 | 描述 |
|--------|----------|------|
| Name | 字符串 | 数据库或表的名称。|
| Type | 字符串 | 数据对象的类型， 取值 "db"（数据库）或 "table"（表） |
| Id | 数字 | 数据库ID或表ID |
| Dropped | 布尔值 | 该数据库或表是否已被删除。值为 "true" 表示该对象已从 Doris 中删除，但其 Binlog 记录仍然保留；值为 "false" 表示该对象仍然存在于系统中。即使数据库或表被删除，系统仍然会保留一段时间的 Binlog 记录，直到 TTL 到期或被手动清理 |
| BinlogLength | 数字 | 该数据库或表的二进制日志条目总数 |
| BinlogSize | 数字 | 二进制日志的总大小（字节） |
| FirstBinlogCommittedTime | 数字 | 第一条二进制日志的提交时间戳（Unix时间戳，毫秒） |
| ReadableFirstBinlogCommittedTime | 字符串 | 第一条二进制日志的提交时间（可读格式） |
| LastBinlogCommittedTime | 数字 | 最后一条二进制日志的提交时间戳（Unix时间戳，毫秒） |
| ReadableLastBinlogCommittedTime | 字符串 | 最后一条二进制日志的提交时间（可读格式） |
| BinlogTtlSeconds | 数字 | 二进制日志的生存时间（秒），超过此时间的日志可能会被清理 |
| BinlogMaxBytes | 数字 | 二进制日志的最大大小（字节），超过此大小可能会触发清理 |
| BinlogMaxHistoryNums | 数字 | 保留的二进制日志最大历史记录数，超过此数量可能会触发清理 |

注意事项：
- 只有启用了二进制日志功能的数据库和表才会在此命令的输出中显示
- 对于数据库级别，如果启用了数据库级的二进制日志，则显示数据库的二进制日志信息；否则，显示该数据库下启用了二进制日志的各个表的信息

## 示例

1. 如 "/dbs" 展示所有数据库，而 "/dbs/10002" 展示 id 为 10002 的数据库下的所有表

   ```sql
   mysql> show proc "/dbs/10002";
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | TableId | TableName            | IndexNum | PartitionColumnName | PartitionNum | State  | Type | LastConsistencyCheckTime | ReplicaCount |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   | 10065   | dwd_product_live     | 1        | dt                  | 9            | NORMAL | OLAP | NULL                     | 18           |
   | 10109   | ODS_MR_BILL_COSTS_DO | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10119   | test                 | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   | 10124   | test_parquet_import  | 1        | NULL                | 1            | NORMAL | OLAP | NULL                     | 1            |
   +---------+----------------------+----------+---------------------+--------------+--------+------+--------------------------+--------------+
   4 rows in set (0.00 sec)
   ```

2. 展示集群中所有库表个数相关的信息。

   ```sql
   mysql> show proc '/statistic';
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   | DbId  | DbName               | TableNum | PartitionNum | IndexNum | TabletNum | ReplicaNum |
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   | 10002 | default_cluster:test | 4        | 12           | 12       | 21        | 21         |
   | Total | 1                    | 4        | 12           | 12       | 21        | 21         |
   +-------+----------------------+----------+--------------+----------+-----------+------------+
   2 rows in set (0.00 sec)
   ```

3. 以下命令可以查看集群内已存在的 Group 信息。

   ```sql
   SHOW PROC '/colocation_group';
   
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   | GroupId     | GroupName    | TableIds     | BucketsNum | ReplicationNum | DistCols | IsStable |
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   | 10005.10008 | 10005_group1 | 10007, 10040 | 10         | 3              | int(11)  | true     |
   +-------------+--------------+--------------+------------+----------------+----------+----------+
   ```

   - GroupId：一个 Group 的全集群唯一标识，前半部分为 db id，后半部分为 group id。
   - GroupName：Group 的全名。
   - TabletIds：该 Group 包含的 Table 的 id 列表。
   - BucketsNum：分桶数。
   - ReplicationNum：副本数。
   - DistCols：Distribution columns，即分桶列类型。
   - IsStable：该 Group 是否稳定（稳定的定义，见 `Colocation 副本均衡和修复` 一节）。

4. 通过以下命令可以进一步查看一个 Group 的数据分布情况：

   ```sql
   SHOW PROC '/colocation_group/10005.10008';
   
   +-------------+---------------------+
   | BucketIndex | BackendIds          |
   +-------------+---------------------+
   | 0           | 10004, 10002, 10001 |
   | 1           | 10003, 10002, 10004 |
   | 2           | 10002, 10004, 10001 |
   | 3           | 10003, 10002, 10004 |
   | 4           | 10002, 10004, 10003 |
   | 5           | 10003, 10002, 10001 |
   | 6           | 10003, 10004, 10001 |
   | 7           | 10003, 10004, 10002 |
   +-------------+---------------------+
   ```

   - BucketIndex：分桶序列的下标。
   - BackendIds：分桶中数据分片所在的 BE 节点 id 列表。

5. 显示现在各种作业的任务总量，及失败的数量。

   ```sql
   mysql> show proc '/tasks';
   +-------------------------+-----------+----------+
   | TaskType                | FailedNum | TotalNum |
   +-------------------------+-----------+----------+
   | CREATE                  | 0         | 0        |
   | DROP                    | 0         | 0        |
   | PUSH                    | 0         | 0        |
   | CLONE                   | 0         | 0        |
   | STORAGE_MEDIUM_MIGRATE  | 0         | 0        |
   | ROLLUP                  | 0         | 0        |
   | SCHEMA_CHANGE           | 0         | 0        |
   | CANCEL_DELETE           | 0         | 0        |
   | MAKE_SNAPSHOT           | 0         | 0        |
   | RELEASE_SNAPSHOT        | 0         | 0        |
   | CHECK_CONSISTENCY       | 0         | 0        |
   | UPLOAD                  | 0         | 0        |
   | DOWNLOAD                | 0         | 0        |
   | CLEAR_REMOTE_FILE       | 0         | 0        |
   | MOVE                    | 0         | 0        |
   | REALTIME_PUSH           | 0         | 0        |
   | PUBLISH_VERSION         | 0         | 0        |
   | CLEAR_ALTER_TASK        | 0         | 0        |
   | CLEAR_TRANSACTION_TASK  | 0         | 0        |
   | RECOVER_TABLET          | 0         | 0        |
   | STREAM_LOAD             | 0         | 0        |
   | UPDATE_TABLET_META_INFO | 0         | 0        |
   | ALTER                   | 0         | 0        |
   | INSTALL_PLUGIN          | 0         | 0        |
   | UNINSTALL_PLUGIN        | 0         | 0        |
   | Total                   | 0         | 0        |
   +-------------------------+-----------+----------+
   26 rows in set (0.01 sec)
   ```

6. 显示整个集群的副本状态。

   ```sql
   mysql> show proc '/cluster_health/tablet_health';
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   | DbId     | DbName                    | TabletNum | HealthyNum | ReplicaMissingNum | VersionIncompleteNum | ReplicaRelocatingNum | RedundantNum | ReplicaMissingInClusterNum | ReplicaMissingForTagNum | ForceRedundantNum | ColocateMismatchNum | ColocateRedundantNum | NeedFurtherRepairNum | UnrecoverableNum | ReplicaCompactionTooSlowNum | InconsistentNum | OversizeNum | CloningNum |
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   | 25852112 | default_cluster:bowen     | 1920      | 1920       | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
   | 25342914 | default_cluster:bw        | 128       | 128        | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 0           | 0          |
   | 2575532  | default_cluster:cps       | 1440      | 1440       | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 16          | 0          |
   | 26150325 | default_cluster:db        | 38374     | 38374      | 0                 | 0                    | 0                    | 0            | 0                          | 0                       | 0                 | 0                   | 0                    | 0                    | 0                | 0                           | 0               | 453         | 0          |
   +----------+---------------------------+-----------+------------+-------------------+----------------------+----------------------+--------------+----------------------------+-------------------------+-------------------+---------------------+----------------------+----------------------+------------------+-----------------------------+-----------------+-------------+------------+
   4 rows in set (0.01 sec)
   ```

   查看某个数据库下面的副本状态，如 DbId 为 25852112 的数据库。

   ```sql
   mysql> show proc '/cluster_health/tablet_health/25852112';
   ```

7. 报告和诊断集群管控问题

	```
	MySQL > show proc "/diagnose";
	+-----------------+----------+------------+
	| Item            | ErrorNum | WarningNum |
	+-----------------+----------+------------+
	| cluster_balance | 2        | 0          |
	| Total           | 2        | 0          |
	+-----------------+----------+------------+

	2 rows in set
	```

	查看副本均衡迁移问题

	```sql
	MySQL > show proc "/diagnose/cluster_balance";
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+
	| Item                  | Status | Content                                                                                                     | Detail Cmd                                                          | Suggestion |
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+
	| Tablet Health         | ERROR  | healthy tablet num 691 < total tablet num 1014                                                              | show 	proc "/cluster_health/tablet_health";                          | <null>     |
	| BeLoad Balance        | ERROR  | backend load not balance for tag {"location" : "default"}, low load backends [], high load backends 	[10009] | show proc "/cluster_balance/cluster_load_stat/location_default/HDD" | <null>     |
	| Disk Balance          | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	| Colocate Group Stable | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	| History Tablet Sched  | OK     | <null>                                                                                                      | <null>                                                              | <null>     |
	+-----------------------+--------+-------------------------------------------------------------------------------------------------------------+---------------------------------------------------------------------+------------+

	5 rows in set
	```

## 关键词

    SHOW, PROC 

### 最佳实践

