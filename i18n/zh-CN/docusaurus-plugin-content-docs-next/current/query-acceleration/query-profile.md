---
{
    "title": "Query Profile 分析指南：定位 Doris 慢查询性能瓶颈",
    "language": "zh-CN",
    "description": "如何通过 Apache Doris Query Profile 采集、查看与解读查询执行细节？本文覆盖架构、参数配置、获取方式与瓶颈定位方法。",
    "keywords": ["Doris Query Profile", "查询性能分析", "慢查询定位", "Profile 解读", "MergedProfile", "DetailProfile", "enable_profile", "profile_level"]
}
---

<!-- 知识类型：概念 + 操作指南 -->
<!-- 适用场景：Apache Doris 用户排查慢查询、分析执行计划、定位算子瓶颈 -->

# Query Profile 分析指南

## 概述

<!-- 知识类型：概念定义 -->
<!-- 适用场景：初次接触 Query Profile -->

Query Profile 是 Apache Doris 用于展示查询执行细节的诊断工具，可以记录每个算子的耗时、行数、内存等关键指标，帮助用户快速定位慢查询瓶颈。

阅读前请检查以下要点：

- [ ] 已部署 Apache Doris 集群，并具备 FE 配置文件 `fe.conf` 修改权限。
- [ ] 已通过 MySQL 客户端连接 Doris，可以执行 `show query profile` 等命令。
- [ ] 了解基本的查询计划（Fragment、PlanNode）概念。

本文主要包含三部分内容：

| 章节 | 内容 |
| --- | --- |
| 整体架构 | Profile 如何从 BE 收集并在 FE 存储 |
| 参数配置 | 如何配置以过滤无用信息，专注关键查询细节 |
| 解读方法 | 如何快速定位影响查询性能的算子 |

## Query Profile 的整体架构

<!-- 知识类型：架构原理 -->
<!-- 适用场景：理解 Profile 采集流程、排查上报失败 -->

![Query Profile 整体架构](/images/profile/profile-image-0.png)

Query Profile 的核心由两部分组成：FE 的 `ProfileManager` 与 BE 的 `AsyncReportThreadPool`。

### 采集流程

| 步骤 | 角色 | 动作 |
| --- | --- | --- |
| 1 | FE | 用户发起查询，FE 将 Profile 数据结构注册到 `ProfileManager` |
| 2 | BE | 查询完成后，将自身 Profile 注册为异步上报任务 |
| 3 | BE | `AsyncReportThreadPool` 以查询为粒度发起 RPC，将 Profile 发送到 FE |
| 4 | FE | 后台线程处理 Profile，按策略保留与淘汰，并将合适的 Profile 压缩后写入存储 |
| 5 | 用户 | 通过 Web UI 或 curl HTTP 请求查看 Profile |
| 6 | FE | `ProfileManager` 从内存或外部存储中查找 Profile，并以文本形式返回 |

整个流程中，**第二步的异步汇报**与**第四步的 Profile 持久化**对 Profile 功能影响最大。

### 异步汇报超时

集群压力较大时，异步汇报可能超时。为避免 FE 占用过多内存，`ProfileManager` 会在等待一段时间后放弃超时的 Profile。

- 调整方式：修改 `fe.conf` 中的 `profile_async_collect_expire_time_secs` 控制等待时长。
- 应对建议：若频繁超时，建议优先检查机器资源使用率；必要时关闭全局 Profile 以降低风险。

### Profile 持久化的收益

`ProfileManager` 把 Profile 持久化到磁盘后，可以确保：

1. Profile 不再占据 FE 的大量内存。
2. FE 重启后依然能够查询到之前的 Profile。

前者使 FE 能够保留数千份完整 Profile；后者便于对比集群升级前后的表现，从而验证版本升级是否提升 Doris 查询性能。

## 配置 Profile

<!-- 知识类型：参数配置 -->
<!-- 适用场景：开启/关闭 Profile、控制采集粒度与存储 -->

### 参数速查表

| 参数 | 作用域 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enable_profile` | Session/Global | `false` | 是否生成 Profile |
| `profile_level` | Session/Global | `1` | Profile 详细等级（1~3，4.0+ 生效） |
| `auto_profile_threshold_ms` | Global | `-1` | 仅对耗时超过阈值的查询生成 Profile（3.0+ 生效） |
| `max_query_profile_num` | `fe.conf` | `500` | FE 内存中最多保留的 Profile 数量 |
| `max_spilled_profile_num` | `fe.conf` | `500` | 磁盘上最多保留的 Profile 数量 |
| `spilled_profile_storage_path` | `fe.conf` | `log/profile` | Profile 在本地的存储目录 |
| `spilled_profile_storage_limit_bytes` | `fe.conf` | `1 GB` | 磁盘上 Profile 的总存储空间上限 |

### 开启 Profile

#### enable_profile

- 目的：控制是否生成 Profile。
- 命令：`set enable_profile=true;`
- 说明：默认 `false`，关闭时执行 `show query profile` 不会返回新生成的记录。

```sql
mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.00 sec)

mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| 74b9e30d6ba7491d-9dbf9289f6f5c208 | QUERY     | 2025-02-26 18:47:07 | 2025-02-26 18:47:07 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
1 row in set (0.01 sec)

mysql> set enable_profile=false;
--------------
set enable_profile=false
--------------

Query OK, 0 rows affected (0.00 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.01 sec)

mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| 74b9e30d6ba7491d-9dbf9289f6f5c208 | QUERY     | 2025-02-26 18:47:07 | 2025-02-26 18:47:07 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
1 row in set (0.00 sec)
```

#### profile_level

- 目的：控制 Profile 的详细程度。
- 命令：`set profile_level=2;`
- 说明：默认值为 `1`。**该参数在 4.0 及 master 分支生效，不要在 4.0 版本之前使用，4.0 之前有不同的语义。**

| Level | 行为 | 性能影响 |
| --- | --- | --- |
| 1（默认） | BE 仅汇报精简版 Profile，足以在 FE 聚合为 MergedProfile | 最小 |
| 2 | 输出更详细的 Counter，便于深入分析 | 较小 |
| 3 | 最大粒度，部分 Counter 的采集可能影响查询性能 | 较大 |

例：默认情况下，`EXCHANGE_OPERATOR` 的 Counter 如下：

```text
EXCHANGE_OPERATOR(id=1):
     - InstanceID: ef33b72e30b84b68-82ad027edbee5910
     - BlocksProduced: 1
     - CloseTime: 4.243us
     - ExecTime: 30.834us
     - InitTime: 20.902us
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.93us
     - ProjectionTime: 0ns
     - RowsProduced: 10
     - WaitForDependencyTime: 0ns
       - WaitForData0: 635.324us
```

当 `profile_level=2` 时，可以看到更详细的 Counter：

```text
EXCHANGE_OPERATOR(id=1):
     - InstanceID: 514023de1b7b41a3-9e59e43c591103a2
     - BlocksProduced: 1
     - CloseTime: 3.523us
     - CreateMergerTime: 0ns
     - DataArrivalWaitTime: 0ns
     - DecompressBytes: 0.00 
     - DecompressTime: 0ns
     - DeserializeRowBatchTimer: 0ns
     - ExecTime: 28.439us
     - FilterTime: 287ns
     - FirstBatchArrivalWaitTime: 0ns
     - GetDataFromRecvrTime: 3.482us
     - InitTime: 18.258us
     - LocalBytesReceived: 36.00 KB
     - MaxFindRecvrTime(NS): 0
     - MaxWaitForWorkerTime: 0
     - MaxWaitToProcessTime: 0
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.44us
     - ProjectionTime: 0ns
     - RemoteBytesReceived: 0.00 
     - RowsProduced: 10
     - SendersBlockedTotalTimer(*): 0ns
     - WaitForDependencyTime: 0ns
       - WaitForData0: 596.708us
```

#### auto_profile_threshold_ms

- 目的：仅对耗时超过阈值的查询生成 Profile，避免小查询淹没慢查询的 Profile。
- 命令：`set global auto_profile_threshold_ms=1000;`
- 说明：默认 `-1`，表示所有查询都会生成 Profile。该参数在 3.0 及之后版本生效。

为什么需要该参数？全局开启 Profile 会产生大量数据，占用 FE CPU、内存与磁盘，并影响时延敏感的小查询，因此 FE 会定期清理 Profile。该参数可以确保慢查询的 Profile 不被淹没。

例：假设我们开启了全局 Profile，所有查询都会生成 Profile。

```sql
mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| d59b04f636e49c0-bf6b6b3011c40f67  | QUERY     | 2025-02-26 18:25:59 | 2025-02-26 18:25:59 | 3ms   | EOF        | root | internal        | tpcds      | select 1      |
| f2ccb78011aa4526-9919ee76af1e57d7 | QUERY     | 2025-02-26 18:25:59 | 2025-02-26 18:25:59 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| a8464728ebf5481d-864e3016ad22f045 | QUERY     | 2025-02-26 18:25:58 | 2025-02-26 18:25:58 | 6ms   | EOF        | root | internal        | tpcds      | select 1      |
| 912b09ea8f634c47-89e65d4fe354a94b | QUERY     | 2025-02-26 18:25:58 | 2025-02-26 18:25:58 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| e6e6f0a3a31640bc-ad5994de0334ae8d | QUERY     | 2025-02-26 18:25:57 | 2025-02-26 18:25:57 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| b28da27b4cc847a7-82e239320d6facc5 | QUERY     | 2025-02-26 18:25:57 | 2025-02-26 18:25:57 | 4ms   | EOF        | root | internal        | tpcds      | select 1      |
| fec3cdcd4664408c-a38508ce3a2bbe32 | QUERY     | 2025-02-26 18:24:48 | 2025-02-26 18:24:48 | 6ms   | EOF        | root | internal        | tpcds      | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
7 rows in set (0.00 sec)
```

如果希望不再生成这些小查询的 Profile，可按如下步骤操作：

```sql
mysql> clean all profile;
--------------
clean all profile
--------------

