---
{
    "title": "备份",
    "language": "zh-CN",
    "description": "有关备份的概念，请参阅备份与恢复。本指南提供了创建 Repository 和备份数据的操作步骤。"
}
---

有关备份的概念，请参阅[备份与恢复](./overview.md)。本指南提供了创建 Repository 和备份数据的操作步骤。

## 第 1 步。创建 Repository

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

根据您的存储选择适当的语句来创建 Repository。有关详细用法，请参阅[创建 Repository ](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)。在不同集群使用相同路径的 Repository 进行备份时，请确保使用不同的 Label，以避免冲突造成数据错乱。

### 方法 1: 在 S3 上创建 Repository

要在 S3 存储上创建 Repository，请使用以下 SQL 命令：

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

- 将 bucket_name 替换为您的 S3 存储桶名称。
- 提供适当的 endpoint、access key、secret key 和 region 以进行 S3 设置。

### 方法 2: 在 Azure 上创建 Repository

**自 Doris 3.1.3 开始支持**

要在 Azure 存储上创建 Repository，请使用以下 SQL 命令：

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

- 将 <container_name> 替换为您的 Azure 容器名称。
- 提供您的 Azure 存储帐户和密钥以进行身份验证。
- `provider` 必须为 `AZURE`。

### 方法 3: 在 GCP 上创建 Repository

要在 Google Cloud Platform (GCP) 存储上创建 Repository，请使用以下 SQL 命令：

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

- 将 bucket_name 替换为您的 GCP 存储桶名称。
- 提供您的 GCP endpoint、access key 和 secret key。
- `s3.region` 只是一个虚假的 region，任意指定一个即可，但是必须要指定。

### 方法 4: 在 OSS（阿里云对象存储服务）上创建 Repository

要在 OSS 上创建 Repository，请使用以下 SQL 命令：

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
- 将 bucket_name 替换为您的 OSS 存储桶名称。
- 提供您的 OSS endpoint、region、access key 和 secret key。

### 方法 5: 在 MinIO 上创建 Repository

要在 MinIO 存储上创建 Repository，请使用以下 SQL 命令：

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

- 将 bucket_name 替换为您的 MinIO 存储桶名称。
- 提供您的 MinIO endpoint、access key 和 secret key。
- `s3.region` 只是一个虚假的 region，任意指定一个即可，但是必须要指定。
- 如果您不启用 Virtual Host-style，则 'use_path_style' 必须为 true。

### 方法 6: 在 HDFS 上创建 Repository

要在 HDFS 存储上创建 Repository，请使用以下 SQL 命令：

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

- 将 prefix_path 替换为真实路径。
- 提供您的 hdfs endpoint 和用户名。

## 第 2 步。备份

请参考以下语句以备份数据库、表或分区。有关详细用法，请参阅[备份](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)。

建议使用有意义的 Label 名称，例如包含备份中包含的数据库和表。

### 方法 1: 备份当前数据库

以下 SQL 语句将当前数据库备份到名为 `example_repo` 的 Repository，并使用快照 Label `exampledb_20241225`。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### 方法 2: 备份指定数据库

以下 SQL 语句将名为 destdb 的数据库备份到名为 `example_repo` 的 Repository，并使用快照 Label `destdb_20241225`。

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### 方法 3: 备份指定表

以下 SQL 语句将两个表备份到名为 `example_repo` 的 Repository，并使用快照 Label `exampledb_tbl_tbl1_20241225`。

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### 方法 4: 备份指定分区

以下 SQL 语句将名为 `example_tbl2` 的表和名为 `p1` 和 `p2` 的两个分区备份到名为 `example_repo` 的 Repository，并使用快照 Label `example_tbl_p1_p2_tbl1_20241225`。

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### 方法 5: 备份当前数据库，排除某些表

以下 SQL 语句将当前数据库备份到名为 `example_repo` 的 Repository，并使用快照 Label `exampledb_20241225`，排除两个名为 `example_tbl` 和 `example_tbl1` 的表。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## 第 3 步。查看最近备份作业的执行情况

以下 SQL 语句可用于查看最近备份作业的执行情况。

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

## 第 4 步。查看 Repository 中的现有备份

以下 SQL 语句可用于查看名为 `example_repo` 的 Repository 中的现有备份，其中 Snapshot 列是快照 Label，Timestamp 是时间戳。

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

## 第 5 步。取消备份（如有需要）

可以使用 `CANCEL BACKUP FROM db_name;` 取消一个数据库中的备份任务。更具体的用法可以参考[取消备份](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)。

