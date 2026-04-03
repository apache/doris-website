---
{
  "title": "CREATE-STORAGE-VAULT",
  "description": "このコマンドは storage vault を作成するために使用されます。このドキュメントのトピックでは、Doris で self-managed storage vault を作成するための構文について説明します。",
  "language": "ja"
}
---
## 説明

このコマンドは、ストレージvaultを作成するために使用されます。このドキュメントのトピックでは、Dorisでセルフマネージドストレージvaultを作成するための構文について説明します。


## 構文

```sql
CREATE STORAGE VAULT [IF NOT EXISTS] <vault_name> [ <properties> ]
```
## 必須パラメータ

| Parameter     | デスクリプション                     |
|-------|-----------------------|
| `<vault_name>` |  ストレージボルトの名前。これは作成する新しいストレージボルトの一意識別子です。 |

## オプションパラメータ
| Parameter   | デスクリプション                                                         |
|-------------------|--------------------------------------------------------------|
| `[IF NOT EXISTS]` | 指定したストレージボルトが既に存在する場合、作成操作は実行されず、エラーも発生しません。これにより、同じストレージボルトの重複作成を防ぎます。 |
| `<properties>`    | ストレージボルトの特定のプロパティを設定または更新するために使用されるキー値ペアのセット。各プロパティはキー（<key>）と値（<value>）で構成され、等号（=）で区切られます。複数のキー値ペアはカンマ（,）で区切られます。 |

### S3 Vault

| Parameter              | Required | デスクリプション                                                                                                      |
|:----------------|:-----|:--------------------------------------------------------------------------------------------------------|
| `s3.endpoint`    | Required   | オブジェクトストレージのエンドポイント。Azure Blob Storageの場合、エンドポイントはblob.core.windows.netに固定されます。 |
| `s3.region`      | Required   | ストレージバケットのリージョン。（GCPまたはAZUREを使用する場合は不要）。 |
| `s3.root.path`   | Required   | データを保存するパス。 |
| `s3.bucket`      | Required   | オブジェクトストレージアカウントのバケット。（Azureの場合、これはStorageAccount）。 |
| `s3.access_key`  | Required   | オブジェクトストレージアカウントのアクセスキー。（Azureの場合、これはAccountName）。 |
| `s3.secret_key`  | Required   | オブジェクトストレージアカウントのシークレットキー。（Azureの場合、これはAccountKey）。 |
| `provider`       | Required   | オブジェクトストレージサービスを提供するクラウドプロバイダ。サポートされる値は`COS`、`OSS`、`S3`、`OBS`、`BOS`、`AZURE`、`GCP`です |
| `use_path_style` | Optional   | `path-style URL`（プライベートデプロイメント環境用）または`virtual-hosted-style URL`（パブリッククラウド環境推奨）を使用します。デフォルト値はtrue（path-style）です。                                                                                   |

**注記：**

1. `s3.endpoint`で`http://`または`https://`プレフィックスが提供されていない場合、デフォルトで`http`が使用されます。プレフィックスが明示的に指定された場合、そのプレフィックスが有効になります。

2. DorisはS3 Vault用の`AWS Assume Role`もサポートしています（現在はAWS S3のみ）。AWS integrationを参照してください。

### HDFS vault

| Parameter                               | Required | デスクリプション                                                    |
|:---------------------------------|:-----|:------------------------------------------------------|
| `fs.defaultFS`                   |Required| 使用するデフォルトファイルシステムを指定するHadoop設定プロパティ。                             |
| `path_prefix`                    |Optional| データを保存するプレフィックスパス。指定されていない場合、ユーザーアカウント下のデフォルトパスが使用されます。                   |
| `hadoop.username`                |Optional| ファイルシステムにアクセスするユーザーを指定するHadoop設定プロパティ。指定されていない場合、Hadoopプロセスを開始したユーザーが使用されます。 |
| `hadoop.security.authentication` |Optional| Hadoopの認証方法。Kerberosを使用する場合は、kerberosを指定できます。      |
| `hadoop.kerberos.principal`      |Optional| Kerberosプリンシパルのパス。      |
| `hadoop.kerberos.keytab`         |Optional| Kerberos keytabのパス。     |

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
### 2. OSS storage vault の作成

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
### 3. COS storage vault の作成

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
### 4. OBS ストレージ vault を作成する

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
### 6. S3ストレージボルトの作成

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

DorisはS3 Vault（現在はAWS S3のみ）に対して`AWS Assume Role`もサポートしています。AWS integrationを参照してください。


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
### 8. AZURE storage vault の作成

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
### 9. GCP storage vault の作成

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