Query OK, 0 rows affected (0.01 sec)

mysql> set global auto_profile_threshold_ms=1000;
--------------
set global auto_profile_threshold_ms=1000
--------------

Query OK, 0 rows affected (0.01 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.05 sec)

mysql> select 1;
--------------
select 1
--------------

+------+
| 1    |
+------+
|    1 |
+------+
1 row in set (0.01 sec)

mysql> show query profile;
--------------
show query profile
--------------

Empty set (0.00 sec)
```

### 配置 Profile 存储

Doris 支持将 Profile 持久化到 FE 本地磁盘以保存更多记录。可在 `fe.conf` 中通过以下参数控制：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `max_query_profile_num` | `500` | FE 内存中最多保留的 Profile 数量，超过后从最早的开始淘汰 |
| `max_spilled_profile_num` | `500` | 磁盘上最多保留的 Profile 数量，超过后从最早的开始删除 |
| `spilled_profile_storage_path` | `log/profile` | Profile 在本地的存储目录 |
| `spilled_profile_storage_limit_bytes` | `1 GB` | 磁盘上保留的 Profile 的总存储空间上限 |

## 获取 Profile

<!-- 知识类型：操作指南 -->
<!-- 适用场景：查看历史 Profile、远程下载 Profile -->

| 方式 | 适用场景 | 入口 |
| --- | --- | --- |
| FE Web UI | 日常排查、可视化查看 | `ip:http_port` 的 QueryProfile 页面 |
| 命令行 | 安全限制、批量下载 | `show query profile` + curl |
| 直接读取磁盘文件 | 快速访问已持久化的 Profile | `log/profile` 目录下的 zip 文件 |

### 通过 FE Web UI 获取

- 目的：通过浏览器查看 FE 上所有查询的 Profile。
- 操作：访问 FE 的 `ip:http_port`，输入用户名与密码后进入 QueryProfile 页面，点击 Profile ID 查看详细内容。
- 说明：

    - Profile 仅存在于执行 SQL 的 FE 上，**不会在多个 FE 之间同步**；获取时需连接执行 SQL 的 FE。
    - 所有导入任务最终由 FE Master 执行，因此其 Profile 需从 Master FE 获取。

![FE Web UI 中的 Query Profile 页面](/images/profile/profile-image-1.png)

### 通过命令行获取

某些场景（如安全限制）下无法访问 FE 的 Web UI，可以通过命令行获取 Profile。

**步骤 1：使用 `show query profile` 获取最近 20 条 Profile 的元信息。**

```sql
mysql> show query profile;
--------------
show query profile
--------------

