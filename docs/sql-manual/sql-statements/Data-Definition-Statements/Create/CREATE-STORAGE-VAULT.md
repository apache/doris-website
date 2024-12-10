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
| `s3.endpoint`    | required    | The endpoint used for object storage. <br/>**Notice**, please don't provide the endpoint with any `http://` or `https://`. And for Azure Blob Storage, the endpoint should be like `${ak}.blob.core.windows.net/`. |
| `s3.region`      | required    | The region of your bucket.(Not required when you'r using GCP or AZURE).                                                                                                                               |
| `s3.root.path`   | required    | The path where the data would be stored.                                                                                                                                |
| `s3.bucket`      | required    | The bucket of your object storage account. (StorageAccount if you're using Azure).                                                                                                                                |
| `s3.access_key`  | required    | The access key of your object storage account. (AccountName if you're using Azure).                                                                                                                                |
| `s3.secret_key`  | required    | The secret key of your object storage account. (AccountKey if you're using Azure).                                                                                                                                |
| `provider`       | required    | The cloud vendor which provides the object storage service. The supported values include `COS`, `OSS`, `S3`, `OBS`, `BOS`, `AZURE`, `GCP`                                                                                                                                |
| `use_path_style` | optional    | Indicate using `path-style` URL or `virtual-hosted-style URL`, default `false` (`virtual-hosted-style`)                                                                                                               |

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
    CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
        PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="hdfs://127.0.0.1:8020"
        );
    ```

2. create a S3 storage vault using azure.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_vault
        PROPERTIES (
        "type"="S3",
        "s3.endpoint"="ak.blob.core.windows.net/",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "s3.root.path" = "ssb_sf1_p2_s3",
        "s3.bucket" = "doris-build-1308700295",
        "provider" = "AZURE"
        );
    ```

3. create a S3 storage vault using OSS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_vault
        PROPERTIES (
        "type"="S3",
        "s3.endpoint"="oss.aliyuncs.com",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "s3.region" = "cn-hangzhou",
        "s3.root.path" = "ssb_sf1_p2_s3",
        "s3.bucket" = "doris-build-1308700295",
        "provider" = "OSS"
        );
    ```

4. create a S3 storage vault using COS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_vault
        PROPERTIES (
        "type"="S3",
        "s3.endpoint"="cos.ap-guangzhou.myqcloud.com",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "s3.region" = "ap-guangzhou",
        "s3.root.path" = "ssb_sf1_p2_s3",
        "s3.bucket" = "doris-build-1308700295",
        "provider" = "COS"
        );
    ```

5. create a S3 storage vault using OBS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_vault
        PROPERTIES (
        "type"="S3",
        "s3.endpoint"="obs.cn-north-4.myhuaweicloud.com",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "s3.region" = "cn-north-4",
        "s3.root.path" = "ssb_sf1_p2_s3",
        "s3.bucket" = "doris-build-1308700295",
        "provider" = "OBS"
        );
    ```

6. create a S3 storage vault using AWS.
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_vault
        PROPERTIES (
        "type"="S3",
        "s3.endpoint"="s3.us-east-1.amazonaws.com",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "s3.region" = "us-east-1",
        "s3.root.path" = "ssb_sf1_p2_s3",
        "s3.bucket" = "doris-build-1308700295",
        "provider" = "S3"
        );
    ```
7. create a S3 storage vault using MinIO.
   ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_vault
        PROPERTIES (
        "type"="S3",
        "s3.endpoint"="127.0.0.1:9000",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "s3.region" = "us-east-1",
        "s3.root.path" = "ssb_sf1_p2_s3",
        "s3.bucket" = "doris-build-1308700295",
        "provider" = "S3"
        );
   ```

### Keywords

    CREATE, STORAGE VAULT
