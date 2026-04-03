---
{
  "title": "リポジトリを作成",
  "language": "ja",
  "description": "このステートメントはリポジトリを作成するために使用されます。リポジトリはバックアップまたはリストアに使用されます。"
}
---
## 説明

このステートメントはリポジトリを作成するために使用されます。リポジトリはバックアップまたはリストアに使用されます。

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
> リポジトリの一意な名前。

**<repo_location>**
> リポジトリのストレージパス。

**<storage_property>**
> リポジトリのプロパティ。ストレージメディアとしてS3またはHDFSが選択されているかに基づいて、対応するパラメータを選択する必要があります。

**<storage_property>** オプションパラメータは以下の通りで、実際の環境に基づいて追加のパラメータを追加できます。

| 参数                      | 说明                                 |
|-------------------------|------------------------------------|
| **s3.endpoint**         | S3 service endpoint                    |
| **s3.access_key**       | S3 access key                          |
| **s3.secret_key**       | S3 secret key                          |
| **s3.region**           | S3 region                              |
| **use_path_style**      | Whether to use path-style access for S3 (applies to MinIO) |
| **fs.defaultFS**        | Hadoop default file system URI        |
| **hadoop.username**     | Hadoop username                       |


## アクセス制御要件

| Privilege               | Object                         | Notes                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | Entire cluster management permissions | Only the root or superuser can create repositories  |


## 使用上の注意
- 読み取り専用リポジトリの場合、リポジトリ上でのリストアのみ実行できます。そうでない場合は、バックアップとリストア操作の両方を実行できます。
- プロパティ（PROPERTIES）は、S3またはHDFSかによって異なります。例に示す通りです。
- ON LOCATIONについて、S3の場合、以下はS3 Bucket Nameである必要があります。
- データ移行を実行する際は、移行先クラスタが移行元クラスタのバックアップからデータスナップショットを表示できるよう、移行元と移行先の両方のクラスタで同じリポジトリを作成する必要があります。
- 任意のユーザーは[SHOW REPOSITORIES](./SHOW-REPOSITORIES)コマンドを使用して作成済みのリポジトリを表示できます。


## 例

s3_repoという名前のリポジトリを作成します。

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
S3プロトコルを通じてminioストレージに直接リンクするために、minio_repoという名前のリポジトリを作成します。

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
一時的なセキュリティ認証情報を使用してminio_repoという名前のリポジトリを作成します。

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
Tencent COSを使用してリポジトリを作成する

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
