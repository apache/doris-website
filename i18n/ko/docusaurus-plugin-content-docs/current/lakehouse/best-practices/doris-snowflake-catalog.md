---
{
    "title": "Snowflake Catalog 연동",
    "language": "ko",
    "description": "이 문서에서는 Iceberg REST Catalog API를 통해 Apache Doris를 Snowflake Horizon Catalog 및 Snowflake Open Catalog에 연결하는 방법을 설명합니다."
}
---

Apache Doris는 Iceberg REST Catalog API를 통해 Snowflake Catalog 서비스에 연결할 수 있습니다. 이 연동을 통해 Doris에서 Snowflake가 관리하는 Iceberg 테이블을 쿼리할 수 있으며, Snowflake Open Catalog의 내부 Catalog를 사용하는 경우 Iceberg 테이블을 생성하고 데이터를 쓸 수도 있습니다.

이 문서에서는 다음 두 가지 Snowflake Catalog 서비스를 다룹니다.

- **Snowflake Horizon Catalog**: 기존 Snowflake 계정에서 Snowflake가 관리하는 Iceberg 테이블에 접근하는 데 사용합니다.
- **Snowflake Open Catalog**: Snowflake에서 제공하는 관리형 Apache Polaris / Iceberg REST Catalog 서비스로, Iceberg Catalog, 네임스페이스, 테이블을 관리하는 데 사용합니다.

## Snowflake Catalog 선택 {#choosing-a-snowflake-catalog}

| 항목 | Snowflake Horizon Catalog | Snowflake Open Catalog |
| --- | --- | --- |
| 주요 사용 사례 | Snowflake가 관리하는 Iceberg 테이블 쿼리 | Snowflake Open Catalog에서 Iceberg 테이블 관리 |
| Doris `warehouse` | Snowflake 데이터베이스 이름 | Open Catalog의 Catalog 이름 |
| 자격 증명 | Snowflake Programmatic Access Token (PAT) | 서비스 연결의 `<client_id>:<client_secret>` |
| OAuth 범위 | `session:role:<ROLE_NAME>` | `PRINCIPAL_ROLE:<ROLE_NAME>` |
| Doris에서 테이블 생성 | 권장하지 않음 | 내부 Catalog에서 지원 |
| Doris에서 데이터 쓰기 | 기존 Snowflake 관리형 Iceberg 테이블에 데이터 삽입 | 내부 Catalog의 테이블에 데이터 삽입 |

Snowflake에서 관리하는 테이블에는 Horizon Catalog를 사용하세요. Doris에서 Snowflake Open Catalog를 통해 Iceberg 테이블을 생성하고 관리하려면 Open Catalog의 내부 Catalog를 사용하세요.

> 참고: Horizon Catalog에 연결할 때는 `iceberg.rest.view-enabled`를 `false`로 설정하세요. (Doris 4.0.6/4.1.1부터)

### 스토리지 접근 모델 {#storage-access-model}

Horizon Catalog는 Snowflake가 스토리지 접근을 관리하는 Snowflake 관리형 Iceberg 테이블에 사용됩니다. Doris는 REST Catalog API를 통해 테이블 메타데이터를 가져오며, `iceberg.rest.vended-credentials-enabled`가 `true`로 설정되어 있으면 Snowflake가 임시 객체 스토리지 자격 증명을 반환합니다. 따라서 Horizon Catalog를 사용할 때는 Doris Catalog에 AWS IAM 역할이나 S3 자격 증명을 구성할 필요가 없습니다.

Open Catalog의 내부 Catalog는 해당 Catalog에 구성된 객체 스토리지 위치를 사용합니다. 이 위치가 AWS S3에 있는 경우, Open Catalog가 Iceberg 메타데이터 및 데이터 파일을 읽고 쓰려면 수임할 수 있는 IAM 역할이 필요합니다. IAM 역할의 신뢰 정책에서 신뢰 주체는 `sts:AssumeRole`을 호출할 수 있는 AWS 주체입니다. Snowflake Open Catalog의 경우, Catalog 스토리지 세부 정보에 표시된 IAM 사용자 ARN을 신뢰 주체로 사용하고 같은 페이지에 있는 External ID를 구성하세요. External ID는 역할 수임을 이 Open Catalog 연동으로 제한하여 confused-deputy 접근을 방지하는 데 도움이 됩니다.

## Snowflake Horizon Catalog에 연결 {#connect-to-snowflake-horizon-catalog}

### Snowflake 환경 설정 {#snowflake-environment-setup}

Snowflake Horizon Catalog는 Iceberg REST Catalog API를 통해 Snowflake 관리형 Iceberg 테이블을 제공합니다.

REST 엔드포인트는 다음과 같습니다.

