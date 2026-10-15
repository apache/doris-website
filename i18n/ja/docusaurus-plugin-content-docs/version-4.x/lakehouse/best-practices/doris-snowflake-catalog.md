---
{
    "title": "Snowflake Catalog との連携",
    "language": "ja",
    "description": "Iceberg REST Catalog API を介して Apache Doris を Snowflake Horizon Catalog および Snowflake Open Catalog に接続する方法を説明します。"
}
---

Apache Doris は、Iceberg REST Catalog API を介して Snowflake Catalog サービスに接続できます。この連携により、Doris は Snowflake が管理する Iceberg テーブルにクエリを実行できます。また、Snowflake Open Catalog の内部カタログを使用する場合は、Iceberg テーブルの作成と書き込みもできます。

このドキュメントでは、以下の Snowflake カタログサービスを扱います。

- **Snowflake Horizon Catalog**：既存の Snowflake アカウントで Snowflake が管理する Iceberg テーブルにアクセスするために使用します。
- **Snowflake Open Catalog**：Iceberg カタログ、名前空間、テーブルの管理に使用する、Snowflake が提供する Apache Polaris / Iceberg REST Catalog のマネージドサービスです。

## Snowflake Catalog の選択

| 項目 | Snowflake Horizon Catalog | Snowflake Open Catalog |
| --- | --- | --- |
| 主な用途 | Snowflake が管理する Iceberg テーブルへのクエリ | Snowflake Open Catalog 内の Iceberg テーブルの管理 |
| Doris の `warehouse` | Snowflake のデータベース名 | Open Catalog のカタログ名 |
| 認証情報 | Snowflake Programmatic Access Token（PAT） | サービス接続の `<client_id>:<client_secret>` |
| OAuth スコープ | `session:role:<ROLE_NAME>` | `PRINCIPAL_ROLE:<ROLE_NAME>` |
| Doris からのテーブル作成 | 非推奨 | 内部カタログでサポート |
| Doris からの書き込み | Snowflake が管理する既存の Iceberg テーブルへの挿入 | 内部カタログのテーブルへの挿入 |

テーブルを Snowflake が管理している場合は、Horizon Catalog を使用します。Doris から Snowflake Open Catalog を介して Iceberg テーブルを作成、管理したい場合は、Open Catalog の内部カタログを使用します。

> 注：Horizon Catalog に接続する場合は、`iceberg.rest.view-enabled` を `false` に設定してください。（Doris 4.0.6/4.1.1 以降）

### ストレージへのアクセスモデル

Horizon Catalog は、Snowflake が管理する Iceberg テーブルに使用し、そのストレージアクセスは Snowflake が管理します。Doris は REST Catalog API を介してテーブルのメタデータを取得します。`iceberg.rest.vended-credentials-enabled` を `true` に設定すると、Snowflake はオブジェクトストレージの一時的な認証情報を返します。そのため、Horizon Catalog 用の Doris カタログに AWS IAM ロールや S3 の認証情報を設定する必要はありません。

Open Catalog の内部カタログは、カタログに設定されたオブジェクトストレージの場所を使用します。その場所が AWS S3 上にある場合、Open Catalog には Iceberg のメタデータとデータファイルを読み書きするために引き受けられる IAM ロールが必要です。IAM ロールの信頼ポリシーでは、信頼するプリンシパルとして `sts:AssumeRole` の呼び出しを許可する AWS プリンシパルを指定します。Snowflake Open Catalog では、カタログのストレージ詳細に表示される IAM ユーザー ARN を信頼するプリンシパルに指定し、同じページに表示される External ID を設定します。External ID は、この Open Catalog 連携だけにロールの引き受けを制限し、権限を持つサービスが第三者に悪用されるリスクを抑えます。

## Snowflake Horizon Catalog への接続

### Snowflake 環境の設定

Snowflake Horizon Catalog は、Iceberg REST Catalog API を介して Snowflake が管理する Iceberg テーブルを公開します。

REST エンドポイントは次のとおりです。

