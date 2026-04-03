---
{
  "title": "CREATE-STORAGE-VAULT",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "このコマンドはストレージボルトを作成するために使用されます。このドキュメントのトピックでは、Dorisでセルフマネージドストレージボルトを作成するためのsyntaxについて説明します。"
}
---
## 説明

このコマンドはストレージvaultを作成するために使用されます。このドキュメントのトピックでは、Dorisでセルフマネージドストレージvaultを作成するための構文について説明します。


## 構文

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name> [ <properties> ]
```
## 必須パラメータ

| パラメータ     | 説明                     |
|-------|-----------------------|
| `<vault_name>` |  ストレージボルトの名前。作成する新しいストレージボルトの一意の識別子です。 |

## オプションパラメータ
| パラメータ   | 説明                                                         |
|-------------------|--------------------------------------------------------------|
| `[IF NOT EXISTS]` | 指定したストレージボルトが既に存在する場合、作成操作は実行されず、エラーは発生しません。これにより、同じストレージボルトの重複作成を防ぎます。 |
| `<properties>`    | ストレージボルトの特定のプロパティを設定または更新するために使用されるキー・バリューペアのセット。各プロパティはキー (<key>) とバリュー (<value>) から構成され、等号 (=) で区切られます。複数のキー・バリューペアはカンマ (,) で区切られます。 |

### S3 Vault

| パラメータ              | 必須 | 説明                                                                                                      |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | 必須   | オブジェクトストレージのエンドポイント。Azure Blob Storageの場合、エンドポイントはblob.core.windows.netに固定されています。 |
| `s3.region`      | 必須   | ストレージバケットのリージョン。（GCPまたはAZUREを使用する場合は不要）。 |
| `s3.root.path`   | 必須   | データを格納するパス。 |
| `s3.bucket`      | 必須   | オブジェクトストレージアカウントのバケット。（Azureの場合、これはStorageAccountです）。 |
| `s3.access_key`  | 必須   | オブジェクトストレージアカウントのアクセスキー。（Azureの場合、これはAccountNameです）。 |
| `s3.secret_key`  | 必須   | オブジェクトストレージアカウントのシークレットキー。（Azureの場合、これはAccountKeyです）。 |
| `provider`       | 必須   | オブジェクトストレージサービスを提供するクラウドプロバイダー。サポートされる値は`COS`，`OSS`，`S3`，`OBS`，`BOS`，`AZURE`，`GCP`です |
| `use_path_style` | オプション   | `path-style URL`（プライベートデプロイメント環境用）または`virtual-hosted-style URL`（パブリッククラウド環境推奨）を使用します。デフォルト値はtrue（path-style）です。                                                                                   |

**注意:&#x20;**

1. `s3.endpoint`で`http://`または`https://`プレフィックスが提供されていない場合、​​デフォルトで`http`​​が使用されます。プレフィックスが明示的に指定されている場合は、そのプレフィックスで有効になります；

2. DorisはS3 Vault用の`AWS Assume Role`もサポートしています（現在AWS S3のみ）。詳細は[AWS intergration](../../../../lakehouse/storages/s3.md)を参照してください。

### HDFS vault

| パラメータ                               | 必須 | 説明                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |必須| 使用するデフォルトファイルシステムを指定するHadoop設定プロパティ。                             |
| `path_prefix`                    |オプション| データを格納するためのプレフィックスパス。指定されていない場合、ユーザーアカウント下のデフォルトパスが使用されます。                   |
| `hadoop.username`                |オプション| ファイルシステムにアクセスするユーザーを指定するHadoop設定プロパティ。指定されていない場合、Hadoopプロセスを開始したユーザーが使用されます。 |
| `hadoop.security.authentication` |オプション| Hadoopの認証方式。Kerberosを使用したい場合は、kerberosを指定できます。      |
| `hadoop.kerberos.principal`      |オプション| Kerberosプリンシパルへのパス。      |
| `hadoop.kerberos.keytab`         |オプション| Kerberos keytabへのパス。     |

## 例

### 1. HDFSストレージボルトを作成する。

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
### 2. OSSストレージvaultを作成

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
### 3. COSストレージボルトの作成

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
### 4. OBSストレージボルトの作成

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
### 5. BOS storage vault を作成する

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
### 6. S3ストレージボルトを作成する

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
**注意：**

DorisはS3 Vault用の`AWS Assume Role`もサポートしています（現在はAWS S3のみ）。詳細については[AWS intergration](../../../../lakehouse/storages/s3.md)を参照してください。


### 7. MinIOストレージvaultの作成

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
### 8. AZURE storage vault を作成する

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
### 9. GCP storage vault を作成する

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

[s3.access_keyはGCP HMACキーのAccess IDに対応します](https://cloud.google.com/storage/docs/authentication/hmackeys)

[s3.secret_keyはGCP HMACキーのSecretに対応します](https://cloud.google.com/storage/docs/authentication/hmackeys)

## キーワード

    CREATE, STORAGE VAULT
