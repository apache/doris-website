---
{
  "title": "REPOSITORY の作成",
  "description": "このステートメントはリポジトリを作成するために使用されます。リポジトリはバックアップまたはリストアに使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはリポジトリを作成するために使用されます。リポジトリはバックアップまたは復元に使用されます。

## Syntax

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
> リポジトリの保存パス。

**<storage_property>**
> リポジトリのプロパティ。ストレージメディアとしてS3またはHDFSのどちらを選択するかに基づいて、対応するパラメータを選択する必要があります。

**<storage_property>** のオプションパラメータは以下の通りです。実際の環境に基づいて追加のパラメータを追加できます。

| 参数                      | 说明                                 |
|-------------------------|------------------------------------|
| **s3.endpoint**         | S3 service endpoint                    |
| **s3.access_key**       | S3 access key                          |
| **s3.secret_key**       | S3 secret key                          |
| **s3.region**           | S3 region                              |
| **use_path_style**      | Whether to use path-style access for S3 (applies to MinIO) |
| **fs.defaultFS**        | Hadoop default file system URI        |
| **hadoop.username**     | Hadoop username                       |

**注意：**

DorisはAWS S3 Repositoryの作成でも`AWS Assume Role`をサポートしています。AWS intergrationを参照してください。

## アクセス制御要件

| Privilege               | Object                         | 注釈                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | Entire cluster management permissions | Only the root or superuser can create repositories  |


## 使用上の注意
- 読み取り専用リポジトリの場合、そのリポジトリでのみ復元を実行できます。そうでない場合は、バックアップと復元の両方の操作を実行できます。
- プロパティ（PROPERTIES）はS3かHDFSかによって異なります。例を参照してください。
- ON LOCATIONについて、S3の場合は以下がS3 バケット Nameになります。
- データ移行を実行する際、移行先クラスタが移行元クラスタのバックアップからのデータスナップショットを表示できるように、移行元と移行先の両方のクラスタで同じリポジトリを作成する必要があります。
- 作成されたリポジトリは、[SHOW REPOSITORIES](./SHOW-REPOSITORIES)コマンドを使用してすべてのユーザーが表示できます。


## 例

s3_repoという名前のリポジトリを作成する。

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
**注意：**

DorisはAWS S3 Repositoryの作成において`AWS Assume Role`もサポートしています。AWS連携を参照してください。

hdfs_repoという名前のリポジトリを作成します。

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
