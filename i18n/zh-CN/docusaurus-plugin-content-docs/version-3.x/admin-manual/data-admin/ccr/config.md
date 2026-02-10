---
{
    "title": "配置说明",
    "language": "zh-CN",
    "description": "本文给出使用 CCR 需要调整或者关注的配置。"
}
---

本文给出使用 CCR 需要调整或者关注的配置。

## FE 配置

在 fe.conf 中配置，例如 `restore_reset_index_id = true`。

| **名称**|**说明**|**默认值**| **版本** |
|---|---|---|---|
|`restore_reset_index_id`|如果同步的表中使用 inverted index 或者 bitmap 索引，需设置为 `false`。| false| 从 2.1.8 及 3.0.4 开始。 |
|`ignore_backup_tmp_partitions`|避免因上游创建 `tmp partition` 导致同步中断，需设置为 `true`。|false| 从 2.1.8 及 3.0.4 开始。 |
|`max_backup_restore_job_num_per_db`|内存中每个 DB 的 backup/restore job 数量限制，建议设置为 2。|10 | 所有版本。|
|`label_num_threshold`|控制 TXN Label 数量，防止事务回收过快，过大会占用较多内存，过小可能导致异常情况下数据重复，默认值在大多数情况下够用。| 2000 | 2.1 开始。|
|`restore_job_compressed_serialization`| tablet 数目超过 10w 时建议配置为 true。<br /> 降级前关闭配置并确保 FE 完成一次 checkpoint。<br /> 2.1 升级 3.0 时，至少升级到 3.0.3。|false| 从 2.1.8 和 3.0.3 开始。|
|`backup_job_compressed_serialization`| tablet 数目超过 10w 时建议配置为 true。<br /> 降级前关闭配置并确保 FE 完成一次 checkpoint。<br /> 2.1 升级 3.0 时，至少升级到 3.0.3。|false| 从 2.1.8 和 3.0.3 开始。|
|`backup_job_default_timeout_ms`|备份/恢复任务超时时间，源、目标集群的 FE 都需要配置。|无 | 根据需求设置 |
|`enable_restore_snapshot_rpc_compression`|开启 snapshot info 压缩，降低 RPC 消息大小，建议设置为 true。| true | 从 2.1.8 和 3.0.3 开始。|


## BE

在 be.conf 中配置，例如 `thrift_max_message_size = 2000000000`。

| **名称**|**说明**|**默认值**| **版本** |
|---|---|---|---|
|`thrift_max_message_size`|BE thrift server 单次 RPC packet 上限，CCR 任务涉及的 tablet 数目大时，建议设置为 2000000000 |100MB| 所有版本 |
|`be_thrift_max_pkg_bytes`|BE Thrift RPC 消息包大小限制。 |20MB| 2.0 特有。| 所有版本 |
|`max_download_speed_kbps`|下游 BE 每个 download worker 的下载限速，默认每线程 50MB/s。|50MB/s| 所有版本 |
|`download_worker_count`|下载任务的线程数，结合网卡、磁盘和负载设置。| 1 | 所有版本 |

## 库表属性

`Create Table` 或者 `Alter Table` 设置。

| **名称**|**说明**|**默认值**| **版本** |
|---|---|---|---|
|`binlog.max_bytes`|binlog 最大内存占用，建议至少保留 4GB。|无限制 | 所有版本 |
|`binlog.ttl_seconds`|binlog 保留时间。| 2.0.5 之前无限制，2.0.5 开始 1 天（86400）| 所有版本 |
