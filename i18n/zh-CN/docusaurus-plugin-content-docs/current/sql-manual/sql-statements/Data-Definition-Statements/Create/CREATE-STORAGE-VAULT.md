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

### Description

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
| `s3.endpoint`    | 必需   | 用于对象存储的端点。<br/>注意，请不要提供带有 http:// 或 https:// 开头的链接。对于 Azure Blob 存储，链接应该像 ${ak}.blob.core.windows.net/。 |
| `s3.region`      | 必需   | 您的存储桶的区域。(如果您使用 GCP 或 AZURE,则不需要)。 |
| `s3.root.path`   | 必需   | 存储数据的路径。 |
| `s3.bucket`      | 必需   | 您的对象存储账户的存储桶。(如果您使用 Azure,则为 StorageAccount)。 |
| `s3.access_key`  | 必需   | 您的对象存储账户的访问密钥。(如果您使用 Azure,则为 AccountName)。 |
| `s3.secret_key`  | 必需   | 您的对象存储账户的秘密密钥。(如果您使用 Azure,则为 AccountKey)。 |
| `provider`       | 必需   | 提供对象存储服务的云供应商。支持的值有`COS`，`OSS`，`S3`，`OBS`，`BOS`，`AZURE`，`GCP` |
| `use_path_style` | 可选   | 使用 path-style URL 或者 virtual-hosted-style URL, 默认值 false(virtual-hosted-style)                                                                                      |

##### HDFS vault

| 参数                               | 是否必需 | 描述                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |必需| Hadoop 配置属性,指定要使用的默认文件系统。                             |
| `path_prefix`                    |可选| 存储数据的路径前缀。如果没有指定则会使用 user 账户下的默认路径。                   |
| `hadoop.username`                |可选| Hadoop 配置属性，指定访问文件系统的用户。如果没有指定则会使用启动 hadoop 进程的 user。 |
| `hadoop.security.authentication` |可选| 用于 hadoop 的认证方式。如果希望使用 kerberos 则可以填写`kerberos`。      |
| `hadoop.kerberos.principal`      |可选| 您的 kerberos 主体的路径。      |
| `hadoop.kerberos.keytab`         |可选|  您的 kerberos keytab 的路径。      |

### 示例

1. 创建 HDFS storage vault。
    ```sql
    CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
        PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="hdfs://127.0.0.1:8020"
        );
    ```

2. 创建微软 azure S3 storage vault。
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

3. 创建阿里云 OSS S3 storage vault。
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

4. 创建腾讯云 COS S3 storage vault。
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

5. 创建华为云 OBS S3 storage vault。
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

6. 创建亚马逊云 S3 storage vault。
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
7. 创建 MinIO S3 storage vault。
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

### 关键词

    CREATE, STORAGE VAULT