+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| Profile ID                        | Task Type | Start Time          | End Time            | Total | Task State | User | Default Catalog | Default Db | Sql Statement |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
| c7f48291d62147f4-92b1a511f6fe3395 | QUERY     | 2025-02-26 19:35:15 | 2025-02-26 19:35:15 | 5ms   | EOF        | root | internal        | tpch       | select 20     |
| 9c6cd24d2f354c6f-9652c097cae00b05 | QUERY     | 2025-02-26 19:35:12 | 2025-02-26 19:35:12 | 4ms   | EOF        | root | internal        | tpch       | select 19     |
| b908f7b484084492-9c4dc48762c9cb89 | QUERY     | 2025-02-26 19:35:09 | 2025-02-26 19:35:09 | 5ms   | EOF        | root | internal        | tpch       | select 18     |
| ef411c0eb00541dc-ba5a39677be3e117 | QUERY     | 2025-02-26 19:35:06 | 2025-02-26 19:35:06 | 5ms   | EOF        | root | internal        | tpch       | select 17     |
| c89deefa85974da7-ad53cb3d6f4cad75 | QUERY     | 2025-02-26 19:35:03 | 2025-02-26 19:35:03 | 5ms   | EOF        | root | internal        | tpch       | select 16     |
| dd97a36d2a1f4cbc-b23f13b975cd2dde | QUERY     | 2025-02-26 19:34:59 | 2025-02-26 19:34:59 | 6ms   | EOF        | root | internal        | tpch       | select 15     |
| af75095f7a7c4d9f-9422d04d0604f904 | QUERY     | 2025-02-26 19:34:56 | 2025-02-26 19:34:56 | 8ms   | EOF        | root | internal        | tpch       | select 14     |
| 2764a7aaf2cf446d-922b4c5b5f853788 | QUERY     | 2025-02-26 19:34:54 | 2025-02-26 19:34:54 | 10ms  | EOF        | root | internal        | tpch       | select 13     |
| bf15d7d96b9c4f6b-8e6fe4c40b077ae8 | QUERY     | 2025-02-26 19:34:53 | 2025-02-26 19:34:53 | 9ms   | EOF        | root | internal        | tpch       | select 12     |
| ebf2221627b0435e-9bafebbe46d7315d | QUERY     | 2025-02-26 19:34:51 | 2025-02-26 19:34:51 | 7ms   | EOF        | root | internal        | tpch       | select 11     |
| 3309a4c57f61471c-9c863f6bb72a146b | QUERY     | 2025-02-26 19:34:50 | 2025-02-26 19:34:50 | 10ms  | EOF        | root | internal        | tpch       | select 10     |
| cb764ed358f34312-a7c56cbf7f521761 | QUERY     | 2025-02-26 19:34:48 | 2025-02-26 19:34:48 | 10ms  | EOF        | root | internal        | tpch       | select 9      |
| 38878f3344b649ff-a69f1c8cd0dc1960 | QUERY     | 2025-02-26 19:34:46 | 2025-02-26 19:34:46 | 9ms   | EOF        | root | internal        | tpch       | select 8      |
| 1182dc4c8105407c-b77c50a993cc0cb1 | QUERY     | 2025-02-26 19:34:42 | 2025-02-26 19:34:42 | 14ms  | EOF        | root | internal        | tpch       | select 7      |
| 8596d808d2814e8d-aefbac7d30a599d1 | QUERY     | 2025-02-26 19:34:40 | 2025-02-26 19:34:40 | 31ms  | EOF        | root | internal        | tpch       | select 6      |
| 325a66e868844aa4-90fae17f3a98d3e6 | QUERY     | 2025-02-26 19:34:38 | 2025-02-26 19:34:38 | 40ms  | EOF        | root | internal        | tpch       | select 5      |
| e30d1166a2674393-997246e064a7674c | QUERY     | 2025-02-26 19:34:36 | 2025-02-26 19:34:36 | 19ms  | EOF        | root | internal        | tpch       | select 4      |
| 4dfb91db8b448db-a4eab023bc119cea  | QUERY     | 2025-02-26 19:34:33 | 2025-02-26 19:34:33 | 14ms  | EOF        | root | internal        | tpch       | select 3      |
| 1453559772434cda-b64c2eae47ce6424 | QUERY     | 2025-02-26 19:34:31 | 2025-02-26 19:34:31 | 10ms  | EOF        | root | internal        | tpch       | select 2      |
| cbf8bf829740488c-b6da653e391b13c6 | QUERY     | 2025-02-26 19:34:30 | 2025-02-26 19:34:30 | 20ms  | EOF        | root | internal        | tpch       | select 1      |
+-----------------------------------+-----------+---------------------+---------------------+-------+------------+------+-----------------+------------+---------------+
20 rows in set (0.00 sec)
```

**步骤 2：通过 curl 访问 HTTP 接口获取具体 Profile。** 例如获取 ID 为 `f7efdc4c092d4b14-95e0f7f7783974d3` 的 Profile：

```bash
curl -uroot: http://127.0.0.1:5937/api/profile/text?query_id=f7efdc4c092d4b14-95e0f7f7783974d3 > f7efdc4c092d4b14-95e0f7f7783974d3.profile
```

获得的结果与 Web UI 一致：

```bash
> head f7efdc4c092d4b14-95e0f7f7783974d3.profile -n 10
Summary:
   - Profile ID: f7efdc4c092d4b14-95e0f7f7783974d3
   - Task Type: QUERY
   - Start Time: 2025-02-26 19:31:27
   - End Time: 2025-02-26 19:32:41
   - Total: 1min14sec
   - Task State: OK
   - User: root
   - Default Catalog: internal
   - Default Db: tpch
```

### 直接从磁盘获取 Profile 文件

3.0 起，Profile 支持持久化，默认保存目录为 `log/profile`。若需更快查看，可直接使用 `unzip` 解压目标文件以获得文本格式。

注意事项：

1. Doris FE 对 `log/profile` 目录有保护机制，**不要把解压后的输出留在该目录内**，否则会被删除。
2. Profile 文本与 Web UI 展示略有不同：`Summary` 以 JSON 形式作为 meta 保存，后续部分与 Web UI 一致。

```bash
[hezhiqiang@VM-10-2-centos log]$ unzip profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
Archive:  profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
  inflating: 33bf38e988ea4945-b585d2f74d1da3fd.profile
