---
{
    "title": "CREATE REPOSITORY",
    "language": "ja",
    "description": "この文はリポジトリを作成します。リポジトリはバックアップまたは復元に使用します。"
}
---

## 説明

この文はリポジトリを作成します。リポジトリはバックアップまたは復元に使用します。

## 構文

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

## 必須パラメータ
**<repo_name>**
> リポジトリの一意の名前。

**<repo_location>**
> リポジトリのストレージパス。

**<storage_property>**
> リポジトリのプロパティ。ストレージに S3 と HDFS のどちらを選ぶかに応じて、対応するパラメータを指定します。

**<storage_property>** で使用できるオプションのパラメータは次のとおりです。実際の環境に応じて、ほかのパラメータも追加できます。

| パラメータ              | 説明                                              |
|-------------------------|---------------------------------------------------|
| **s3.endpoint**         | S3 サービスのエンドポイント                        |
| **s3.access_key**       | S3 アクセスキー                                    |
| **s3.secret_key**       | S3 シークレットキー                                |
| **s3.region**           | S3 リージョン                                      |
| **use_path_style**      | S3 でパス形式のアクセスを使用するかどうか（MinIO に適用） |
| **fs.defaultFS**        | Hadoop のデフォルトファイルシステム URI            |
| **hadoop.username**     | Hadoop のユーザー名                                |

**注：&#x20;**

Doris は、AWS S3 リポジトリの作成時に `AWS Assume Role` もサポートします。詳しくは [AWS 連携](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)を参照してください。

## アクセス制御要件

| 権限               | オブジェクト                         | 備考                                               |
|:-------------------|:-------------------------------------|:---------------------------------------------------|
| ADMIN_PRIV         | クラスター全体の管理権限             | リポジトリを作成できるのは root またはスーパーユーザーのみ |


## 使用上の注意
- 読み取り専用リポジトリでは、復元のみ実行できます。それ以外のリポジトリでは、バックアップと復元の両方を実行できます。
- プロパティ（PROPERTIES）は S3 と HDFS で異なります。以下の例を参照してください。
- S3 の場合、ON LOCATION には S3 バケット名を指定します。
- データを移行する場合、移行元クラスターと移行先クラスターの両方で同じリポジトリを作成する必要があります。これにより、移行先クラスターから移行元クラスターのバックアップに含まれるデータスナップショットを参照できます。
- 作成済みのリポジトリは、どのユーザーも [SHOW REPOSITORIES](./SHOW-REPOSITORIES) コマンドで確認できます。


## 例

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
**注：&#x20;**

Doris は、AWS S3 リポジトリの作成時に `AWS Assume Role` もサポートします。詳しくは [AWS 連携](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)を参照してください。

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

S3 プロトコルを介して MinIO ストレージに直接接続する minio_repo という名前のリポジトリを作成します。

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

一時的なセキュリティ認証情報を使用して、minio_repo という名前のリポジトリを作成します。

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

