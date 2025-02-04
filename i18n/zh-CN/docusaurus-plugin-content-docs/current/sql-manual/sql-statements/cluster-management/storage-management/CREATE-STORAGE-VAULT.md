---
{
    "title": "CREATE-STORAGE-VAULT",
    "language": "zh-CN",
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

## 描述

该命令用于创建存储库。本文档的主题描述了创建 Doris 自管理存储库的语法。

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] vault
[properties]
```

#### properties

| 参数     | 是否必需 | 描述                     |
|:-------|:-----|:-----------------------|
| `type` | 必需   | 只允许两种类型的存储库:S3 和 HDFS。 |

##### S3 Vault

| 参数              | 是否必需 | 描述                                                                                                      |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | 必需   | 用于对象存储的端点。<br/>注意，请不要提供带有 http:// 或 https:// 开头的链接。对于 Azure Blob 存储，endpoint是固定的blob.core.windows.net。 |
| `s3.region`      | 必需   | 您的存储桶的区域。(如果您使用 GCP 或 AZURE,则不需要)。 |
| `s3.root.path`   | 必需   | 存储数据的路径。 |
| `s3.bucket`      | 必需   | 您的对象存储账户的存储桶。(如果您使用 Azure,则为 StorageAccount)。 |
| `s3.access_key`  | 必需   | 您的对象存储账户的访问密钥。(如果您使用 Azure,则为 AccountName)。 |
| `s3.secret_key`  | 必需   | 您的对象存储账户的秘密密钥。(如果您使用 Azure,则为 AccountKey)。 |
| `provider`       | 必需   | 提供对象存储服务的云供应商。支持的值有`COS`，`OSS`，`S3`，`OBS`，`BOS`，`AZURE`，`GCP` |
| `use_path_style` | 可选   | 使用 `path-style URL`(私有化部署环境)或者`virtual-hosted-style URL`(公有云环境建议), 默认值 `true` (path-style)                                                                                      |

##### HDFS vault

| 参数                               | 是否必需 | 描述                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |必需| Hadoop 配置属性,指定要使用的默认文件系统。                             |
| `path_prefix`                    |可选| 存储数据的路径前缀。如果没有指定则会使用 user 账户下的默认路径。                   |
| `hadoop.username`                |可选| Hadoop 配置属性，指定访问文件系统的用户。如果没有指定则会使用启动 hadoop 进程的 user。 |
| `hadoop.security.authentication` |可选| 用于 hadoop 的认证方式。如果希望使用 kerberos 则可以填写`kerberos`。      |
| `hadoop.kerberos.principal`      |可选| 您的 kerberos 主体的路径。      |
| `hadoop.kerberos.keytab`         |可选| 您的 kerberos keytab 的路径。      |

### 示例

1. 创建 HDFS storage vault。
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
    PROPERTIES (
        "type" = "hdfs",                                     -- required
        "fs.defaultFS" = "hdfs://127.0.0.1:8020",            -- required
        "path_prefix" = "big/data",                          -- optional,  一般按照业务名称填写
        "hadoop.username" = "user"                           -- optional
        "hadoop.security.authentication" = "kerberos"        -- optional
        "hadoop.kerberos.principal" = "hadoop/127.0.0.1@XXX" -- optional
        "hadoop.kerberos.keytab" = "/etc/emr.keytab"         -- optional
    );
    ```

2. 创建阿里云 OSS storage vault。
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
        "use_path_style" = "false"                           -- optional,  OSS 建议设置false
    );
    ```

3. 创建腾讯云 COS storage vault。
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
        "use_path_style" = "false"                           -- optional,  COS 建议设置false
    );
    ```

4. 创建华为云 OBS storage vault。
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS obs_demo_vault
    PROPERTIES (
        "type" = "S3",                                       -- required
        "s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",  -- required
        "s3.access_key" = "xxxxxx",                          -- required,  Your OBS access key
        "s3.secret_key" = "xxxxxx",                          -- required,  Your OBS secret key
        "s3.region" = "cn-north-4",                          -- required
        "s3.root.path" = "obs_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                              -- required,  Your COS bucket name
        "provider" = "OBS",                                  -- required
        "use_path_style" = "false"                           -- optional,  OBS 建议设置false
    );
    ```

5. 创建百度云 BOS storage vault。
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
        "use_path_style" = "false"                           -- optional,  BOS 建议设置false
    );
    ```

6. 创建亚马逊云 S3 storage vault。
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
    PROPERTIES (
        "type" = "S3",                                      -- required
        "s3.endpoint" = "s3.us-east-1.amazonaws.com",       -- required
        "s3.access_key" = "xxxxxx",                         -- required,  Your S3 access key
        "s3.secret_key" = "xxxxxx",                         -- required,  Your OBS secret key
        "s3.region" = "us-east-1",                          -- required
        "s3.root.path" = "s3_demo_vault_prefix",            -- required
        "s3.bucket" = "xxxxxx",                             -- required,  Your s3 bucket name
        "provider" = "S3",                                  -- required
        "use_path_style" = "false"                          -- optional,  S3 建议设置false
    );
    ```

7. 创建 MinIO storage vault。
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
        "use_path_style" = "true"                          -- required,  minio 建议设置true
    );
   ```

8. 创建微软 AZURE storage vault。
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

9. 创建谷歌 GCP storage vault。
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

### 关键词

    CREATE, STORAGE VAULT