```text
REST endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

Snowflake 관리형 Iceberg 테이블을 생성합니다.

```sql
CREATE OR REPLACE ICEBERG TABLE <database_name>.<schema_name>.<table_name> (
  ID BIGINT,
  NAME STRING
)
CATALOG = 'SNOWFLAKE'
EXTERNAL_VOLUME = 'SNOWFLAKE_MANAGED';
```

`SNOWFLAKE_MANAGED`는 Snowflake의 예약 값입니다. 사용자가 생성한 외부 볼륨이 아니며, 이 값을 사용할 때는 Doris에 외부 볼륨 접근 권한을 부여할 필요가 없습니다.

Doris에서 사용하는 Snowflake 역할에 권한을 부여합니다.

```sql
GRANT USAGE ON DATABASE <database_name> TO ROLE <role_name>;
GRANT USAGE ON SCHEMA <database_name>.<schema_name> TO ROLE <role_name>;
GRANT SELECT ON TABLE <database_name>.<schema_name>.<table_name> TO ROLE <role_name>;
```

Doris에서 테이블에 데이터를 써야 한다면 쓰기 권한을 부여합니다.

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE <database_name>.<schema_name>.<table_name>
TO ROLE <role_name>;
```

서비스 사용자용 Programmatic Access Token (PAT)을 생성합니다.

```sql
ALTER USER IF EXISTS <service_user>
ADD PAT <pat_name>
  DAYS_TO_EXPIRY = 7
  ROLE_RESTRICTION = '<role_name>'
  COMMENT = 'Horizon Iceberg REST access for Doris';
```

토큰 엔드포인트를 사용하여 PAT를 확인할 수 있습니다.

```bash
curl -i --fail -X POST \
  "https://<snowflake_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=session:role:<role_name>" \
  --data-urlencode "client_secret=<PAT_token>"
```

### Doris Catalog 생성 {#create-a-doris-catalog}

Doris에서 Iceberg REST Catalog를 생성합니다.

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

매개변수 설명:

- `warehouse`: Snowflake 데이터베이스 이름입니다. Snowflake의 컴퓨팅 웨어하우스를 의미하지 않습니다.
- `iceberg.rest.oauth2.credential`: Snowflake PAT입니다.
- `iceberg.rest.oauth2.scope`: `session:role:<role_name>`입니다.
- `iceberg.rest.vended-credentials-enabled`: Snowflake가 임시 객체 스토리지 자격 증명을 반환하도록 설정합니다.
- `client.region`: 기반 객체 스토리지의 리전입니다.
- `iceberg.rest.view-enabled`: Horizon Catalog에 연결할 때는 `false`로 설정합니다.

### Horizon 테이블 접근 {#access-horizon-tables}

Catalog를 생성한 후 Doris에서 Snowflake 관리형 Iceberg 테이블을 쿼리합니다.

```sql
SHOW DATABASES FROM snowflake_horizon;
SHOW TABLES FROM snowflake_horizon.<schema_name>;

SELECT COUNT(*)
FROM snowflake_horizon.<schema_name>.<table_name>;
```

출력 예시:

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

기존 Snowflake 관리형 Iceberg 테이블에 데이터를 쓰려면 다음을 실행합니다.

```sql
INSERT INTO snowflake_horizon.<schema_name>.<table_name>
VALUES (1, 'doris_insert');
```

## Snowflake Open Catalog에 연결 {#connect-to-snowflake-open-catalog}

Snowflake Open Catalog는 Snowflake에서 제공하는 관리형 Apache Polaris / Iceberg REST Catalog 서비스입니다. Doris에서 Open Catalog를 사용하려면 먼저 객체 스토리지 접근을 준비한 다음, Open Catalog의 Catalog, 네임스페이스, Catalog 역할, 서비스 연결을 생성합니다.

REST 엔드포인트는 다음과 같습니다.

```text
REST endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog

Token endpoint:
https://<open_catalog_account_identifier>.snowflakecomputing.com/polaris/api/catalog/v1/oauth/tokens
```

### AWS 환경 준비 {#aws-environment-preparation}

Open Catalog는 Catalog에 지정된 객체 스토리지 위치에 Iceberg 메타데이터와 데이터 파일을 저장합니다. AWS S3를 사용하는 경우, Open Catalog의 Catalog를 생성하기 전에 S3 버킷과 IAM 역할을 준비합니다.

#### S3 버킷 생성 {#create-an-s3-bucket}

Iceberg 테이블 데이터를 저장할 버킷을 생성합니다.

```bash
aws s3 mb s3://<bucket_name> --region <region>
aws s3 ls | grep <bucket_name>
```

Open Catalog의 Catalog는 이 버킷 내의 경로를 기본 기준 위치로 사용합니다. 예를 들면 다음과 같습니다.

```text
s3://<bucket_name>/<catalog_prefix>/
```

#### S3 접근을 위한 IAM 정책 생성 {#create-an-iam-policy-for-s3-access}

Open Catalog가 Catalog 위치에 접근할 수 있도록 허용하는 IAM 정책을 생성합니다. 다음 내용을 `snowflake-open-catalog-s3-policy.json` 파일로 저장합니다.

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

#### IAM 역할 생성 {#create-an-iam-role}

먼저 임시 신뢰 정책을 생성합니다. Open Catalog의 Catalog를 생성한 후, Snowflake Open Catalog에서 제공하는 IAM 사용자 ARN과 External ID로 신뢰 정책을 업데이트합니다.

`snowflake-open-catalog-trust-policy.json` 파일을 생성합니다.

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