[hezhiqiang@VM-10-2-centos log]$ head 33bf38e988ea4945-b585d2f74d1da3fd.profile -n 10
{"summaryProfile":{"counterTotalTime":{"value":0,"type":5,"level":1},"localTimePercent":0.0,"infoStrings":{"Distributed Plan":"N/A","Task Type":"QUERY","User":"root","Default Catalog":"internal","Total":"9sec745ms","Default Db":"tpch","Profile ID":"33bf38e988ea4945-b585d2f74d1da3fd","Task State":"OK","Sql Statement":"SELECT      c.c_name,      COUNT(o.o_orderkey) AS total_orders,      SUM(o.o_totalprice) AS total_spent FROM      customer c JOIN      orders o ON c.c_custkey = o.o_custkey GROUP BY      c.c_name limit 20","Start Time":"2025-02-28 20:18:31","End Time":"2025-02-28 20:18:41"}, ...}
Changed Session Variables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000
fetch_splits_max_wait_time_ms | 4000         | 1000
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1
auto_profile_threshold_ms     | 1            | -1
```

## Profile 结构

<!-- 知识类型：数据结构说明 -->
<!-- 适用场景：理解 Profile 各部分含义，挑选合适章节阅读 -->

Profile 内容整体分为以下五部分：

| 部分 | 作用 | 何时使用 |
| --- | --- | --- |
| Summary | Profile 的元信息，记录用于检索的关键字段 | 检索 Profile、确认查询基本信息 |
| ExecutionSummary | 执行过程总结，包含 Planner 各阶段耗时 | 排查 SQL 编译/规划阶段耗时 |
| ChangedSessionVariables | 该查询执行期间改动的 session 变量 | 排查异常配置导致的性能问题 |
| MergedProfile | DetailProfile 的聚合结果 | 快速理解查询结构、定位瓶颈算子、对比数据倾斜 |
| DetailProfile | 每个 Fragment、Pipeline 的 PipelineTask 在所有 BE 上的执行细节 | 定位瓶颈后做深入分析 |

### 1. Summary

`SummaryProfile` 为 Profile 的元信息，记录用于检索的关键字段，如 `Profile ID`、`Total` 等。

```text
-  Profile  ID:  d4d281168bf7490a-a133623295744f85
-  Task  Type:  QUERY
-  Start  Time:  2025-02-28  19:23:14
-  End  Time:  2025-02-28  19:23:16
-  Total:  2sec420ms
-  Task  State:  OK
```

### 2. ExecutionSummary

执行过程总结。其中与 Plan 相关的字段记录 Planner 的耗时。

### 3. ChangedSessionVariables

记录该查询执行期间改动的 session 变量。

```text
ChangedSessionVariables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000       
fetch_splits_max_wait_time_ms | 4000         | 1000        
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1           
auto_profile_threshold_ms     | 1            | -1          
```

上述表格说明该查询在执行前改动了 5 个 session 变量。

### 4. MergedProfile

`MergedProfile` 是 `DetailProfile` 的聚合结果，主要有三个用途：

- **快速理解查询计划与 Pipeline 的结构**

    Doris 查询计划具有 Query → Fragment → PlanNode 的层级结构；执行层以 Pipeline 为单位调度，每个 Pipeline 由一组 Operator 构成。MergedProfile 能清晰展现该转换关系。

- **快速定位性能瓶颈算子**

    定位性能问题时，通常需确定具体的瓶颈算子。可先在 MergedProfile 中根据 `DependencyWaitTime` 找到耗时最大的算子，再在 DetailProfile 中查看其详细信息，进一步判断瓶颈。

- **对比数据倾斜**

    MergedProfile 记录数据在算子之间的流动细节。对比 `InputRows` 与 `RowsProduced` 可判断不同 Backend 上的数据是否存在不均衡分布——数据分布不均常导致查询变慢或失败。

### 5. DetailProfile

执行的详细细节。`DetailProfile` 记录查询中每个 Fragment、每条 Pipeline 的 `PipelineTask` 在所有 Backend 上的执行细节。通常在通过 MergedProfile 确认瓶颈点后，结合 DetailProfile 进行深入分析。

## Profile 解读示例

<!-- 知识类型：实战示例 -->
<!-- 适用场景：第一次解读 Profile、理解 Pipeline 与 Operator 关系 -->

下面以一个包含 Aggregation、Join 与 Scan 的典型查询为例，说明 Profile 的解读方法。针对 TPCH 数据集的 `customer` 与 `orders` 做 JOIN，并对结果做聚合：

```sql
SELECT c.c_name,
       Count(o.o_orderkey) AS total_orders,
       Sum(o.o_totalprice) AS total_spent
FROM   customer c
       JOIN orders o
         ON c.c_custkey = o.o_custkey
GROUP  BY c.c_name
LIMIT  20 
```

为避免 Profile 过于冗长，限制查询并行度：

```sql
set parallel_pipeline_task_num=2;
```

执行上述查询并通过 Web UI 获取 Profile 后，先关注 MergedProfile。为专注整体结构，下文仅保留关键字段，其他字段含义可参考相关文档。

```text
MergedProfile:
     Fragments:
       Fragment 0:
         Pipeline 0(instance_num=1):
           RESULT_SINK_OPERATOR(id=0):
             CommonCounters:
                - ExecTime: avg 176.545us, max 176.545us, min 176.545us
                - InputRows: sum 20, avg 20, max 20, min 20
                - WaitForDependency[RESULT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=8):
             CommonCounters:
                - ExecTime: avg 84.559us, max 84.559us, min 84.559us
                - RowsProduced: sum 20, avg 20, max 20, min 20
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 1:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=8):
             CommonCounters:
                - ExecTime: avg 31.515us, max 33.405us, min 29.626us
                - InputRows: sum 20, avg 10, max 11, min 9
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
                - BlocksProduced: sum 2, avg 1, max 1, min 1
           SORT_OPERATOR(nereids_id=443)(id=7):
             CommonCounters:
                - ExecTime: avg 980ns, max 1.199us, min 762ns
                - RowsProduced: sum 20, avg 10, max 11, min 9
                - WaitForDependency[SORT_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
             CustomCounters:
         Pipeline 1(instance_num=2):
           SORT_SINK_OPERATOR(nereids_id=443)(id=7):
             CommonCounters:
                - ExecTime: avg 49.414us, max 54.802us, min 44.27us
                - InputRows: sum 20, avg 10, max 11, min 9
                - WaitForDependency[SORT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           AGGREGATION_OPERATOR(nereids_id=438)(id=6):
             CommonCounters:
                - ExecTime: avg 34.521us, max 36.402us, min 32.640us
                - RowsProduced: sum 20, avg 10, max 11, min 9
                - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
             CustomCounters:
         Pipeline 2(instance_num=2):
           AGGREGATION_SINK_OPERATOR(nereids_id=438)(id=6):
             CommonCounters:
                - ExecTime: avg 109.89us, max 118.582us, min 99.596us
                - InputRows: sum 40, avg 20, max 22, min 18z
                - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=5):
             CommonCounters:
                - ExecTime: avg 29.741us, max 34.521us, min 24.962us
                - RowsProduced: sum 40, avg 20, max 22, min 18
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 2:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=5):
             CommonCounters:
                - ExecTime: avg 71.148us, max 73.242us, min 69.54us
                - InputRows: sum 40, avg 20, max 20, min 20
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           AGGREGATION_OPERATOR(nereids_id=428)(id=4):
             CommonCounters:
                - ExecTime: avg 350.431us, max 393.100us, min 307.762us
                - RowsProduced: sum 40, avg 20, max 20, min 20
                - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec30ms, max 11sec450ms, min 10sec610ms
             CustomCounters:
         Pipeline 1(instance_num=2):
           AGGREGATION_SINK_OPERATOR(nereids_id=428)(id=4):
             CommonCounters:
                - ExecTime: avg 442.308ms, max 449.109ms, min 435.506ms
                - InputRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
                - MemoryUsage: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
                - MemoryUsagePeak: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
                - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
                - MemoryUsageHashTable: sum 1.03 MB, avg 526.28 KB, max 526.28 KB, min 526.28 KB
                - MemoryUsageSerializeKeyArena: sum 1.02 MB, avg 524.00 KB, max 524.00 KB, min 524.00 KB
           HASH_JOIN_OPERATOR(nereids_id=418)(id=3):
             CommonCounters:
                - ExecTime: avg 9sec169ms, max 9sec582ms, min 8sec756ms
                - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
             CustomCounters:
                - ProbeRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
           OLAP_SCAN_OPERATOR(nereids_id=397. table_name=orders(orders))(id=2):
             CommonCounters:
                - ExecTime: avg 396.233ms, max 410.306ms, min 382.160ms
                - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
             CustomCounters:
                - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
         Pipeline 2(instance_num=2):
           HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
             CommonCounters:
                - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
                - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
                - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
             CustomCounters:
                - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
           EXCHANGE_OPERATOR(id=1):
             CommonCounters:
                - ExecTime: avg 10.131ms, max 20.243ms, min 19.26us
                - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 47.582ms, max 47.582ms, min 47.582ms
       Fragment 3:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=1):
             CommonCounters:
                - ExecTime: avg 3.269ms, max 3.281ms, min 3.258ms
                - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForLocalExchangeBuffer0: avg 142.859ms, max 285.713ms, min 6.733us
                  - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           OLAP_SCAN_OPERATOR(nereids_id=403. table_name=customer(customer))(id=0):
             CommonCounters:
                - ExecTime: avg 77.435ms, max 78.752ms, min 76.118ms
                - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
             CustomCounters:
                - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 49.690ms, max 50.522ms, min 48.858ms
