---
{
    "title": "准备备份存储",
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

## 概述

在Doris中，**存储库**是用于备份和恢复数据的远程存储位置。存储库支持多种存储系统，包括**S3**、**Azure**、**GCP**、**OSS**、**COS**、**MinIO**、**HDFS**以及其他与S3兼容的存储。此指南将引导您完成创建存储库以用于Doris中的备份和恢复操作的步骤。

## 权限要求

- 只有具有**ADMIN**权限的用户才能创建用于备份和恢复操作的存储库。

## 支持的存储系统

- **S3**
- **Azure**
- **GCP**
- **OSS**
- **COS**
- **MinIO**
- **HDFS**
- 其他与S3兼容的存储

## 为S3创建存储库

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

要为S3存储创建存储库，请使用以下SQL命令：

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

- 将bucket_name替换为您的S3存储桶名称。
- 提供适当的端点、访问密钥、秘密密钥和区域以进行S3设置。

## 为Azure创建存储库

要为Azure存储创建存储库，请使用以下SQL命令：

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

- 将bucket_name和container替换为您的Azure容器信息。
- 提供您的Azure存储帐户和密钥以进行身份验证。

## 为GCP创建存储库

要为Google Cloud Platform（GCP）存储创建存储库，请使用以下SQL命令：

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

- 将bucket_name替换为您的GCP存储桶名称。
- 提供您的GCP端点、区域、访问密钥和秘密密钥。

## 为OSS（阿里云对象存储服务）创建存储库

要为OSS创建存储库，请使用以下SQL命令：

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
- 将bucket_name替换为您的OSS存储桶名称。
- 提供您的OSS访问密钥、秘密密钥和端点。

## 为MinIO创建存储库

要为MinIO存储创建存储库，请使用以下SQL命令：

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

- 将bucket_name替换为您的MinIO存储桶名称。
- 提供您的MinIO访问密钥、秘密密钥和端点。

## 为HDFS创建存储库

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

- 将prefix_path替换为实际路径。
- 提供您的hdfs端点和用户名。

有关更详细的使用说明和示例，请参阅CREATE REPOSITORY文档（../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY）。