IAM 역할을 생성하고 S3 정책을 연결합니다.

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

IAM 역할과 인라인 정책이 생성되었는지 확인합니다.

```bash
aws iam get-role --role-name <open_catalog_role_name>
aws iam list-role-policies --role-name <open_catalog_role_name>
```

역할 ARN을 기록해 둡니다. Open Catalog의 Catalog를 생성할 때 사용합니다.

```text
arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

### Open Catalog 환경 설정 {#open-catalog-environment-setup}

Open Catalog의 Catalog를 생성합니다. Doris에서 Iceberg 테이블을 생성하고 데이터를 써야 한다면 **내부 Catalog**를 사용하세요.

![Snowflake Open Catalog에서 Catalog 생성](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog.png)

일반적인 Catalog 설정:

```text
name: <catalog_name>
type: INTERNAL
storage provider: S3
default base location: s3://<bucket_name>/<catalog_prefix>/
S3 role ARN: arn:aws:iam::<aws_account_id>:role/<open_catalog_role_name>
```

Open Catalog의 Catalog를 생성한 후, Catalog 세부 정보 페이지를 열고 스토리지 세부 정보에서 다음 값을 복사합니다.

- IAM 사용자 ARN
- External ID

그런 다음 Snowflake Open Catalog에서 제공한 정확한 값을 사용하도록 IAM 역할의 신뢰 관계를 업데이트합니다.

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

공개 문서나 스크린샷에 IAM 사용자 ARN, External ID 또는 실제 역할 ARN을 공개하지 마세요.

네임스페이스를 생성합니다. 예를 들어 `public`을 사용할 수 있습니다.

> 이미지 자리 표시자: Snowflake Open Catalog에서 네임스페이스 생성.

Catalog 역할을 생성하고 필요한 권한을 부여합니다.

![Snowflake Open Catalog에서 Catalog 역할 생성](/images/integrations/lakehouse/snowflake/open-catalog-create-catalog-role.png)

빠르게 시작하려면 `CATALOG_MANAGE_CONTENT` 권한을 부여할 수 있습니다. 프로덕션 환경에서는 워크로드에 필요한 최소한의 권한을 사용하세요.

Doris용 서비스 연결을 생성합니다.

![Snowflake Open Catalog 서비스 연결 생성](/images/integrations/lakehouse/snowflake/open-catalog-service-connection.png)

일반적인 서비스 연결 설정:

```text
name: doris_connection
query engine: doris
principal role: <principal_role_name>
```

서비스 연결을 생성한 후 클라이언트 자격 증명을 복사합니다. Doris에서 사용하는 값은 `<client_id>:<client_secret>` 형식입니다.

![Snowflake Open Catalog 서비스 자격 증명 복사](/images/integrations/lakehouse/snowflake/open-catalog-service-credentials.png)

공개 파일이나 스크린샷에 실제 클라이언트 시크릿을 저장하지 마세요.

### Doris Catalog 생성 {#create-a-doris-catalog-1}

Doris에서 Iceberg REST Catalog를 생성합니다.

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

매개변수 설명:

- `warehouse`: Open Catalog의 Catalog 이름입니다.
- `iceberg.rest.oauth2.credential`: `<client_id>:<client_secret>` 형식의 서비스 연결 자격 증명입니다.
- `iceberg.rest.oauth2.scope`: `PRINCIPAL_ROLE:<principal_role_name>`입니다.
- `iceberg.rest.vended-credentials-enabled`: Doris가 Open Catalog에서 발급한 자격 증명을 사용할 수 있도록 `true`로 설정합니다.
- `client.region`: 객체 스토리지의 리전입니다.

### Open Catalog 테이블 접근 및 관리 {#access-and-manage-open-catalog-tables}

Open Catalog 네임스페이스에 접근합니다.

```sql
SHOW DATABASES FROM snowflake_open_catalog;
SHOW TABLES FROM snowflake_open_catalog.public;
```

Doris를 통해 Iceberg 테이블을 생성합니다.

```sql
CREATE TABLE snowflake_open_catalog.public.doris_open_catalog_t (
  id INT,
  name STRING
)
PROPERTIES (
  'write-format' = 'parquet'
);
```

데이터를 삽입하고 쿼리합니다.

```sql
INSERT INTO snowflake_open_catalog.public.doris_open_catalog_t
VALUES (1, 'open_catalog_insert');

SELECT *
FROM snowflake_open_catalog.public.doris_open_catalog_t
ORDER BY id;
```

## 요약 {#summary}

Apache Doris는 Iceberg REST Catalog API를 통해 Snowflake Catalog 서비스에 연결하고 Snowflake가 관리하는 Iceberg 데이터를 분석할 수 있습니다.

- Snowflake가 관리하는 Iceberg 테이블을 쿼리하려면 Snowflake Horizon Catalog를 사용하세요. Doris Catalog를 생성할 때 `iceberg.rest.view-enabled = false`를 설정하세요.
- Doris에서 Snowflake Open Catalog가 관리하는 Iceberg 테이블을 생성하고, 데이터를 쓰고, 쿼리하려면 Snowflake Open Catalog의 내부 Catalog를 사용하세요.