```

上面是精简过的 MergedProfile。Doris 的查询计划有 Query → Fragment → PlanNode 的三级结构，而 Backend 上的执行引擎还会在此基础上再增加 Pipeline → Operator 两层。下文先用一张图说明上述查询从查询计划的角度如何分成三级。

### Query、Fragment 与 PlanNode

![查询计划的三级结构示例](/images/profile/profile-image-2.png)

图中的箭头表示数据流向。整个 Query 的查询计划被分为 4 个 Fragment（图左侧的四个方块）和多个 PlanNode（Fragment 与其包含的 PlanNode 在同一水平线上）。各 PlanNode 角色如下：

| PlanNode | 角色 |
| --- | --- |
| `SCAN_NODE` ×2 | 分别读取 `customer` 和 `orders` 表 |
| `DATA_STREAM_SINK` / `EXCHANGE` | 在不同 Fragment 之间传递数据 |
| `HASH_JOIN` | 对 SCAN 读上来的数据进行连接操作 |
| `AGGREGATION`（第一阶段）/ `AGGREGATION(MERGE)`（第二阶段） | 两阶段聚合 |
| `TOP-N` | 限制结果行数 |
| `RESULT_SINK` | 向 FE 返回最终结果 |

### Pipeline 与 Operator

上述查询计划如何转化为执行引擎的 Pipeline 与 Operator？以包含 AGGREGATION 与 HASH_JOIN 的 Fragment 1 和 Fragment 2 为例。

![PlanNode 转化为 Pipeline 和 Operator](/images/profile/profile-image-3.png)

Doris 的执行引擎在执行时会将一些 PlanNode 拆分成一个或多个 Operator。

**示例 1：DATA_STREAM_SINK**

`DATA_STREAM_SINK` 被转换成一个 `DATA_STREAM_SINK_OPERATOR`，该节点是 Fragment 向外输出数据的算子，本身没有 OperatorId，只有目标 OperatorId。例如 `dest_id=5` 表示该算子把数据发送到 `id=5` 的 `EXCHANGE_OPERATOR`。

**示例 2：HASH_JOIN**

PlanNodeId 等于 3 的 HASH_JOIN 被拆成两个 Operator：`HASH_JOIN_SINK_OPERATOR` 与 `HASH_JOIN_OPERATOR`。两者的 Operator Id 都为 3，等于其 PlanNodeId。第一阶段的 AGGREGATION 与第二阶段的 AGGREGATION(MERGE) 也各自被拆分成一对 SINK 与 SOURCE 算子。

**Pipeline 的连接与阻塞关系**

PlanNode 被拆成 Operator 后，执行引擎会把一些 Operator 连接起来组成 Pipeline。Fragment 1 与 Fragment 2 内部各自有 3 条 Pipeline。

| 阻塞类型 | 来源 | 示例 |
| --- | --- | --- |
| 计算逻辑依赖 | 算子之间的计算先后关系 | HashJoin 的 Probe 侧需等待 Build 侧构建完 Hash 表 |
| 物理环境依赖 | 网络、缓冲等系统因素 | EXCHANGE_OPERATOR 需等待 DATA_STREAM_SINK_OPERATOR 通过网络传输数据 |

Pipeline 内部算子之间的数据流动**不会阻塞**；Pipeline 之间的连接算子则**有阻塞关系**。通过 Pipeline 把不阻塞的算子连接到一起调度执行，可以使资源利用率和缓存命中率更高。

### CommonCounters 与 CustomCounters

`CommonCounters` 是所有 Operator 都必须具备的 Counter，目前 Doris 中包含：

| Counter | 适用算子 | 含义 |
| --- | --- | --- |
| `ExecTime` | 全部 | 当前 Operator 执行花费的时间，**不包括上游算子** |
| `RowsProduced` | 非 SinkOperator | Source 算子输出的行数 |
| `InputRows` | SinkOperator | 当前算子接收的输入行数 |
| `MemoryUsage` & `MemoryUsagePeak` | 全部 | 算子当前内存使用量与峰值 |
| `WaitForDependency` | 全部 | 等待依赖执行结束花费的时间 |

`CustomCounters` 是 Operator 特有的 Counter。可参考《Doris 算子 Profile 梳理》文档，其中详细介绍了每个算子的 CustomCounter 含义。

### HashJoin 解读

梳理出 Doris 执行时的基本概念后，回到之前的查询，通过 MergedProfile 复原 Join 的执行细节。

![HashJoin 在 Pipeline 中的执行细节](/images/profile/profile-image-4.png)

在执行 SQL 之前设置了查询 Pipeline 并行度为 2，因此虽然图中只显示一组连接的 Pipeline 1 和 Pipeline 2，但在实际执行时它们应该有 4 个 Pipeline Task——每条 Pipeline 都有两个 Pipeline Task。

```text
Pipeline 0(instance_num=2)
```

每条 Pipeline 后面括号内的 `instance_num` 等于该 Pipeline 在所有 BE 上的 PipelineTask 数量之和。我们构建的集群只有 1 个 BE，所以这里的 `instance_num = 1 * parallel_pipeline_task_num = 2`。

**Build 侧：构建 HashTable**

Pipeline 2 的两个 PipelineTask 累计处理了 15M 行数据用于构建 HashTable，构建 HashTable 的平均执行时间为 445.146 ms。Pipeline 1 的执行前提是 Pipeline 2 完成构建 HashTable 操作，等待时间反映在 `WaitForDependency` 上，`avg` 为 949.860 ms——但构建 HashTable 平均时间只有 445.146 ms，问题出在哪里？

```text
HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
 CommonCounters:
    - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
    - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
    - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
 CustomCounters:
    - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
