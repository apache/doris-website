---
{
    "title": "备份",
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

有关备份的概念，请参阅[备份与恢复](./overview.md)。本指南提供了创建存储库和备份数据的逐步过程。

## 1. 创建存储库

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

根据您的存储选择适当的语句来创建存储库。有关详细用法，请参阅[创建存储库](../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY.md)

### 在 S3 上创建存储库

要在 S3 存储上创建存储库，请使用以下 SQL 命令：

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
- 提供适当的端点、访问密钥、秘密密钥和区域以进行 S3 设置。

### 在 Azure 上创建存储库

要在 Azure 存储上创建存储库，请使用以下 SQL 命令：

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://bucket_name/azure_repo"
PROPERTIES
(
    "s3.endpoint" = "selectdbcloudtestwestus3.blob.core.windows.net",
    "s3.region" = "dummy_region",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "provider" = "AZURE"
);
```

- 将 bucket_name 和 container 替换为您的 Azure 容器名称。
- 提供您的 Azure 存储帐户和密钥以进行身份验证。
- `s3.region` 只是一个虚假的区域。
- `provider` 必须为 `AZURE`。

### 在 GCP 上创建存储库

要在 Google Cloud Platform (GCP) 存储上创建存储库，请使用以下 SQL 命令：

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
- 提供您的 GCP 端点、访问密钥和秘密密钥。
- `s3.region` 只是一个虚假的区域。

### 在 OSS（阿里云对象存储服务）上创建存储库

要在 OSS 上创建存储库，请使用以下 SQL 命令：

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
- 提供您的 OSS 端点、区域访问密钥和秘密密钥。

### 在 MinIO 上创建存储库

要在 MinIO 存储上创建存储库，请使用以下 SQL 命令：

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
- 提供您的 MinIO 端点、访问密钥和秘密密钥。
- `s3.region` 只是一个虚假的区域。
- 如果您不启用虚拟主机样式，则 'use_path_style' 必须为 true。

### 在 HDFS 上创建存储库

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
- 提供您的 hdfs 端点和用户名。

## 2. 备份

请参考以下语句以备份数据库、表或分区。有关详细用法，请参阅[备份](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md)。

建议使用有意义的标签名称，例如包含备份中包含的数据库和表。

### 备份当前数据库

以下 SQL 语句将当前数据库备份到名为 `example_repo` 的存储库，并使用快照标签 `exampledb_20241225`。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```
- `exampledb_20241225` 是快照的唯一标识符。
- `example_repo` 是存储库的名称。

### 备份指定表

以下 SQL 语句将两个表备份到名为 `example_repo` 的存储库，并使用快照标签 `exampledb_tbl_tbl1_20241225`。

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```
- `exampledb_tbl_tbl1_20241225` 是快照的唯一标识符。
- `example_repo` 是存储库的名称。
- `example_tbl` 和 `example_tbl1` 是要备份的表的名称。

### 备份指定分区

以下 SQL 语句将名为 `example_tbl2` 的表和名为 `p1` 和 `p2` 的两个分区备份到名为 `example_repo` 的存储库，并使用快照标签 `example_tbl_p1_p2_tbl1_20241225`。

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

- `example_tbl_p1_p2_tbl1_20241225` 是快照的唯一标识符。
- `example_repo` 是存储库的名称。
- `example_tbl` 和 `example_tbl2` 是要备份的表的名称。

### 备份当前数据库，排除某些表

以下 SQL 语句将当前数据库备份到名为 `example_repo` 的存储库，并使用快照标签 `exampledb_20241225`，排除两个名为 `example_tbl` 和 `example_tbl1` 的表。

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```
- `exampledb_20241225` 是快照的唯一标识符。
- `example_repo` 是存储库的名称。
- `example_tbl` 和 `example_tbl1` 是要排除的表的名称。

## 3. 查看最近备份作业的执行情况

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

## 4. 查看存储库中的现有备份

以下 SQL 语句可用于查看名为 `example_repo` 的存储库中的现有备份。

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```