```text
REST endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

Snowflake が管理する Iceberg テーブルを作成します。

```sql
CREATE OR REPLACE ICEBERG TABLE <database_name>.<schema_name>.<table_name> (
  ID BIGINT,
  NAME STRING
)
CATALOG = 'SNOWFLAKE'
EXTERNAL_VOLUME = 'SNOWFLAKE_MANAGED';
```

`SNOWFLAKE_MANAGED` は Snowflake の予約値です。ユーザーが作成する外部ボリュームではないため、この値について Doris に外部ボリュームへのアクセス権を付与する必要はありません。

Doris が使用する Snowflake ロールに権限を付与します。

```sql
GRANT USAGE ON DATABASE <database_name> TO ROLE <role_name>;
GRANT USAGE ON SCHEMA <database_name>.<schema_name> TO ROLE <role_name>;
GRANT SELECT ON TABLE <database_name>.<schema_name>.<table_name> TO ROLE <role_name>;
```

Doris からテーブルに書き込む必要がある場合は、書き込み権限を付与します。

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE <database_name>.<schema_name>.<table_name>
TO ROLE <role_name>;
```

サービスユーザーの Programmatic Access Token（PAT）を作成します。

```sql
ALTER USER IF EXISTS <service_user>
ADD PAT <pat_name>
  DAYS_TO_EXPIRY = 7
  ROLE_RESTRICTION = '<role_name>'
  COMMENT = 'Horizon Iceberg REST access for Doris';
```

トークンエンドポイントを使用して PAT を検証できます。

```bash
curl -i --fail -X POST \
  "https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=session:role:<role_name>" \
  --data-urlencode "client_secret=<PAT_token>"
```

### Doris カタログの作成

Doris で Iceberg REST Catalog を作成します。

```sql
CREATE CATALOG snowflake_horizon PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog',
    'warehouse' = '<snowflake_database_name>',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<PAT_token>',
    'iceberg.rest.oauth2.server-uri' = 'https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'session:role:<role_name>',
    'iceberg.rest.vended-credentials-enabled' = 'true',
    'client.region' = '<storage_region>',
    'iceberg.rest.nested-namespace-enabled' = 'true',
    'iceberg.rest.view-enabled' = 'false',
    'iceberg.rest.connection-timeout-ms' = '30000',
    'iceberg.rest.socket-timeout-ms' = '120000'
);
```

パラメータに関する補足：

- `warehouse`：Snowflake のデータベース名です。Snowflake のコンピューティングウェアハウスではありません。
- `iceberg.rest.oauth2.credential`：Snowflake の PAT です。
- `iceberg.rest.oauth2.scope`：`session:role:<role_name>` を指定します。
- `iceberg.rest.vended-credentials-enabled`：Snowflake がオブジェクトストレージの一時的な認証情報を返すようにします。
- `client.region`：基盤となるオブジェクトストレージのリージョンです。
- `iceberg.rest.view-enabled`：Horizon Catalog に接続する場合は `false` に設定します。

### Horizon テーブルへのアクセス

カタログを作成した後、Doris から Snowflake が管理する Iceberg テーブルにクエリを実行します。

```sql
SHOW DATABASES FROM snowflake_horizon;
SHOW TABLES FROM snowflake_horizon.<schema_name>;

SELECT COUNT(*)
FROM snowflake_horizon.<schema_name>.<table_name>;
```

出力例：

```text
mysql> SHOW DATABASES FROM snowflake_horizon;
+--------------------+
| Database           |
+--------------------+
| PUBLIC             |
| information_schema |
| mysql              |
+--------------------+

mysql> SHOW TABLES FROM snowflake_horizon.PUBLIC;
+------------------+
| Tables_in_PUBLIC |
+------------------+
| DORIS_HORIZON_T  |
+------------------+

mysql> SELECT * FROM snowflake_horizon.PUBLIC.DORIS_HORIZON_T;
+------+-------+
| id   | name  |
+------+-------+
|    1 | alice |
|    2 | bob   |
+------+-------+
```