```

原因：本 case 中 FE 规划的 JOIN 类型为 `BROADCAST_JOIN`，此时两个进行 JOIN Build 操作的 PipelineTask 中只会选一个真正构建 Hash 表。从 `HASH_JOIN_SINK_OPERATOR` 的 MergedProfile 可见：

- 平均执行时间为 445.146 ms，但最慢的 PipelineTask 耗时 890.258 ms，最快只有 34.635 us。
- `InputRows` 的 `min=0`，说明所有数据都是一个 PipelineTask 处理的，另一个 PipelineTask 没做事。

因此下面这一行的等待时间也就解释通了：

```text
- WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
```

**Probe 侧：扫描并连接**

继续看 `HASH_JOIN_OPERATOR`：在等待平均 949.860 ms 后，开始执行 JOIN 的 Probe 侧。两个 `id=2` 的 `OLAP_SCAN_OPERATOR` 从存储中读出 150M 行；这 150M 行被 `HASH_JOIN_OPERATOR` 处理之后，一行没剩下，全部往上给了 `AGGREGATION_SINK_OPERATOR`。该算子将对这 150M 行构建 Hash 表，继续进行聚合运算。

### Aggregation 解读

查询中涉及的聚合操作是 `Count(o.o_orderkey) AS total_orders, Sum(o.o_totalprice) AS total_spent` 和 `GROUP BY c.c_name`。

![两阶段聚合的执行细节](/images/profile/profile-image-5.png)

对于这个查询，Doris 使用两阶段 Aggregation。

**第一阶段聚合**

- 在 `id=4` 的一对 AGGREGATION 算子里完成。
- `AGGREGATION_SINK_OPERATOR(id=4)` 的输入一共是 150M 行，对 `GROUP BY` 列构建 Hash 表，同时更新每个聚合结果的 `AggregationData`。
- 第一阶段结束后，把 `AggregationData` 通过 EXCHANGE 发送给第二阶段。由于不同 PipelineTask 可能处理相同的 GROUP BY 列，EXCHANGE 阶段会按 `name` 列进行 HASH 分区，把相同 name 的行发送到相同的第二阶段算子。
- `AGGREGATION_OPERATOR(id=4)` 的输出共 40 行，说明第一阶段构建的 Hash 表共 40 行。

**第二阶段聚合**

- `AGGREGATION_SINK_OPERATOR(id=6)` 把第一阶段的结果反序列化为 `AggregationData`，再进行 Merge 操作。
- 结果由 `AGGREGATION_OPERATOR(id=6)` 发送给下游的 TOP-N。由于查询带了 `LIMIT 20`，TOP-N 算子收集到 20 行数据后即提前结束。

**整体瓶颈**

整体来看，本次查询最耗时的操作是 `HASH_JOIN_OPERATOR(id=3)`。定位到这里后，可以继续在 DetailProfile 中查看 `HASH_JOIN_OPERATOR(id=3)` 的更细粒度 Counter。每个 Counter 的含义可参考各算子的专门文档。

## 故障排查与常见问题（FAQ）

<!-- 知识类型：FAQ -->
<!-- 适用场景：日常使用 Profile 时的常见问题 -->

### `show query profile` 为空？

- 检查 `enable_profile` 是否为 `true`：`show variables like 'enable_profile';`。
- 检查 `auto_profile_threshold_ms`：若设置较大值，短查询不会生成 Profile。
- 确认连接的 FE 与执行 SQL 的 FE 是同一节点；导入任务需连接 FE Master。

### Profile 上报频繁超时？

- 现象：FE 日志中出现 Profile 异步收集超时。
- 处理：

    1. 检查机器 CPU、内存、网络资源使用率。
    2. 调大 `fe.conf` 中的 `profile_async_collect_expire_time_secs`。
    3. 极端情况下关闭全局 Profile，只对慢查询采集（设置 `auto_profile_threshold_ms`）。

### Profile 占用 FE 内存过多？

- 调小 `max_query_profile_num`，限制内存中保留的 Profile 数。
- 启用磁盘持久化（默认开启），让历史 Profile 落盘。
- 用 `auto_profile_threshold_ms` 过滤小查询。

### 解压后的 Profile 文件不见了？

- 原因：FE 对 `log/profile` 目录有清理保护机制。
- 处理：把解压输出放到 `log/profile` **以外**的目录。

### 如何确认是否数据倾斜？

- 在 MergedProfile 中对比同一算子的 `InputRows`/`RowsProduced` 的 `min`、`avg`、`max`。
- `max` 显著大于 `avg`，或 `min=0` 而 `max` 很大，通常意味着数据倾斜。

## 名词速查

<!-- 知识类型：术语表 -->
<!-- 适用场景：术语对齐 -->

| 术语 | 一句话定义 |
| --- | --- |
| Query Profile | 记录单条查询执行细节的诊断结构 |
| Fragment | 查询计划的一段执行单元，可被分发到 BE 执行 |
| PlanNode | 查询计划中的逻辑算子节点 |
| Pipeline | 由多个不阻塞的 Operator 组成的执行流水线 |
| Operator | 执行引擎中的最小执行单元，由 PlanNode 拆分而来 |
| MergedProfile | 跨 BE/PipelineTask 聚合后的 Profile |
| DetailProfile | 每个 PipelineTask 在每个 BE 上的详细 Profile |
| `WaitForDependency` | 算子等待依赖完成的时间，常用于定位瓶颈 |
