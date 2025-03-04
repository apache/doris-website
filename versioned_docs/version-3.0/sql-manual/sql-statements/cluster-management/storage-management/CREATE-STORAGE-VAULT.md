---
{
    "title": "CREATE-STORAGE-VAULT",
    "language": "en",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4
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

## CREATE-STORAGE-VAULT

### Description

This command is used to create a storage vault. The subject of this document describes the syntax for creating Doris self-maintained storage vault.

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] vault
[properties]
```


#### properties

| param  | is required | desc                                                   |
|:-------|:------------|:-------------------------------------------------------|
| `type` | required    | Only two types of vaults are allowed: `S3` and `HDFS`. |

##### S3 Vault

| param           | is required | desc                                                                                                                                                                                                               |
|:----------------|:------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | required    | The endpoint used for object storage. <br/>**Notice**, please don't provide the endpoint with any `http://` or `https://`. And for Azure Blob Storage, the endpoint should be `blob.core.windows.net`. |
| `s3.region`      | required    | The region of your bucket.(If you are using GCP or Azure, you can specify us-east-1).                                                                                                                               |
| `s3.root.path`   | required    | The path where the data would be stored.                                                                                                                                |
| `s3.bucket`      | required    | The bucket of your object storage account. (StorageAccount if you're using Azure).                                                                                                                                |
| `s3.access_key`  | required    | The access key of your object storage account. (AccountName if you're using Azure).                                                                                                                                |
| `s3.secret_key`  | required    | The secret key of your object storage account. (AccountKey if you're using Azure).                                                                                                                                |
| `provider`       | required    | The cloud vendor which provides the object storage service. The supported values include `COS`, `OSS`, `S3`, `OBS`, `BOS`, `AZURE`, `GCP`                                                                                                                                |
| `use_path_style` | optional    | Indicate using `path-style URL`(private environment recommended) or `virtual-hosted-style URL`(public cloud recommended), default `true` (`path-style`)                                                                                                               |

##### HDFS Vault

| param                            | is required | desc                                                                                                                                                         |
|:---------------------------------|:------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `fs.defaultFS`                   | required    | Hadoop configuration property that specifies the default file system to use.                                                                                 |
| `path_prefix`                    | optional    | The path prefix to where the data would be stored. It would be the root_path of your Hadoop user if you don't provide any prefix.                            |
| `hadoop.username`                | optional    | Hadoop configuration property that specifies the user accessing the file system. It would be the user starting Hadoop process if you don't provide any user. |
| `hadoop.security.authentication` | optional    | The authentication way used for hadoop. If you'd like to use kerberos you can provide with `kerboros`.                                                       |
| `hadoop.kerberos.principal`      | optional    | The path to your kerberos principal.                                                       |
| `hadoop.kerberos.keytab`         | optional    | The path to your kerberos keytab.                                                       |

### Example

1. create a HDFS storage vault.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
    PROPERTIES (
        "type" = "hdfs",                                     -- required
        "fs.defaultFS" = "hdfs://127.0.0.1:8020",            -- required
        "path_prefix" = "big/data",                          -- optional
        "hadoop.username" = "user"                           -- optional
        "hadoop.security.authentication" = "kerberos"        -- optional
        "hadoop.kerberos.principal" = "hadoop/127.0.0.1@XXX" -- optional
        "hadoop.kerberos.keytab" = "/etc/emr.keytab"         -- optional
    );
    ```

2. create a S3 storage vault using OSS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS oss_demo_vault
    PROPERTIES (
        "type" = "S3",                                       -- required
        "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",       -- required
        "s3.access_key" = "xxxxxx",                          -- required,  Your OSS access key
        "s3.secret_key" = "xxxxxx",                          -- required,  Your OSS secret key
        "s3.region" = "cn-beijing",                          -- required
        "s3.root.path" = "oss_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                              -- required,  Your OSS bucket name
        "provider" = "OSS",                                  -- required
        "use_path_style" = "false"                           -- optional,  OSS suggest setting `false`
    );
    ```

3. create a S3 storage vault using COS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS cos_demo_vault
    PROPERTIES (
        "type" = "S3",
        "s3.endpoint" = "cos.ap-guangzhou.myqcloud.com",     -- required
        "s3.access_key" = "xxxxxx",                          -- required,  Your COS access key
        "s3.secret_key" = "xxxxxx",                          -- required,  Your COS secret key
        "s3.region" = "ap-guangzhou",                        -- required
        "s3.root.path" = "cos_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                              -- required,  Your COS bucket name
        "provider" = "COS",                                  -- required
        "use_path_style" = "false"                           -- optional,  COS suggest setting `false`
    );
    ```

4. create a S3 storage vault using OBS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS obs_demo_vault
    PROPERTIES (
        "type" = "S3",                                       -- required
        "s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",  -- required
        "s3.access_key" = "xxxxxx",                          -- required,  Your OBS access key
        "s3.secret_key" = "xxxxxx",                          -- required,  Your OBS secret key
        "s3.region" = "cn-north-4",                          -- required
        "s3.root.path" = "obs_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                              -- required,  Your OBS bucket name
        "provider" = "OBS",                                  -- required
        "use_path_style" = "false"                           -- optional,  OBS suggest setting `false`
    );
    ```

5. create a S3 storage vault using BOS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS obs_demo_vault
    PROPERTIES (
        "type" = "S3",                                       -- required
        "s3.endpoint" = "s3.bj.bcebos.com",                  -- required
        "s3.access_key" = "xxxxxx",                          -- required,  Your BOS access key
        "s3.secret_key" = "xxxxxx",                          -- required,  Your BOS secret key
        "s3.region" = "bj",                                  -- required
        "s3.root.path" = "bos_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                              -- required,  Your BOS bucket name
        "provider" = "BOS",                                  -- required
        "use_path_style" = "false"                           -- optional,  BOS suggest setting `false`
    );
    ```

6. create a S3 storage vault using AWS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
    PROPERTIES (
        "type" = "S3",                                      -- required
        "s3.endpoint" = "s3.us-east-1.amazonaws.com",       -- required
        "s3.access_key" = "xxxxxx",                         -- required,  Your S3 access key
        "s3.secret_key" = "xxxxxx",                         -- required,  Your S3 secret key
        "s3.region" = "us-east-1",                          -- required
        "s3.root.path" = "s3_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                             -- required,  Your S3 bucket name
        "provider" = "S3",                                  -- required
        "use_path_style" = "false"                          -- optional,  S3 suggest setting `false`
    );
    ```
7. create a S3 storage vault using MinIO.
   ```sql
    CREATE STORAGE VAULT IF NOT EXISTS minio_demo_vault
    PROPERTIES (
        "type" = "S3",                                     -- required
        "s3.endpoint" = "127.0.0.1:9000",                  -- required
        "s3.access_key" = "xxxxxx",                        -- required,  Your minio access key
        "s3.secret_key" = "xxxxxx",                        -- required,  Your minio secret key
        "s3.region" = "us-east-1",                         -- required
        "s3.root.path" = "minio_demo_vault_prefix",        -- required
        "s3.bucket" = "xxxxxx",                            -- required,  Your minio bucket name
        "provider" = "S3",                                 -- required
        "use_path_style" = "true"                          -- required,  minio suggest setting `true`
    );
   ```

8. create a S3 storage vault using AZURE.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS azure_demo_vault
    PROPERTIES (
        "type" = "S3",                                       -- required
        "s3.endpoint" = "blob.core.windows.net",             -- required
        "s3.access_key" = "xxxxxx",                          -- required,  Your Azure AccountName
        "s3.secret_key" = "xxxxxx",                          -- required,  Your Azure AccountKey
        "s3.region" = "us-east-1",                           -- required
        "s3.root.path" = "azure_demo_vault_prefix",          -- required
        "s3.bucket" = "xxxxxx",                              -- required,  Your Azure StorageAccount
        "provider" = "AZURE"                                 -- required
    );
    ```

9. create a S3 storage vault using GCP.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS gcp_demo_vault
    PROPERTIES (
        "type" = "S3",                                       -- required
        "s3.endpoint" = "storage.googleapis.com",            -- required
        "s3.access_key" = "xxxxxx",                          -- required
        "s3.secret_key" = "xxxxxx",                          -- required
        "s3.region" = "us-east-1",                           -- required
        "s3.root.path" = "gcp_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                              -- required
        "provider" = "GCP"                                   -- required
    );
    ```

**Note**

[The s3.access_key corresponds to the Access ID of the GCP HMAC key](https://cloud.google.com/storage/docs/authentication/hmackeys)

[The s3.secret_key corresponds to the Secret of the GCP HMAC key](https://cloud.google.com/storage/docs/authentication/hmackeys)

### Keywords

    CREATE, STORAGE VAULT
