---
{
    "title": "Alibaba Cloud OSS Tables와의 통합",
    "language": "ko",
    "description": "Iceberg REST Catalog와 S3FileIO를 사용해 Doris를 Alibaba Cloud OSS Tables에 연결하고 관리형 Iceberg 테이블의 데이터를 읽고 씁니다.",
    "keywords": [
        "Alibaba Cloud OSS Tables",
        "Apache Doris OSS Tables",
        "Iceberg REST Catalog",
        "S3FileIO",
        "OSS Table Bucket",
        "OSS Tables Catalog",
        "managed Iceberg tables",
        "SigV4 osstables",
        "OSS Tables 403 Forbidden",
        "OSS STS credentials",
        "Doris lakehouse"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Integration Guide -->
<!-- Applicable Scenarios: Alibaba Cloud OSS Tables integration / Managed Iceberg table queries and writes -->

[Alibaba Cloud OSS Tables](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables/)는 Apache Iceberg 테이블을 위한 관리형 스토리지 서비스입니다. OSS Tables는 Table Bucket을 스토리지 단위로 사용하고, Apache Iceberg REST Catalog와 호환되는 메타데이터 인터페이스를 제공하며, OSS의 S3 호환 인터페이스를 통해 테이블 데이터에 접근할 수 있게 합니다.

일반 OSS Bucket에서 Iceberg 테이블을 관리하는 방식과 비교하면 OSS Tables는 다음과 같은 기능을 제공합니다:

- Iceberg REST Catalog를 기본 제공하므로 Hive Metastore 같은 외부 메타데이터 서비스를 배포할 필요가 없습니다.
- 작은 파일의 자동 컴팩션, 스냅샷 만료 처리, 고아 파일 정리를 지원합니다.
- 여러 컴퓨팅 엔진이 동일한 테이블 데이터에 접근할 수 있는 표준 Iceberg 인터페이스를 제공합니다.

Apache Doris는 Iceberg REST Catalog를 통해 OSS Tables에 연결합니다. REST Catalog는 네임스페이스와 테이블 메타데이터를 관리하고, `S3FileIO`는 데이터 파일을 읽고 씁니다. 이 가이드에서는 Doris에서 OSS Tables Catalog를 생성하고 Iceberg 테이블을 쿼리하고 데이터를 쓰는 방법을 설명합니다.

:::caution
이 기능은 실험적 기능이며 Doris 4.1.4부터 지원됩니다.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Creating an OSS Tables Catalog / Querying and writing Iceberg tables -->

## 사용 가이드 {#usage-guide}

### 01 OSS Table Bucket 생성 {#01-create-an-oss-table-bucket}

Alibaba Cloud OSS 콘솔에서 Table Bucket을 생성하세요. 생성한 후 Table Bucket의 ARN, 리전, 이름을 기록하세요. ARN의 형식은 다음과 같습니다:

```text
acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>
```

대상 Table Bucket에 접근할 수 있는 RAM 사용자의 AccessKey를 생성하거나 임시 STS 자격 증명을 발급받으세요. FE 노드가 OSS Tables REST Catalog 엔드포인트에 접근할 수 있고, FE 및 BE 노드가 OSS 데이터 접근 엔드포인트에 접근할 수 있는지 확인하세요.

OSS Tables의 각 작업에 필요한 권한은 [Alibaba Cloud OSS Tables 권한 및 접근 제어](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control)를 참고하세요.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Configuring REST Catalog authentication and S3FileIO data access -->

### 02 Iceberg Catalog 생성 {#02-create-an-iceberg-catalog}

리전, 계정 ID, Table Bucket 이름, 접근 자격 증명을 실제 값으로 바꾸세요:

```sql
CREATE CATALOG oss_tables PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'rest',
    'iceberg.rest.uri' = 'https://<region>.oss-tables.aliyuncs.com/iceberg',
    'warehouse' = 'acs:osstables:<region>:<account_id>:bucket/<table_bucket_name>',

    'iceberg.rest.sigv4-enabled' = 'true',
    'iceberg.rest.signing-name' = 'osstables',
    'iceberg.rest.signing-region' = '<region>',
    'iceberg.rest.view-enabled' = 'false',

    'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
    'oss.endpoint' = 'https://oss-<region>.aliyuncs.com',
    'oss.region' = '<region>',
    'oss.access_key' = '<access_key_id>',
    'oss.secret_key' = '<access_key_secret>',
    'oss.use_path_style' = 'false',

    'test_connection' = 'true'
);
```

Alibaba Cloud의 내부 네트워크를 통해 접근하려면 `iceberg.rest.uri`와 `oss.endpoint`를 각각 `https://<region>-internal.oss-tables.aliyuncs.com/iceberg`와 `https://oss-<region>-internal.aliyuncs.com`으로 바꾸세요.

임시 STS 자격 증명을 사용하는 경우 `oss.session_token`을 `oss.secret_key` 뒤에 추가하세요:

```sql
'oss.session_token' = '<sts_token>',
```

Doris는 `oss.access_key`, `oss.secret_key`, 선택 사항인 `oss.session_token`을 REST Catalog SigV4 서명과 `S3FileIO` 데이터 접근에 모두 사용합니다. `iceberg.rest.access-key-id`와 `iceberg.rest.secret-access-key`를 별도로 설정할 필요는 없습니다.

#### 매개변수 {#parameters}

| 매개변수 | 필수 여부 | 설명 |
| --- | --- | --- |
| `type` | 예 | `iceberg`여야 합니다. |
| `iceberg.catalog.type` | 예 | `rest`로 설정해야 Iceberg REST Catalog를 통해 OSS Tables에 접근할 수 있습니다. |
| `iceberg.rest.uri` | 예 | OSS Tables REST Catalog 엔드포인트입니다. |
| `warehouse` | 예 | Table Bucket ARN입니다. |
| `iceberg.rest.sigv4-enabled` | 예 | `true`여야 합니다. |
| `iceberg.rest.signing-name` | 예 | 소문자 값인 `osstables`여야 합니다. 이 값은 대소문자를 구분합니다. |
| `iceberg.rest.signing-region` | 예 | SigV4 서명 리전입니다. Table Bucket의 리전과 일치해야 합니다. |
| `iceberg.rest.view-enabled` | 예 | `false`로 설정하세요. OSS Tables는 현재 Iceberg View 인터페이스를 지원하지 않습니다. |
| `io-impl` | 예 | `org.apache.iceberg.aws.s3.S3FileIO`여야 합니다. `HadoopFileIO`를 사용하지 마세요. |
| `oss.endpoint` | 예 | `S3FileIO`가 OSS 데이터 파일에 접근하는 데 사용하는 엔드포인트입니다. |
| `oss.region` | 예 | OSS 데이터 접근 리전입니다. Table Bucket의 리전과 일치해야 합니다. |
| `oss.access_key` | 예 | Alibaba Cloud AccessKey ID입니다. |
| `oss.secret_key` | 예 | Alibaba Cloud AccessKey Secret입니다. |
| `oss.session_token` | 아니요 | 임시 STS 자격 증명을 사용할 때 이 매개변수를 설정하세요. |
| `oss.use_path_style` | 아니요 | 경로 스타일 접근을 사용할지 여부입니다. 기본값은 `false`입니다. |
| `test_connection` | 아니요 | `true`로 설정하면 Doris가 Catalog를 생성할 때 REST Catalog 연결과 인증을 확인합니다. |

`test_connection=true`는 데이터 접근 검증을 대체하지 않습니다. Catalog를 생성한 후 실제 쿼리 또는 쓰기 작업을 실행하여 FE 및 BE 노드에서 OSS 데이터 접근 엔드포인트까지의 네트워크 연결과 권한을 검증하세요.

### 03 OSS Tables 접근 {#03-access-oss-tables}

```sql
SWITCH oss_tables;

SHOW DATABASES;

USE <namespace_name>;

SHOW TABLES;

SELECT * FROM <table_name> LIMIT 10;
```

<!-- Knowledge Type: Operational Example -->
<!-- Applicable Scenarios: Creating an Iceberg table and writing data to OSS Tables -->

### 04 OSS Tables 테이블 생성 및 데이터 쓰기 {#04-create-an-oss-tables-table-and-write-data}

```sql
SWITCH oss_tables;

CREATE DATABASE IF NOT EXISTS doris_demo;
USE doris_demo;

CREATE TABLE orders (
    order_id BIGINT,
    customer STRING,
    amount DECIMAL(10, 2),
    created_at DATETIME
)
PROPERTIES (
    'format-version' = '2',
    'write-format' = 'parquet',
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd'
);

INSERT INTO orders VALUES
    (1, 'Alice', 99.50, '2026-08-11 10:00:00'),
    (2, 'Bob', 120.00, '2026-08-11 10:01:00');

SELECT order_id, customer, amount, created_at
FROM orders
ORDER BY order_id;
```

```text
order_id  customer  amount  created_at
1         Alice     99.50   2026-08-11 10:00:00
2         Bob       120.00  2026-08-11 10:01:00
```

Iceberg의 `$files` 메타데이터 테이블을 쿼리하여 데이터 파일이 OSS Tables에 기록되었는지 확인할 수 있습니다:

```sql
SELECT file_path, file_format, record_count
FROM `orders$files`
ORDER BY file_path;
```

<!-- Knowledge Type: Limitations + Usage Guidance -->

## 사용 시 참고 사항 {#usage-notes}

- OSS Tables는 Iceberg 테이블 형식만 지원합니다.
- `iceberg.rest.signing-name`은 소문자 값인 `osstables`로 설정해야 합니다. 또한 `iceberg.rest.signing-region`을 올바르게 설정하고 `iceberg.rest.sigv4-enabled`를 `true`로 설정해야 합니다.
- 임시 STS 자격 증명을 사용하는 경우 자격 증명이 만료되기 전에 Catalog의 AK, SK, 토큰을 업데이트하세요.

<!-- Knowledge Type: Troubleshooting -->
<!-- Applicable Scenarios: 403 authentication errors / Metadata access succeeds but data queries fail -->

## 자주 묻는 질문 {#faq}

### Catalog 생성 시 403 Forbidden이 반환되는 경우 {#creating-the-catalog-returns-403-forbidden}

다음 설정을 확인하세요:

- `oss.access_key`와 `oss.secret_key`가 유효한지 확인하세요. 임시 STS 자격 증명을 사용하는 경우 `oss.session_token`도 올바르고 만료되지 않았는지 확인하세요.
- RAM 사용자 또는 STS 인증 주체에 대상 Table Bucket의 `oss:GetTableBucket` 및 `oss:ListNamespaces` 권한이 있는지 확인하세요.
- `warehouse`의 계정 ID, 리전, Table Bucket 이름이 올바른지 확인하세요.
- `iceberg.rest.signing-name`이 `osstables`이고 `iceberg.rest.signing-region`이 Table Bucket의 리전인지 확인하세요.

### 네임스페이스와 테이블은 표시되지만 데이터 쿼리가 실패하는 경우 {#namespaces-and-tables-are-visible-but-data-queries-fail}

FE와 모든 BE 노드가 `oss.endpoint`에 접근할 수 있고, RAM 사용자 또는 STS 인증 주체에 `oss:GetTableMetadataLocation` 및 `oss:GetTableData` 권한이 있는지 확인하세요.

OSS Tables 작업에 필요한 전체 권한 목록은 [Alibaba Cloud OSS Tables 권한 및 접근 제어](https://www.alibabacloud.com/help/en/oss/user-guide/oss-tables-access-control)를 참고하세요.
