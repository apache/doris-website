---
{
    "title": "CREATE REPOSITORY",
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

## Description

This statement is used to create a repository. Repositories are used for backup or restore.

## Syntax

```sql
CREATE [READ ONLY] REPOSITORY <repo_name>
    WITH [ S3 | HDFS ]
    ON LOCATION <repo_location>
    PROPERTIES (
              -- S3 or HDFS storage property
              <storage_property>
              [ , ... ]
    )
```

## Required Parameters
**<repo_name>**
> The unique name of the repository.

**<repo_location>**
> The storage path of the repository.

**<storage_property>**
> The properties of the repository. The corresponding parameters should be selected based on whether S3 or HDFS is chosen as the storage medium.

**<storage_property>** Optional parameters are as follows, and additional parameters can be added based on the actual environment.

| 参数                      | 说明                                 |
|-------------------------|------------------------------------|
| **s3.endpoint**         | S3 service endpoint                    |
| **s3.access_key**       | S3 access key                          |
| **s3.secret_key**       | S3 secret key                          |
| **s3.region**           | S3 region                              |
| **use_path_style**      | Whether to use path-style access for S3 (applies to MinIO) |
| **fs.defaultFS**        | Hadoop default file system URI        |
| **hadoop.username**     | Hadoop username                       |


## Access Control Requirements

| Privilege               | Object                         | Notes                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | Entire cluster management permissions | Only the root or superuser can create repositories  |


## Usage notes
- If it is a read-only repository, restoration can only be performed on the repository. If not, both backup and restoration operations can be performed.
- The properties (PROPERTIES) vary depending on whether it is S3 or HDFS, as shown in the example.
- For ON LOCATION, if it is S3, the following should be the S3 Bucket Name.
- When performing data migration, the same repository must be created in both the source and destination clusters so that the destination cluster can view the data snapshot from the source cluster's backup.
- Any user can view the repositories that have been created by using the [SHOW REPOSITORIES](./SHOW-REPOSITORIES) command.


## Examples

Create a repository named s3_repo.

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://s3-repo"
PROPERTIES
(
    "s3.endpoint" = "http://s3-REGION.amazonaws.com",
    "s3.region" = "s3-REGION",
    "s3.access_key" = "AWS_ACCESS_KEY",
    "s3.secret_key"="AWS_SECRET_KEY",
    "s3.region" = "REGION"
);
```

Create a repository named hdfs_repo.

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://hadoop-name-node:54310/path/to/repo/"
PROPERTIES
(
    "fs.defaultFS"="hdfs://hadoop-name-node:54310",
    "hadoop.username"="user"
);
```

Create a repository named minio_repo to link minio storage directly through the S3 protocol.

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
(
    "s3.endpoint" = "http://minio.com",
    "s3.access_key" = "MINIO_USER",
    "s3.secret_key"="MINIO_PASSWORD",
    "s3.region" = "REGION",
    "use_path_style" = "true"
);
```

Create a repository named minio_repo via temporary security credentials.

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
( 
    "s3.endpoint" = "AWS_ENDPOINT",
    "s3.access_key" = "AWS_TEMP_ACCESS_KEY",
    "s3.secret_key" = "AWS_TEMP_SECRET_KEY",
    "s3.session_token" = "AWS_TEMP_TOKEN",
    "s3.region" = "AWS_REGION"
)
```

Create repository using Tencent COS

```sql
CREATE REPOSITORY `cos_repo`
WITH S3
ON LOCATION "s3://backet1/"
PROPERTIES
(
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "http://cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing"
);
```