---
{
    "title": "CREATE REPOSITORY",
    "language": "ja",
    "description": "このステートメントはリポジトリを作成するために使用します。リポジトリはバックアップまたはリストアに使用されます。"
}
---

## 説明 {#description}

このステートメントはリポジトリを作成するために使用します。リポジトリはバックアップまたはリストアに使用されます。

## 構文 {#syntax}

```sql
CREATE [READ ONLY] REPOSITORY <repo_name>
    WITH [ S3 | HDFS ]
    ON LOCATION <repo_location>
    PROPERTIES (
              -- S3 or HDFS storage property
              <storage_property>
              [ , ... ]
    )
```

## 必須パラメータ {#required-parameters}
**<repo_name>**
> リポジトリの一意な名前。

**<repo_location>**
> リポジトリのストレージパス。

**<storage_property>**
> リポジトリのプロパティ。ストレージ媒体として S3 と HDFS のどちらを選択したかに応じて、対応するパラメータを選択します。

**<storage_property>** オプションパラメータは次のとおりです。実際の環境に応じて、追加のパラメータを指定できます。

| パラメータ               | 説明                            |
|-------------------------|------------------------------------|
| **s3.endpoint**         | S3 サービスエンドポイント                    |
| **s3.access_key**       | S3 アクセスキー                          |
| **s3.secret_key**       | S3 シークレットキー                            |
| **s3.region**           | S3 リージョン                              |
| **use_path_style**      | S3 でパス形式アクセスを使用するかどうか（MinIO に適用） |
| **fs.defaultFS**        | Hadoop のデフォルトファイルシステム URI        |
| **hadoop.username**     | Hadoop ユーザー名                       |

**注:&#x20;**

Doris は AWS S3 リポジトリの作成に `AWS Assume Role` もサポートしています。[AWS 統合](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)を参照してください。

## アクセス制御要件 {#access-control-requirements}

| 権限               | オブジェクト                         | 注記                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | クラスタ全体の管理権限 | リポジトリを作成できるのは root または superuser のみです  |


## 使用上の注意 {#usage-notes}
- 読み取り専用リポジトリの場合、リポジトリに対してリストアのみ実行できます。読み取り専用でない場合は、バックアップとリストアの両方を実行できます。
- プロパティ (PROPERTIES) は S3 と HDFS のどちらを使用するかによって異なります。例を参照してください。
- ON LOCATION では、S3 の場合は後続に S3 Bucket Name を指定します。
- データ移行を実行する場合、ソースクラスタと宛先クラスタの両方に同じリポジトリを作成し、宛先クラスタがソースクラスタのバックアップからデータスナップショットを参照できるようにします。
- どのユーザーでも、[SHOW REPOSITORIES](./SHOW-REPOSITORIES) コマンドを使用して作成済みのリポジトリを表示できます。


## 例 {#examples}

s3_repo という名前のリポジトリを作成します。

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://s3-repo"
PROPERTIES
(
    "s3.endpoint" = "http://s3-REGION.amazonaws.com",
    "s3.region" = "s3-REGION",
    "s3.access_key" = "AWS_ACCESS_KEY",
    "s3.secret_key"="AWS_SECRET_KEY"
);
```
**注:&#x20;**

Doris は AWS S3 リポジトリの作成に `AWS Assume Role` もサポートしています。[AWS 統合](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)を参照してください。

hdfs_repo という名前のリポジトリを作成します。

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "hdfs://hadoop-name-node:54310/path/to/repo/"
PROPERTIES
(
    "fs.defaultFS"="hdfs://hadoop-name-node:54310",
    "hadoop.username"="user"
);
```

S3 プロトコルを介して minio ストレージに直接接続する minio_repo という名前のリポジトリを作成します。

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
(
    "s3.endpoint" = "http://minio.com",
    "s3.access_key" = "MINIO_USER",
    "s3.secret_key"="MINIO_PASSWORD",
    "s3.region" = "REGION",
    "use_path_style" = "true"
);
```

一時的なセキュリティ認証情報を使用して minio_repo という名前のリポジトリを作成します。

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://minio_repo"
PROPERTIES
(
    "s3.endpoint" = "AWS_ENDPOINT",
    "s3.access_key" = "AWS_TEMP_ACCESS_KEY",
    "s3.secret_key" = "AWS_TEMP_SECRET_KEY",
    "s3.session_token" = "AWS_TEMP_TOKEN",
    "s3.region" = "AWS_REGION"
)
```

Tencent COS を使用してリポジトリを作成します。

```sql
CREATE REPOSITORY `cos_repo`
WITH S3
ON LOCATION "s3://backet1/"
PROPERTIES
(
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "http://cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing"
);
```
