---
{
    "title": "Creating a Repository",
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

In Apache Doris, a **repository** is a remote storage location used for backing up and restoring data. Repositories support various storage systems including **S3**, **Azure**, **GCP**, **OSS**, **COS**, **MinIO**, **HDFS**, and other storages compatible with S3. This guide walks you through the steps of creating a repository to use for backup and restore operations in Doris.

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

To create a repository for S3 storage, use the following SQL command:

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://bucket_name/test"
PROPERTIES
(
    "AWS_ENDPOINT" = "http://xxxx.xxxx.com",
    "AWS_ACCESS_KEY" = "xxxx",
    "AWS_SECRET_KEY" = "xxx",
    "AWS_REGION" = "xxx"
);
```

- Replace bucket_name with the name of your S3 bucket.
- Provide the appropriate endpoint, access key, secret key, and region for your S3 setup.

## Creating a Repository for Azure

To create a repository for Azure storage, use the following SQL command:

```sql
CREATE REPOSITORY `azure_repo`
WITH AZURE
ON LOCATION "azure://bucket_name/container"
PROPERTIES
(
    "AZURE_STORAGE_ACCOUNT" = "your_storage_account",
    "AZURE_STORAGE_KEY" = "your_storage_key"
);
```

- Replace bucket_name and container with your Azure container information.
- Provide your Azure storage account and key for authentication.

## Creating a Repository for GCP

To create a repository for Google Cloud Platform (GCP) storage, use the following SQL command:

```sql
CREATE REPOSITORY `gcp_repo`
WITH GCP
ON LOCATION "gs://bucket_name"
PROPERTIES
(
    "GCP_PROJECT_ID" = "your_project_id",
    "GCP_ACCESS_KEY" = "your_access_key",
    "GCP_SECRET_KEY" = "your_secret_key"
);
```

- Replace bucket_name with the name of your GCP bucket.
- Provide your GCP project ID, access key, and secret key.

## Creating a Repository for OSS (Alibaba Cloud Object Storage Service)

To create a repository for OSS, use the following SQL command:

```sql
CREATE REPOSITORY `oss_repo`
WITH OSS
ON LOCATION "oss://bucket_name"
PROPERTIES
(
    "OSS_ACCESS_KEY_ID" = "your_access_key",
    "OSS_ACCESS_KEY_SECRET" = "your_secret_key",
    "OSS_ENDPOINT" = "your_oss_endpoint"
);
```
- Replace bucket_name with the name of your OSS bucket.
- Provide your OSS access key, secret key, and endpoint.

## Creating a Repository for MinIO

To create a repository for MinIO storage, use the following SQL command:

```sql
CREATE REPOSITORY `minio_repo`
WITH MINIO
ON LOCATION "minio://bucket_name"
PROPERTIES
(
    "MINIO_ACCESS_KEY" = "your_access_key",
    "MINIO_SECRET_KEY" = "your_secret_key",
    "MINIO_ENDPOINT" = "your_minio_endpoint"
);
```

- Replace bucket_name with the name of your MinIO bucket.
- Provide your MinIO access key, secret key, and endpoint.

## Creating a Repository for HDFS

```sql
CREATE REPOSITORY `hdfs_repo`
WITH HDFS
ON LOCATION "hdfs://namenode_host:port/path"
PROPERTIES
(
    "fs.defaultFS" = "hdfs://namenode_host:port",
    "hadoop.username" = "hadoop_user"
);
```

For more detailed usage instructions and examples, refer to the CREATE REPOSITORY documentation.
