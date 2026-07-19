---
{
    "title": "配置说明",
    "language": "zh-CN",
    "description": "Doris CCR 跨集群复制的 FE、BE 与库表属性配置清单，含参数默认值、生效版本及常见调优组合。",
    "keywords": [
        "Doris CCR",
        "跨集群复制",
        "Cross Cluster Replication",
        "CCR 配置",
        "FE 配置",
        "BE 配置",
        "binlog 配置",
        "restore_reset_index_id",
        "thrift_max_message_size",
        "binlog.ttl_seconds",
        "backup restore 超时",
        "CCR 同步中断",
        "tablet 数过多",
        "snapshot 压缩"
    ]
}
---

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 部署 CCR / 同步链路调优 / 故障规避 -->

本文面向使用 Doris **CCR（Cross-Cluster Replication，跨集群复制）** 的运维与开发人员，集中说明 FE、BE 以及库表层面需要关注或调整的配置项，并给出默认值与生效版本，便于在搭建与运行阶段快速核对。

## 适用场景

| 场景 | 关注的配置面 |
| --- | --- |
| 首次搭建 CCR 同步链路 | FE 基础参数、库表 binlog 属性 |
| 同步表包含倒排索引或 bitmap 索引 | `restore_reset_index_id` |
| 上游频繁创建临时分区导致同步中断 | `ignore_backup_tmp_partitions` |
| 单表 tablet 数量超过 10 万 | `restore_job_compressed_serialization`、`backup_job_compressed_serialization` |
| 网络带宽充裕、希望加速增量同步 | BE 下载相关参数 |
| 备份/恢复任务规模大、耗时长 | `backup_job_default_timeout_ms`、`thrift_max_message_size` |

## 前置条件

- 已部署上下游两套 Doris 集群，并完成 CCR Syncer 的安装与对接。
- 拥有上下游集群 FE 与 BE 节点配置文件 `fe.conf` / `be.conf` 的修改权限。
- 已知当前集群版本，便于判断各配置项是否生效。

## 配置流程总览

1. 修改上下游 FE 节点的 `fe.conf`，并按需重启或动态生效。
2. 修改上下游 BE 节点的 `be.conf`，并按需重启或动态生效。
3. 通过 `CREATE TABLE` / `ALTER TABLE` 设置库表层面的 binlog 属性。
4. 启动或重启 CCR 同步任务，观察运行状态并按需回调参数。

## FE 配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: FE 端 CCR 行为调优 -->

在 `fe.conf` 中配置，例如：

```shell
restore_reset_index_id = false
```

| 名称 | 说明 | 默认值 | 版本 |
| --- | --- | --- | --- |
| `restore_reset_index_id` | 如果同步的表中使用 inverted index 或者 bitmap 索引，需设置为 `false`。 | false | 从 2.1.8 及 3.0.4 开始。 |
| `ignore_backup_tmp_partitions` | 避免因上游创建 `tmp partition` 导致同步中断，需设置为 `true`。 | false | 从 2.1.8 及 3.0.4 开始。 |
| `max_backup_restore_job_num_per_db` | 内存中每个 DB 的 backup/restore job 数量限制，建议设置为 2。 | 10 | 所有版本。 |
| `label_num_threshold` | 控制 TXN Label 数量，防止事务回收过快，过大会占用较多内存，过小可能导致异常情况下数据重复，默认值在大多数情况下够用。 | 2000 | 2.1 开始。 |
| `restore_job_compressed_serialization` | tablet 数目超过 10w 时建议配置为 true。<br /> 降级前关闭配置并确保 FE 完成一次 checkpoint。<br /> 2.1 升级 3.0 时，至少升级到 3.0.3。 | false | 从 2.1.8 和 3.0.3 开始。 |
| `backup_job_compressed_serialization` | tablet 数目超过 10w 时建议配置为 true。<br /> 降级前关闭配置并确保 FE 完成一次 checkpoint。<br /> 2.1 升级 3.0 时，至少升级到 3.0.3。 | false | 从 2.1.8 和 3.0.3 开始。 |
| `backup_job_default_timeout_ms` | 备份/恢复任务超时时间，源、目标集群的 FE 都需要配置。 | 无 | 根据需求设置 |
| `enable_restore_snapshot_rpc_compression` | 开启 snapshot info 压缩，降低 RPC 消息大小，建议设置为 true。 | true | 从 2.1.8 和 3.0.3 开始。 |

## BE 配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: BE 端 CCR 传输与下载调优 -->

在 `be.conf` 中配置，例如：

```shell
thrift_max_message_size = 2000000000
```

| 名称 | 说明 | 默认值 | 版本 |
| --- | --- | --- | --- |
| `thrift_max_message_size` | BE thrift server 单次 RPC packet 上限，CCR 任务涉及的 tablet 数目大时，建议设置为 2000000000。 | 100MB | 所有版本 |
| `be_thrift_max_pkg_bytes` | BE Thrift RPC 消息包大小限制。 | 20MB | 2.0 特有。 |
| `max_download_speed_kbps` | 下游 BE 每个 download worker 的下载限速，默认每线程 50MB/s。 | 50MB/s | 所有版本 |
| `download_worker_count` | 下载任务的线程数，结合网卡、磁盘和负载设置。 | 1 | 所有版本 |

## 库表属性

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 通过 DDL 控制库表 binlog 行为 -->

通过 `CREATE TABLE` 或者 `ALTER TABLE` 设置，用于控制库表的 binlog 行为。

| 名称 | 说明 | 默认值 | 版本 |
| --- | --- | --- | --- |
| `binlog.max_bytes` | binlog 最大内存占用，建议至少保留 4GB。 | 无限制 | 所有版本 |
| `binlog.ttl_seconds` | binlog 保留时间。 | 2.0.5 之前无限制，2.0.5 开始 1 天（86400） | 所有版本 |

## 常见调优组合

下表汇总按运行表现选择配置的常用组合，便于按需快速套用：

| 现象 / 目标 | 建议配置 |
| --- | --- |
| 同步表包含 inverted index / bitmap 索引 | FE：`restore_reset_index_id = false` |
| 上游频繁建临时分区，同步中断 | FE：`ignore_backup_tmp_partitions = true` |
| 单 DB 备份/恢复堆积，FE 内存吃紧 | FE：`max_backup_restore_job_num_per_db = 2` |
| 单表 tablet 数超过 10 万 | FE：`restore_job_compressed_serialization = true`、`backup_job_compressed_serialization = true`；同时开启 `enable_restore_snapshot_rpc_compression = true` |
| 备份/恢复任务超大、默认超时不足 | FE：按需调大 `backup_job_default_timeout_ms`（源、目标集群均需配置） |
| RPC 报文过大、备份/恢复失败 | BE：`thrift_max_message_size = 2000000000` |
| 下游下载速度受限、增量同步慢 | BE：调大 `download_worker_count`，并按需调整 `max_download_speed_kbps` |
| 控制单表 binlog 体量、防止内存膨胀 | 库表：设置 `binlog.max_bytes`（建议至少保留 4GB）与 `binlog.ttl_seconds` |

## 版本升降级注意事项

- 开启 `restore_job_compressed_serialization` 或 `backup_job_compressed_serialization` 后，若需降级，请先关闭对应配置并确保 FE 完成一次 checkpoint，再执行降级。
- 从 2.1 升级到 3.0 时，目标版本至少为 3.0.3，以匹配压缩序列化相关配置的实现。
- `binlog.ttl_seconds` 在 2.0.5 之前默认无限制，2.0.5 起默认 1 天（86400 秒）；从旧版本升级后请根据存储与回放需求显式设置。
