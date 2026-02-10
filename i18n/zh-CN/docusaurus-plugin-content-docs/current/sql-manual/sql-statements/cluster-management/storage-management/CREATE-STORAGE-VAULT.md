---
{
    "title": "CREATE-STORAGE-VAULT",
    "language": "zh-CN",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "该命令用于创建存储库。本文档的主题描述了创建 Doris 自管理存储库的语法。"
}
---

## 描述

该命令用于创建存储库。本文档的主题描述了创建 Doris 自管理存储库的语法。


## 语法

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <`vault_name`> [ <`properties`> ]
```

## 必选参数

| 参数     | 描述                     |
|-------|-----------------------|
| `vault_name` |  存储库的名称。这是您要创建的新存储库的唯一标识符。 |

## 可选参数
| 参数   | 描述                                                         |
|-------------------|--------------------------------------------------------------|
| `[IF NOT EXISTS]` | 如果指定的存储库已经存在，则不会执行创建操作，并且不会抛出错误。这可以防止重复创建相同的存储库。 |
| `PROPERTIES`      | 一组键值对，用来设置或更新存储库的具体属性。每个属性由键（`<key>`）和值（`<value>`）组成，并用等号 (`=`) 分隔。多个键值对之间用逗号 (`,`) 分隔。 |

### S3 Vault

| 参数              | 是否必需 | 描述                                                                                                      |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | 必需   | 用于对象存储的端点。对于 Azure Blob 存储，endpoint 是固定的 blob.core.windows.net。 |
| `s3.region`      | 必需   | 您的存储桶的区域。(如果您使用 GCP 或 AZURE,则可填us-east-1)。 |
| `s3.root.path`   | 必需   | 存储数据的路径。 |
| `s3.bucket`      | 必需   | 您的对象存储账户的存储桶。(如果您使用 Azure，则为 StorageAccount)。 |
| `s3.access_key`  | 必需   | 您的对象存储账户的访问密钥。(如果您使用 Azure，则为 AccountName)。 |
| `s3.secret_key`  | 必需   | 您的对象存储账户的秘密密钥。(如果您使用 Azure，则为 AccountKey)。 |
| `provider`       | 必需   | 提供对象存储服务的云供应商。支持的值有`COS`，`OSS`，`S3`，`OBS`，`BOS`，`AZURE`，`GCP` |
| `use_path_style` | 可选   | 使用 `path-style URL`(私有化部署环境) 或者`virtual-hosted-style URL`(公有云环境建议), 默认值 `true` (path-style)                                                                                      |

**注意:&#x20;**

1. `s3.endpoint` 如果不提供`http://` 或 `https://` 前缀, 则默认使用http; 如提供，则会以前缀为准;

2. Doris也支持`AWS Assume Role`的方式创建Storage Vault(仅限于AWS S3)，配置方式请参考[AWS集成](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)。

### HDFS vault

| 参数                               | 是否必需 | 描述                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |必需 | Hadoop 配置属性，指定要使用的默认文件系统。                             |
| `path_prefix`                    |可选 | 存储数据的路径前缀。如果没有指定则会使用 user 账户下的默认路径。                   |
| `hadoop.username`                |可选 | Hadoop 配置属性，指定访问文件系统的用户。如果没有指定则会使用启动 hadoop 进程的 user。 |
| `hadoop.security.authentication` |可选 | 用于 hadoop 的认证方式。如果希望使用 kerberos 则可以填写`kerberos`。      |
| `hadoop.kerberos.principal`      |可选 | 您的 kerberos 主体的路径。      |
| `hadoop.kerberos.keytab`         |可选 | 您的 kerberos keytab 的路径。      |

## 举例

### 1. 创建 HDFS storage vault。

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

### 2. 创建阿里云 OSS storage vault。

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
    "use_path_style" = "false"                           -- optional,  OSS 建议设置 false
);
```

### 3. 创建腾讯云 COS storage vault。

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
    "use_path_style" = "false"                           -- optional,  COS 建议设置 false
);
```

### 4. 创建华为云 OBS storage vault。

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
    "use_path_style" = "false"                           -- optional,  OBS 建议设置 false
);
```

### 5. 创建百度云 BOS storage vault。

```sql
CREATE STORAGE VAULT IF NOT EXISTS bos_demo_vault
PROPERTIES (
    "type" = "S3",                                       -- required
    "s3.endpoint" = "s3.bj.bcebos.com",                  -- required
    "s3.access_key" = "xxxxxx",                          -- required,  Your BOS access key
    "s3.secret_key" = "xxxxxx",                          -- required,  Your BOS secret key
    "s3.region" = "bj",                                  -- required
    "s3.root.path" = "bos_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                              -- required,  Your BOS bucket name
    "provider" = "BOS",                                  -- required
    "use_path_style" = "false"                           -- optional,  BOS 建议设置 false
);
```

### 6. 创建亚马逊云 S3 storage vault。

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
    "use_path_style" = "false"                          -- optional,  S3 建议设置 false
);
```

**注意:&#x20;**

Doris也支持`AWS Assume Role`的方式创建Storage Vault(仅限于AWS S3)，配置方式请参考[AWS集成](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization#assumed-role-authentication).

### 7. 创建 MinIO storage vault。

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
     "use_path_style" = "true"                          -- required,  minio 建议设置 true
 );
```

### 8. 创建微软 AZURE storage vault。

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

### 9. 创建谷歌 GCP storage vault。

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

**注意**

[s3.access_key对应GCP HMAC key的Access ID](https://cloud.google.com/storage/docs/authentication/hmackeys)

[s3.secret_key对应GCP HMAC key的Secret](https://cloud.google.com/storage/docs/authentication/hmackeys)

## 关键词

    CREATE, STORAGE VAULT
