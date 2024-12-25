---
{
    "title": "Preparing Backup Storage",
    "language": "en"
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

## Overview

In Doris, a **repository** is a remote storage location used for backing up and restoring data. Repositories support various storage systems including **S3**, **Azure**, **GCP**, **OSS**, **COS**, **MinIO**, **HDFS**, and other storages compatible with S3. This guide walks you through the steps of creating a repository to use for backup and restore operations in Doris.

## Permission Requirements

- Only users with **ADMIN** privileges are allowed to create repositories for backup and restore operations.

## Supported Storage Systems

- **S3**
- **Azure**
- **GCP**
- **OSS**
- **COS**
- **MinIO**
- **HDFS**
- Other storages compatible with S3

## Creating a Repository for S3

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

To create a repository for S3 storage, use the following SQL command:

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

- Replace bucket_name with the name of your S3 bucket.
- Provide the appropriate endpoint, access key, secret key, and region for your S3 setup.

## Creating a Repository for Azure

To create a repository for Azure storage, use the following SQL command:

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

- Replace bucket_name and container with your Azure container information.
- Provide your Azure storage account and key for authentication.

## Creating a Repository for GCP

To create a repository for Google Cloud Platform (GCP) storage, use the following SQL command:

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

- Replace bucket_name with the name of your GCP bucket.
- Provide your GCP endpoint, region, access key, and secret key.

## Creating a Repository for OSS (Alibaba Cloud Object Storage Service)

To create a repository for OSS, use the following SQL command:

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
- Replace bucket_name with the name of your OSS bucket.
- Provide your OSS access key, secret key, and endpoint.

## Creating a Repository for MinIO

To create a repository for MinIO storage, use the following SQL command:

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

- Replace bucket_name with the name of your MinIO bucket.
- Provide your MinIO access key, secret key, and endpoint.

## Creating a Repository for HDFS

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

- Replace prefix_path with the real path.
- Provide your hdfs endpoint and username.

For more detailed usage instructions and examples, refer to the CREATE REPOSITORY documentation.
