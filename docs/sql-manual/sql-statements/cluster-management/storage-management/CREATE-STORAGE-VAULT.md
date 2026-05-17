---
{
    "title": "CREATE-STORAGE-VAULT",
    "language": "en",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "This command is used to create a storage vault. The topic of this document describes the syntax for creating a self-managed storage vault in Doris."
}
---

## Description

This command is used to create a storage vault. The topic of this document describes the syntax for creating a self-managed storage vault in Doris.


## Syntax

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name> [ <properties> ]
```


## Required Parameters

| Parameter     | Description                     |
|-------|-----------------------|
| `<vault_name>` |  The name of the storage vault. This is the unique identifier for the new storage vault you are creating. |

## Optional Parameters
| Parameter   | Description                                                         |
|-------------------|--------------------------------------------------------------|
| `[IF NOT EXISTS]` | If the specified storage vault already exists, the creation operation will not be executed, and no error will be thrown. This prevents duplicate creation of the same storage vault. |
| `<properties>`    | A set of key-value pairs used to set or update specific properties of the storage vault. Each property consists of a key (<key>) and a value (<value>), separated by an equals sign (=). Multiple key-value pairs are separated by commas (,). |

### S3 Vault

| Parameter              | Required | Description                                                                                                      |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | Required   | The endpoint for object storage. For Azure Blob Storage, the endpoint is fixed as blob.core.windows.net. |
| `s3.region`      | Required   | The region of your storage bucket. (Not required if using GCP or AZURE). |
| `s3.root.path`   | Required   | The path to store data. |
| `s3.bucket`      | Required   | The bucket of your object storage account. (For Azure, this is the StorageAccount). |
| `s3.access_key`  | Required   | The access key for your object storage account. (For Azure, this is the AccountName). |
| `s3.secret_key`  | Required   | The secret key for your object storage account. (For Azure, this is the AccountKey). |
| `provider`       | Required   | The cloud provider offering the object storage service. Supported values are `COS`，`OSS`，`S3`，`OBS`，`BOS`，`AZURE`，`GCP` |
| `use_path_style` | Optional   | Use `path-style URL` (for private deployment environments) or `virtual-hosted-style URL`(recommended for public cloud environments). Default value is true (path-style).                                                                                   |

**Note:&#x20;**

1. `s3.endpoint` if neither `http://` nor `https://` prefix is not provided, ​​`http`​​ will be used by default. If a prefix is explicitly specified, it will take effect with the prefix;

2. Doris also support `AWS Assume Role` for S3 Vault(only for AWS S3 now), please refer to [AWS intergration](../../../../lakehouse/storages/s3.md).

### HDFS vault

| Parameter                               | Required | Description                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |Required| Hadoop configuration property specifying the default file system to use.                             |
| `path_prefix`                    |Optional| The prefix path for storing data. If not specified, the default path under the user account will be used.                   |
| `hadoop.username`                |Optional| Hadoop configuration property specifying the user to access the file system. If not specified, the user who started the Hadoop process will be used. |
| `hadoop.security.authentication` |Optional| The authentication method for Hadoop. If you want to use Kerberos, you can specify kerberos.      |
| `hadoop.kerberos.principal`      |Optional| The path to your Kerberos principal.      |
| `hadoop.kerberos.keytab`         |Optional| The path to your Kerberos keytab.     |

## Examples

### 1. Create a HDFS storage vault.

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault_demo
PROPERTIES (
    "type" = "hdfs",                                     -- required
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",            -- required
    "path_prefix" = "big/data",                          -- optional,  generally fill in according to the business name
    "hadoop.username" = "user"                           -- optional
    "hadoop.security.authentication" = "kerberos"        -- optional
    "hadoop.kerberos.principal" = "hadoop/127.0.0.1@XXX" -- optional
    "hadoop.kerberos.keytab" = "/etc/emr.keytab"         -- optional
);
```

### 2. Create OSS storage vault

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
    "use_path_style" = "false"                           -- optional,  OSS recommended to set false
);
```

### 3. Create COS storage vault

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
    "use_path_style" = "false"                           -- optional,  COS recommended to set false
);
```

### 4. Create OBS storage vault

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
    "use_path_style" = "false"                           -- optional,  OBS recommended to set false
);
```

### 5. Create BOS storage vault

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
    "use_path_style" = "false"                           -- optional,  BOS recommended to set false
);
```

### 6. Create S3 storage vault

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
    "use_path_style" = "false"                          -- optional,  S3 recommended to set false
);
```

**Note:&#x20;**

Doris also support `AWS Assume Role` for S3 Vault(only for AWS S3 now), please refer to [AWS intergration](../../../../lakehouse/storages/s3.md)


### 7. Create MinIO storage vault

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
     "use_path_style" = "true"                          -- required,  minio recommended to set false
 );
```

### 8. Create AZURE storage vault

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

### 9. Create GCP storage vault

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

## Keywords

    CREATE, STORAGE VAULT
