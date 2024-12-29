---
title: 配置说明
language: zh-CN
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

本文给出使用 CCR 需要调整或者关注的配置。

## FE 配置
| **名称**|**说明**|**默认值**| **版本** |
|---|---|---|---|
|`restore_reset_index_id`|如果同步的表中使用 inverted index 或者 bitmap 索引，需设置为 `false`。| false| 从 2.1.8 及 3.0.4 开始。 |
|`ignore_backup_tmp_partitions`|避免因上游创建 `tmp partition` 导致同步中断，需设置为 `true`。|false| 从 2.1.8 及 3.0.4 开始。 |
|`max_backup_restore_job_num_per_db`|内存中每个 DB 的 backup/restore job 数量限制，建议设置为 2。|10 | 所有版本。|
|`label_num_threshold`|控制 TXN Label 数量，防止事务回收过快，过大会占用较多内存，过下可能导致异常情况下数据重复，默认值在大多数情况下够用。| 2000 | 2.1 开始。|
|`stream_load_default_timeout_second`|控制 TXN 超时时间。|无|无|
|`label_regex_length`| 大多|128|无|

## Syncer

|**Syncer**|`backup_job_default_timeout_ms`|备份/恢复任务超时时间，源、目标集群的 FE 都需要配置。|无|根据需求设置|
|**Syncer**|`max_download_speed_kbps`|下游 BE 下载限速，默认每线程 50MB/s。|50MB/s|根据网卡带宽设置|
|**Syncer**|`download_worker_count`|下载任务的线程数。|1|结合网卡最大带宽设置|
|**Syncer**|`restore_job_compressed_serialization`|开启 restore job 压缩（影响元数据兼容性）。|关闭|无|
|**Syncer**|`backup_job_compressed_serialization`|开启 backup job 压缩（影响元数据兼容性）。|关闭|无|
|**Syncer**|`enable_restore_snapshot_rpc_compression`|开启 snapshot info 压缩，主要影响 RPC。|开启|无|

## BE

|**BE**|`thrift_max_message_size`|BE thrift server 单次 RPC packet 上限。|100MB|根据 tablet 数量设置，最大 2GB|
|**BE**|`be_thrift_max_pkg_bytes`|BE Thrift RPC 消息包大小限制（2.0 特有）。|20MB|根据 tablet 数量调整|

## 库表属性
|**库表属性**|`binlog.max_bytes`|binlog 最大内存占用，建议至少保留 4GB。|无限制|无|
|**库表属性**|`binlog.ttl_seconds`|binlog 保留时间。|老版本无限制，新版本 1 天（86400）|`ALTER TABLE table SET ("binlog.ttl_seconds"="3600")`|
|**库表属性**|`storage_policy`|检查是否有设置 `cooldown` 的 table，避免备份问题。|无|确保未配置 `storage_policy`|
|**MySQL**|`max_allowed_packet`|MySQL 服务端单次 select/insert 返回/插入数据包大小限制。|默认 128MB|服务端与客户端均设置为 1024MB|
