---
{
    "title": "CREATE-STORAGE-VAULT",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "このコマンドはストレージ Vault を作成します。このページでは、Doris で自己管理型ストレージ Vault を作成するための構文を説明します。"
}
---

## 説明

このコマンドはストレージ Vault を作成します。このページでは、Doris で自己管理型ストレージ Vault を作成するための構文を説明します。


## 構文

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name> [ <properties> ]
```


## 必須パラメータ

| パラメータ | 説明 |
|-------|-----------------------|
| `<vault_name>` | ストレージ Vault の名前。作成するストレージ Vault を一意に識別します。 |

## オプションパラメータ
| パラメータ | 説明 |
|-------------------|--------------------------------------------------------------|
| `[IF NOT EXISTS]` | 指定したストレージ Vault がすでに存在する場合は作成処理を実行せず、エラーも発生しません。同じストレージ Vault の重複作成を防ぎます。 |
| `<properties>` | ストレージ Vault の特定のプロパティを設定または更新するためのキーと値のペアの集合。各プロパティはキー（<key>）と値（<value>）からなり、等号（=）で区切ります。複数のペアはカンマ（,）で区切ります。 |

:::note
`type` プロパティに指定できる値は `"S3"` と `"hdfs"` の二つだけです（大文字と小文字は区別しません）。Amazon S3、Alibaba Cloud OSS、Tencent Cloud COS、Huawei Cloud OBS、Baidu Cloud BOS、MinIO、Azure Blob Storage、Google Cloud Storage のすべてのオブジェクトストレージバックエンドでは、Doris が S3 互換 API を通じてアクセスするため、`"type" = "S3"` を使用します。実際のクラウドは、別の `provider` プロパティ（`COS`、`OSS`、`S3`、`OBS`、`BOS`、`AZURE`、`GCP`）で選択します。`s3.access_key` と `s3.secret_key` というプロパティ名も同じ命名規則に従っており、AWS S3 専用ではありません。
:::

### S3 Vault

| パラメータ | 必須かどうか | 説明 |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint` | 必須 | オブジェクトストレージのエンドポイント。Azure Blob Storage の場合、エンドポイントは blob.core.windows.net に固定されます。 |
| `s3.region` | 必須 | ストレージバケットのリージョン（GCP または AZURE を使用する場合は不要）。 |
| `s3.root.path` | 必須 | データを保存するパス。 |
| `s3.bucket` | 必須 | オブジェクトストレージアカウントのバケット（Azure の場合は StorageAccount）。 |
| `s3.access_key` | 必須 | オブジェクトストレージアカウントのアクセスキー（Azure の場合は AccountName）。 |
| `s3.secret_key` | 必須 | オブジェクトストレージアカウントのシークレットキー（Azure の場合は AccountKey）。 |
| `provider` | 必須 | オブジェクトストレージサービスを提供するクラウドプロバイダー。指定できる値は `COS`、`OSS`、`S3`、`OBS`、`BOS`、`AZURE`、`GCP` です。 |
| `use_path_style` | オプション | `path-style URL`（プライベートデプロイ環境向け）または `virtual-hosted-style URL`（パブリッククラウド環境に推奨）を使用します。デフォルト値は true（path-style）です。 |

**注:&#x20;**

1. `s3.endpoint` に `http://` と `https://` のどちらのプレフィックスも指定しない場合、デフォルトで `http` が使用されます。プレフィックスを明示的に指定した場合は、そのプレフィックスが適用されます。

2. Doris は S3 Vault での `AWS Assume Role` にも対応しています（現時点では AWS S3 のみ）。詳しくは [AWS 連携](../../../../lakehouse/storages/s3.md)を参照してください。

### HDFS Vault

| パラメータ | 必須かどうか | 説明 |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS` | 必須 | 使用するデフォルトのファイルシステムを指定する Hadoop 設定プロパティ。 |
| `path_prefix` | オプション | データを保存するためのパスのプレフィックス。指定しない場合は、ユーザーアカウントのデフォルトパスが使用されます。 |
| `hadoop.username` | オプション | ファイルシステムへのアクセスに使用するユーザーを指定する Hadoop 設定プロパティ。指定しない場合は、Hadoop プロセスを起動したユーザーが使用されます。 |
| `hadoop.security.authentication` | オプション | Hadoop の認証方式。Kerberos を使用する場合は kerberos を指定できます。 |
| `hadoop.kerberos.principal` | オプション | Kerberos プリンシパルへのパス。 |
| `hadoop.kerberos.keytab` | オプション | Kerberos keytab へのパス。 |

## 例

### 1. HDFS ストレージ Vault を作成する

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

### 2. OSS ストレージ Vault を作成する

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

### 3. COS ストレージ Vault を作成する

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

### 4. OBS ストレージ Vault を作成する

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

### 5. BOS ストレージ Vault を作成する

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

### 6. S3 ストレージ Vault を作成する

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_demo_vault
PROPERTIES (
    "type" = "S3",                                      -- required
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",       -- required
    "s3.access_key" = "xxxxxx",                         -- required,  Your S3 access key
    "s3.secret_key" = "xxxxxx",                         -- required,  Your S3 secret key
    "s3.region" = "us-east-1",                          -- required
    "s3.root.path" = "s3_demo_vault_prefix",            -- required
    "s3.bucket" = "xxxxxx",                             -- required,  Your S3 bucket name
    "provider" = "S3",                                  -- required
    "use_path_style" = "false"                          -- optional,  S3 recommended to set false
);
```

**注:&#x20;**

Doris は S3 Vault での `AWS Assume Role` にも対応しています（現時点では AWS S3 のみ）。詳しくは [AWS 連携](../../../../lakehouse/storages/s3.md)を参照してください。


### 7. MinIO ストレージ Vault を作成する

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

### 8. AZURE ストレージ Vault を作成する

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

### 9. GCP ストレージ Vault を作成する

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

**注**

[s3.access_key は GCP HMAC キーの Access ID に対応します](https://cloud.google.com/storage/docs/authentication/hmackeys)

[s3.secret_key は GCP HMAC キーの Secret に対応します](https://cloud.google.com/storage/docs/authentication/hmackeys)

## キーワード

    CREATE, STORAGE VAULT
