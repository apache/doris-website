---
{
    "title": "备份",
    "language": "zh-CN",
    "description": "通过 Doris 备份功能将数据库、表或分区以快照形式备份到 S3、Azure、GCP、OSS、MinIO、HDFS 等远程存储，本指南给出完整操作步骤。",
    "keywords": [
        "Doris 备份",
        "BACKUP SNAPSHOT",
        "CREATE REPOSITORY",
        "数据备份",
        "全量备份",
        "快照",
        "Repository",
        "S3 备份",
        "Azure 备份",
        "HDFS 备份",
        "OSS 备份",
        "MinIO 备份",
        "GCP 备份",
        "备份分区",
        "备份数据库",
        "show backup",
        "cancel backup"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据备份 / 灾备建设 / 跨集群迁移 -->

Doris 提供备份能力，可将数据库、表或分区以快照形式备份到远程存储系统，并在需要时进行[恢复](./restore)。本文面向需要执行例行备份、灾备演练或跨集群数据迁移的 DBA 与运维人员，介绍备份的关键概念、前置条件以及完整操作流程。

## 适用场景

| 场景 | 说明 |
| --- | --- |
| 例行数据备份 | 定期对数据库/表/分区进行全量备份，防止误删、硬件故障导致数据丢失。 |
| 灾难恢复 | 将备份保存到异地远程存储（S3、HDFS 等），在集群整体故障时用于恢复。 |
| 跨集群数据迁移 | 在源集群备份、在目标集群恢复，实现集群间数据搬迁。 |
| 测试环境数据准备 | 将生产环境的部分表或分区备份后恢复至测试集群。 |
| 近似增量备份 | 通过仅备份新增/变更分区，近似实现增量备份效果（Doris 尚不支持原生增量备份）。 |

## 前置条件

执行备份操作前，请确认以下条件已满足：

- **权限**：操作账号具备 **ADMIN** 权限（备份与恢复均需要）。
- **部署模式**：当前集群为存算一体模式（**存算分离模式暂不支持**备份/恢复）。
- **远程存储**：已准备好可访问的远程存储（S3、Azure、GCP、OSS、COS、MinIO、HDFS 或其它兼容 S3 的对象存储），并获取相应的访问凭证。
- **网络连通**：FE 与 BE 节点均可访问远程存储 Endpoint。
- **对象限制**：待备份对象不属于以下不支持类型：
    - 异步物化视图（MTMV）
    - 使用了[存储策略](../../../table-design/tiered-storage/remote-storage)的表

## 关键概念

| 概念 | 定义 |
| --- | --- |
| 快照 (Snapshot) | 数据库、表或分区中数据的时间点捕获。创建快照时需指定一个快照 Label，快照完成时生成时间戳；通过 Repository、快照 Label 和时间戳可唯一标识一个快照。 |
| Repository | 备份文件存储的远程位置，支持 S3、Azure、GCP、OSS、COS、MinIO、HDFS 等及其它兼容 S3 的对象存储。 |
| 备份操作 | 创建数据库、表或分区的快照，将快照文件上传到远程 Repository，并存储与备份相关的元数据。 |
| 恢复操作 | 从远程 Repository 下载快照并将其恢复到 Doris 集群。 |

## 使用限制

| 限制项 | 说明 |
| --- | --- |
| 存算分离模式不支持 | 存储与计算解耦的部署模式下，备份和恢复功能不可用。 |
| 不支持异步物化视图 (MTMV) | 备份和恢复操作不包含异步物化视图。 |
| 不支持具有存储策略的表 | 使用了[存储策略](../../../table-design/tiered-storage/remote-storage)的表不支持备份和恢复操作。 |
| 仅支持全量备份 | 目前 Doris 仅支持全量备份。增量备份（仅存储自上次备份以来更改的数据）尚不支持，可以通过备份特定分区来近似实现增量备份效果。 |
| `colocate_with` 属性不保留 | 备份或恢复操作期间，Doris 不会保留表的 `colocate_with` 属性，恢复后可能需要重新配置共置表。 |
| 动态分区需重新启用 | 恢复表之后，需要使用 `ALTER TABLE` 命令手动启用动态分区属性。 |
| 单并发限制 | 一个数据库下同时只能运行一个备份或恢复任务。 |

## 备份流程总览

完整的备份流程包含以下 5 个步骤：

1. **创建 Repository**：在 Doris 中注册远程存储位置。
2. **执行备份**：通过 `BACKUP SNAPSHOT` 触发备份任务。
3. **查看备份进度**：通过 `SHOW BACKUP` 查看任务执行情况。
4. **查看 Repository 内已有快照**：通过 `SHOW SNAPSHOT` 列出可用备份。
5. **（可选）取消备份**：异常情况下通过 `CANCEL BACKUP` 终止任务。

下文按此流程依次说明。

## 第 1 步：创建 Repository

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 远程存储接入 / 备份准备 -->

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

根据使用的远程存储类型选择对应的建仓语句。详细用法请参阅[创建 Repository](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)。

:::tip
在不同集群使用相同路径的 Repository 进行备份时，请确保使用不同的 Label，以避免路径冲突造成数据错乱。
:::

各远程存储对应的建仓方法如下：

| 方法 | 远程存储 | 备注 |
| --- | --- | --- |
| 方法 1 | S3 | AWS S3 或兼容 S3 协议的对象存储 |
| 方法 2 | Azure Blob Storage | 自 Doris 3.1.3 开始支持 |
| 方法 3 | GCP（Google Cloud Storage） | 必须填写虚假 `s3.region` |
| 方法 4 | OSS（阿里云对象存储） | — |
| 方法 5 | MinIO | 未启用 Virtual Host-style 时需 `use_path_style=true` |
| 方法 6 | HDFS | — |

### 方法 1：在 S3 上创建 Repository

在 AWS S3 上创建 Repository：

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://bucket_name/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

说明：

- 将 `bucket_name` 替换为您的 S3 存储桶名称。
- 提供适当的 `endpoint`、`access key`、`secret key` 和 `region` 以进行 S3 设置。

### 方法 2：在 Azure 上创建 Repository

**自 Doris 3.1.3 开始支持。**

在 Azure Blob Storage 上创建 Repository：

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://<container_name>/azure_repo"
PROPERTIES
(
    "azure.endpoint" = "https://<account_name>.blob.core.windows.net",
    "azure.account_name" = "<account_name>",
    "azure.account_key" = "<account_key>",
    "provider" = "AZURE"
);
```

说明：

- 将 `<container_name>` 替换为您的 Azure 容器名称。
- 提供您的 Azure 存储账户和密钥以进行身份验证。
- `provider` 必须为 `AZURE`。

### 方法 3：在 GCP 上创建 Repository

在 Google Cloud Platform (GCP) 存储上创建 Repository：

```sql
CREATE REPOSITORY `gcp_repo`
WITH S3
ON LOCATION "s3://bucket_name/backup/gcp_repo"
PROPERTIES
(
    "s3.endpoint" = "storage.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

说明：

- 将 `bucket_name` 替换为您的 GCP 存储桶名称。
- 提供您的 GCP `endpoint`、`access key` 和 `secret key`。
- `s3.region` 只是一个虚假的 region，任意指定一个即可，但是必须要指定。

### 方法 4：在 OSS（阿里云对象存储服务）上创建 Repository

在 OSS 上创建 Repository：

```sql
CREATE REPOSITORY `oss_repo`
WITH S3
ON LOCATION "s3://bucket_name/oss_repo"
PROPERTIES
(
    "s3.endpoint" = "oss.aliyuncs.com",
    "s3.region" = "cn-hangzhou",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

说明：

- 将 `bucket_name` 替换为您的 OSS 存储桶名称。
- 提供您的 OSS `endpoint`、`region`、`access key` 和 `secret key`。

### 方法 5：在 MinIO 上创建 Repository

在 MinIO 存储上创建 Repository：

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://bucket_name/minio_repo"
PROPERTIES
(
    "s3.endpoint" = "yourminio.com",
    "s3.region" = "dummy-region",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "use_path_style" = "true"
);
```

说明：

- 将 `bucket_name` 替换为您的 MinIO 存储桶名称。
- 提供您的 MinIO `endpoint`、`access key` 和 `secret key`。
- `s3.region` 只是一个虚假的 region，任意指定一个即可，但是必须要指定。
- 如果不启用 Virtual Host-style，则 `use_path_style` 必须为 `true`。

### 方法 6：在 HDFS 上创建 Repository

在 HDFS 上创建 Repository：

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "/prefix_path/hdfs_repo"
PROPERTIES
(
    "fs.defaultFS" = "hdfs://127.0.0.1:9000",
    "hadoop.username" = "doris-test"
)
```

说明：

- 将 `prefix_path` 替换为真实路径。
- 提供您的 HDFS `endpoint` 和用户名。

## 第 2 步：执行备份

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 数据库/表/分区备份 -->

通过 `BACKUP SNAPSHOT` 触发备份任务。详细用法请参阅[备份](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)。

:::tip
建议使用有意义的 Label 名称，例如包含备份中包含的数据库和表，便于后续识别与管理。
:::

可根据备份对象选择不同形式：

| 方法 | 备份对象 | 适用场景 |
| --- | --- | --- |
| 方法 1 | 当前数据库 | 整库备份，使用当前 `USE` 的数据库 |
| 方法 2 | 指定数据库 | 整库备份，明确指定数据库名 |
| 方法 3 | 指定表 | 仅备份若干表 |
| 方法 4 | 指定分区 | 备份指定表的部分分区，可与整表混合 |
| 方法 5 | 排除某些表 | 整库备份，但排除指定的表 |

### 方法 1：备份当前数据库

以下 SQL 语句将当前数据库备份到名为 `example_repo` 的 Repository，并使用快照 Label `exampledb_20241225`：

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### 方法 2：备份指定数据库

以下 SQL 语句将名为 `destdb` 的数据库备份到名为 `example_repo` 的 Repository，并使用快照 Label `destdb_20241225`：

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### 方法 3：备份指定表

以下 SQL 语句将两个表备份到名为 `example_repo` 的 Repository，并使用快照 Label `exampledb_tbl_tbl1_20241225`：

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### 方法 4：备份指定分区

以下 SQL 语句将名为 `example_tbl2` 的表，以及名为 `example_tbl` 的表中 `p1`、`p2` 两个分区备份到名为 `example_repo` 的 Repository，并使用快照 Label `example_tbl_p1_p2_tbl1_20241225`：

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### 方法 5：备份当前数据库，排除某些表

以下 SQL 语句将当前数据库备份到名为 `example_repo` 的 Repository，并使用快照 Label `exampledb_20241225`，排除两个名为 `example_tbl` 和 `example_tbl1` 的表：

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## 第 3 步：查看最近备份作业的执行情况

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 备份进度跟踪 / 故障排查 -->

通过以下 SQL 查看最近备份作业的执行情况：

```sql
mysql> show BACKUP\G;
*************************** 1. row ***************************
                  JobId: 17891847
           SnapshotName: exampledb_20241225
                 DbName: example_db
                  State: FINISHED
             BackupObjs: [example_db.example_tbl]
             CreateTime: 2022-04-08 15:52:29
   SnapshotFinishedTime: 2022-04-08 15:52:32
     UploadFinishedTime: 2022-04-08 15:52:38
           FinishedTime: 2022-04-08 15:52:44
        UnfinishedTasks:
               Progress:
             TaskErrMsg:
                 Status: [OK]
                Timeout: 86400
   1 row in set (0.01 sec)
```

关键字段说明：

| 字段 | 含义 |
| --- | --- |
| `JobId` | 备份任务 ID。 |
| `SnapshotName` | 快照 Label，对应 `BACKUP SNAPSHOT` 中指定的名称。 |
| `DbName` | 备份所属的数据库。 |
| `State` | 任务状态，例如 `FINISHED` 表示已完成。 |
| `BackupObjs` | 实际备份的对象列表。 |
| `CreateTime` / `SnapshotFinishedTime` / `UploadFinishedTime` / `FinishedTime` | 任务创建、快照完成、上传完成、整体完成的时间戳。 |
| `Status` | 任务结果状态，`[OK]` 表示成功，否则会包含错误信息。 |
| `Timeout` | 任务超时时间（秒）。 |

## 第 4 步：查看 Repository 中的现有备份

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 备份盘点 / 恢复前确认 -->

通过以下 SQL 查看名为 `example_repo` 的 Repository 中的现有备份，其中 `Snapshot` 列是快照 Label，`Timestamp` 是时间戳：

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

执行[恢复](./restore)操作时，需要结合 `Snapshot` 与 `Timestamp` 唯一定位一个备份版本。

## 第 5 步：取消备份（如有需要）

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 异常终止 / 误操作回滚 -->

当备份任务执行异常或需要中止时，可通过以下 SQL 取消某个数据库下正在运行的备份任务：

```sql
CANCEL BACKUP FROM db_name;
```

更详细的用法可参考[取消备份](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)。

## 常见问题

### Q: 创建 Repository 失败怎么办？

通常由远程存储凭证错误、Endpoint 不可达、Bucket/容器不存在引起。检查 `endpoint`、`access key`、`secret key`、Bucket 名称是否正确，并确保 FE/BE 节点可访问远程存储。

### Q: MinIO 上备份失败怎么办？

通常是未启用 Virtual Host-style 但漏配 `use_path_style` 参数。在 `PROPERTIES` 中追加 `"use_path_style" = "true"`。

### Q: GCP/MinIO 报错缺少 region 怎么办？

`s3.region` 即使是占位值也必须填写，例如 `dummy-region`。

### Q: Azure Repository 创建失败怎么办？

Doris 3.1.3 以下版本不支持 Azure Blob Storage。升级至 Doris 3.1.3 及以上版本，并确认 `provider = AZURE`。

### Q: 同一数据库内备份/恢复任务报冲突怎么办？

一个数据库下同时只能运行一个备份或恢复任务。等待已有任务完成，或通过 `CANCEL BACKUP FROM db_name;` 取消后再发起新任务。

### Q: 存算分离集群无法备份怎么办？

存算分离模式下暂不支持备份/恢复功能。切换至存算一体模式，或采用其它数据导出方案。

### Q: 为什么物化视图没有被备份？

异步物化视图（MTMV）不在备份范围内。恢复后需在目标集群重新创建对应的物化视图。

### Q: 不同集群备份至同一路径出现数据错乱怎么解决？

使用了相同的快照 Label 导致路径冲突。不同集群对同一 Repository 路径备份时，请使用不同的 Label。

### Q: 恢复后动态分区为什么未生效？

备份/恢复不会自动启用动态分区。恢复后通过 `ALTER TABLE` 手动启用动态分区属性。

### Q: 恢复后共置表行为异常怎么办？

备份/恢复不会保留 `colocate_with` 属性。恢复后重新配置共置表的 `colocate_with` 属性。

## 相关文档

- [恢复](./restore)
- [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)
- [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)
- [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)
- [SHOW SNAPSHOT](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT)
- [SHOW REPOSITORIES](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES)
- [存储策略](../../../table-design/tiered-storage/remote-storage)
