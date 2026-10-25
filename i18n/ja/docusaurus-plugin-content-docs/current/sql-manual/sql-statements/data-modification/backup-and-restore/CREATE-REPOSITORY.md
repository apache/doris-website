---
{
    "title": "CREATE REPOSITORY",
    "language": "ja",
    "description": "この文はリポジトリの作成に使用します。リポジトリはバックアップや復元に使用します。"
}
---

## 説明 {#description}

この文はリポジトリの作成に使用します。リポジトリはバックアップや復元に使用します。

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
> リポジトリの一意の名前。

**<repo_location>**
> リポジトリの保存先パス。

**<storage_property>**
> リポジトリのプロパティ。ストレージとして S3 と HDFS のどちらを選択するかに応じて、該当するパラメータを指定します。

**<storage_property>** 任意のパラメータは次のとおりです。実際の環境に応じて、ほかのパラメータも追加できます。

| パラメータ               | 説明                            |
|-------------------------|------------------------------------|
| **s3.endpoint**         | S3 サービスのエンドポイント                    |
| **s3.access_key**       | S3 アクセスキー                          |
| **s3.secret_key**       | S3 シークレットキー                          |
| **s3.region**           | S3 リージョン                              |
| **use_path_style**      | S3 でパス形式のアクセスを使用するかどうか（MinIO に適用） |
| **fs.defaultFS**        | Hadoop のデフォルトファイルシステムの URI        |
| **hadoop.username**     | Hadoop のユーザー名                       |

**注記:&#x20;**

Doris は AWS S3 リポジトリの作成時に `AWS Assume Role` もサポートしています。詳しくは [AWS 連携](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)を参照してください。

## アクセス制御の要件 {#access-control-requirements}

| 権限               | 対象                         | 備考                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | クラスター全体の管理権限 | リポジトリを作成できるのは root またはスーパーユーザーのみです  |


## 使用上の注意 {#usage-notes}
- 読み取り専用のリポジトリでは、復元のみ実行できます。それ以外のリポジトリでは、バックアップと復元の両方を実行できます。
- プロパティ（PROPERTIES）は、S3 と HDFS のどちらを使用するかによって異なります。例を参照してください。
- S3 を使用する場合、ON LOCATION には S3 バケット名を指定します。
- データ移行を行う場合は、移行先クラスターが移行元クラスターのバックアップからデータスナップショットを参照できるように、移行元と移行先の両方のクラスターに同じリポジトリを作成する必要があります。
- 作成済みのリポジトリは、どのユーザーでも [SHOW REPOSITORIES](./SHOW-REPOSITORIES) コマンドで確認できます。


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
**注記:&#x20;**

Doris は AWS S3 リポジトリの作成時に `AWS Assume Role` もサポートしています。詳しくは [AWS 連携](../../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication)を参照してください。

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

S3 プロトコルで MinIO ストレージに直接接続する minio_repo という名前のリポジトリを作成します。

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
