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

该命令用于创建存储库。本文档的主题描述了创建 Doris 自管理存储库的语法。

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] vault
[properties]
```

#### properties

* `type`
    只允许两种类型的存储库:S3 和 HDFS。-- 必需

##### S3 Vault

`s3.endpoint` 
    用于对象存储的端点。注意,请不要提供带有 http:// 或 https:// 的端点。对于 Azure Blob 存储,端点应该像 ${ak}.blob.core.windows.net/。-- 必需

`s3.region` 
    您的存储桶的区域。(如果您使用 GCP 或 AZURE,则不需要)。-- 必需

`s3.root.path` 
    存储数据的路径。-- 必需

`s3.bucket` 
    您的对象存储账户的存储桶。(如果您使用 Azure,则为 StorageAccount)。-- 必需

`s3.access_key` 
    您的对象存储账户的访问密钥。(如果您使用 Azure,则为 AccountName)。-- 必需

`s3.secret_key` 
    您的对象存储账户的秘密密钥。(如果您使用 Azure,则为 AccountKey)。-- 必需

`provider` 
    提供对象存储服务的云供应商。-- 必需


##### HDFS vault

`fs.defaultFS` 
    Hadoop 配置属性,指定要使用的默认文件系统。-- 必需

`path_prefix` 
    存储数据的路径前缀。-- 可选

`hadoop.username` 
    Hadoop 配置属性,指定访问文件系统的用户。-- 可选

`hadoop.security.authentication` 
    用于 hadoop 的认证方式。-- 可选

`hadoop.kerberos.principal` 
    您的 kerberos 主体的路径。-- 可选

`hadoop.kerberos.keytab` 
    您的 kerberos keytab 的路径。-- 可选


### 示例

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

### 关键词

    CREATE, STORAGE VAULT