Snowflake が管理する既存の Iceberg テーブルに書き込むには、次を実行します。

```sql
INSERT INTO snowflake_horizon.<schema_name>.<table_name>
VALUES (1, 'doris_insert');
```

## Snowflake Open Catalog への接続

Snowflake Open Catalog は、Snowflake が提供する Apache Polaris / Iceberg REST Catalog のマネージドサービスです。Doris で Open Catalog を使用するには、まずオブジェクトストレージへのアクセスを準備し、次に Open Catalog のカタログ、名前空間、カタログロール、サービス接続を作成します。

REST エンドポイントは次のとおりです。

```text
REST endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

### AWS 環境の準備

Open Catalog は、カタログで指定されたオブジェクトストレージの場所に Iceberg のメタデータとデータファイルを保存します。AWS S3 を使用する場合は、Open Catalog のカタログを作成する前に S3 バケットと IAM ロールを準備します。

#### S3 バケットの作成

Iceberg テーブルのデータ用のバケットを作成します。

```bash
aws s3 mb s3://<bucket_name> --region <region>
aws s3 ls | grep <bucket_name>
```

Open Catalog のカタログは、このバケット内のパスをデフォルトのベースロケーションとして使用します。例：

```text
s3://<bucket_name>/<catalog_prefix>/
```

#### S3 アクセス用 IAM ポリシーの作成

Open Catalog がカタログの保存先にアクセスできるようにする IAM ポリシーを作成します。次の内容を `snowflake-open-catalog-s3-policy.json` として保存します。

```bash
cat > snowflake-open-catalog-s3-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:ListBucketMultipartUploads"
      ],
      "Resource": "arn:aws:s3:::<bucket_name>",
      "Condition": {
        "StringLike": {
          "s3:prefix": [
            "<catalog_prefix>",
            "<catalog_prefix>/*"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::<bucket_name>/<catalog_prefix>/*"
    }
  ]
}
EOF
```

#### IAM ロールの作成

まず一時的な信頼ポリシーを作成します。Open Catalog のカタログを作成した後、Snowflake Open Catalog が提供する IAM ユーザー ARN と External ID を使用して信頼ポリシーを更新します。

`snowflake-open-catalog-trust-policy.json` を作成します。

```bash
cat > snowflake-open-catalog-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<aws_account_id>:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
```

IAM ロールを作成し、S3 ポリシーをアタッチします。

```bash
aws iam create-role \
    --role-name <open_catalog_role_name> \
    --assume-role-policy-document file://snowflake-open-catalog-trust-policy.json \
    --description "IAM role for Snowflake Open Catalog to access S3"

aws iam put-role-policy \
    --role-name <open_catalog_role_name> \
    --policy-name snowflake-open-catalog-s3-access \
    --policy-document file://snowflake-open-catalog-s3-policy.json
```

IAM ロールとインラインポリシーが作成されたことを確認します。

```bash
aws iam get-role --role-name <open_catalog_role_name>
aws iam list-role-policies --role-name <open_catalog_role_name>
```

ロール ARN を記録します。Open Catalog のカタログを作成するときに使用します。

```text
arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

### Open Catalog 環境の設定

Open Catalog のカタログを作成します。Doris から Iceberg テーブルを作成、書き込みする必要がある場合は、**内部カタログ**を使用します。

![Snowflake Open Catalog のカタログを作成](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog.png)

一般的なカタログ設定：

```text
name: <catalog_name>
type: INTERNAL
storage provider: S3
default base location: s3://<bucket_name>/<catalog_prefix>/
S3 role ARN: arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

Open Catalog のカタログを作成した後、カタログの詳細ページを開き、ストレージの詳細から次の値をコピーします。

- IAM ユーザー ARN
- External ID

次に、Snowflake Open Catalog が提示した正確な値を使用するように IAM ロールの信頼関係を更新します。

```bash
cat > snowflake-open-catalog-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "<open_catalog_iam_user_arn>"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "<external_id>"
        }
      }
    }
  ]
}
EOF

aws iam update-assume-role-policy \
    --role-name <open_catalog_role_name> \
    --policy-document file://snowflake-open-catalog-trust-policy.json
```

IAM ユーザー ARN、External ID、実際のロール ARN を公開ドキュメントやスクリーンショットに載せないでください。

名前空間を作成します。たとえば `public` です。

> 画像のプレースホルダー：Snowflake Open Catalog で名前空間を作成する画面。

カタログロールを作成し、必要な権限を付与します。

![Snowflake Open Catalog でカタログロールを作成](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog-role.png)

クイックスタートでは `CATALOG_MANAGE_CONTENT` を付与できます。本番環境では、ワークロードに必要な最小限の権限を使用してください。

Doris 用のサービス接続を作成します。

![Snowflake Open Catalog のサービス接続を作成](/images/integrations/lakehouse/snowflake/open-catalog-service-connection.png)

一般的なサービス接続の設定：

```text
name: doris_connection
query engine: doris
principal role: <principal_role_name>
```

サービス接続を作成した後、クライアント認証情報をコピーします。Doris で使用する値の形式は `<client_id>:<client_secret>` です。

![Snowflake Open Catalog のサービス認証情報をコピー](/images/integrations/lakehouse/snowflake/open-catalog-service-credentials.png)

実際のクライアントシークレットを公開ファイルやスクリーンショットに保存しないでください。

### Doris カタログの作成

Doris で Iceberg REST Catalog を作成します。

```sql
CREATE CATALOG snowflake_open_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog',
    'warehouse' = '<open_catalog_catalog_name>',
    'iceberg.rest.security.type' = 'oauth2',
    'iceberg.rest.oauth2.credential' = '<client_id>:<client_secret>',
    'iceberg.rest.oauth2.server-uri' = 'https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens',
    'iceberg.rest.oauth2.scope' = 'PRINCIPAL_ROLE:<principal_role_name>',
    'iceberg.rest.vended-credentials-enabled' = 'true',
    'client.region' = '<storage_region>',
    'iceberg.rest.nested-namespace-enabled' = 'true'
);
```

パラメータに関する補足：

- `warehouse`：Open Catalog のカタログ名です。
- `iceberg.rest.oauth2.credential`：`<client_id>:<client_secret>` 形式のサービス接続の認証情報です。
- `iceberg.rest.oauth2.scope`：`PRINCIPAL_ROLE:<principal_role_name>` を指定します。
- `iceberg.rest.vended-credentials-enabled`：Doris が Open Catalog から提供される認証情報を使用できるように `true` に設定します。
- `client.region`：オブジェクトストレージのリージョンです。

### Open Catalog テーブルへのアクセスと管理

Open Catalog の名前空間にアクセスします。

```sql
SHOW DATABASES FROM snowflake_open_catalog;
SHOW TABLES FROM snowflake_open_catalog.public;
```

Doris を介して Iceberg テーブルを作成します。

```sql
CREATE TABLE snowflake_open_catalog.public.doris_open_catalog_t (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format' = 'parquet'
);
```

データを挿入してクエリを実行します。

```sql
INSERT INTO snowflake_open_catalog.public.doris_open_catalog_t
VALUES (1, 'open_catalog_insert');

SELECT *
FROM snowflake_open_catalog.public.doris_open_catalog_t
ORDER BY id;
```

## まとめ

Apache Doris は、Iceberg REST Catalog API を介して Snowflake Catalog サービスに接続し、Snowflake が管理する Iceberg データを分析できます。

- Snowflake が管理する Iceberg テーブルにクエリを実行するには、Snowflake Horizon Catalog を使用します。Doris カタログを作成するときに `iceberg.rest.view-enabled = false` を設定します。
- Doris から Snowflake Open Catalog が管理する Iceberg テーブルを作成し、書き込み、クエリを実行するには、Snowflake Open Catalog の内部カタログを使用します。
