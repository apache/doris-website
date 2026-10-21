---
{
    "title": "Azure Storage",
    "language": "ko",
    "description": "Azure Storage에서 Apache Doris로 데이터를 적재하는 방법을 설명합니다. S3 Load를 통한 비동기 적재와 TVF를 통한 동기 적재의 전체 절차와 예제를 제공합니다.",
    "keywords": [
        "Azure Storage 데이터 적재",
        "Doris Azure Blob",
        "S3 Load Azure",
        "TVF Azure",
        "Doris 데이터 적재",
        "s3_client_http_scheme",
        "Azure Blob에서 Doris로 데이터 적재"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Importing data from Azure Storage into Apache Doris -->

Apache Doris는 Azure Storage(Azure Blob Storage)에서 파일을 가져오는 기능을 지원합니다. 이 문서에서는 대표적인 두 가지 데이터 적재 방식을 설명합니다. 데이터 규모와 실시간 처리 요구 사항에 따라 적절한 방식을 선택할 수 있습니다.

## 방식 선택 {#method-selection}

다음 표에서 두 가지 데이터 적재 방식의 주요 차이점을 비교하여 적절한 방식을 빠르게 선택할 수 있습니다.

| 데이터 적재 방식 | 실행 방식 | 적합한 시나리오 | 참고 문서 |
|----------|----------|----------|----------|
| S3 Load | 비동기 | 대규모 데이터 적재, 백그라운드 작업 예약이 필요한 경우 | [Broker Load 사용 설명서](../import-way/broker-load-manual.md) |
| TVF (Table-Valued Function) | 동기 | 임시 쿼리, 소규모 배치 데이터 적재, 빠른 검증 |  |

## 사전 요구 사항 {#prerequisites}

어느 방식을 사용하든 Azure Storage에서 데이터를 적재하기 전에 다음 설정을 확인하세요.

- **HTTPS 전송**: Azure Storage는 기본적으로 HTTPS 전송을 요구합니다(스토리지 계정의 `Secure transfer required: Enabled` 설정에 해당). `s3_client_http_scheme = https`를 Doris의 `be.conf`에 설정해야 정상적으로 액세스할 수 있습니다.
- **리전 생략 가능**: Azure 호환 S3 프로토콜의 속성에서 `s3.region` 매개변수는 생략할 수 있습니다.
- **액세스 자격 증명**: Azure Storage 계정의 Access Key(AK)와 Secret Key(SK)를 준비하세요.
- **Endpoint 형식**: `<StorageAccount>.blob.core.windows.net` 형식의 Endpoint 주소를 사용하세요.

:::caution 주의
BE 설정에서 HTTPS를 활성화하지 않으면 프로토콜 불일치로 인해 데이터 적재에 실패합니다. 데이터 적재 작업을 수행하기 전에 위 설정을 완료하세요.
:::

## 방법 1: S3 Load를 사용한 데이터 적재(비동기) {#method-1-import-using-s3-load-asynchronous}

S3 Load는 비동기 배치 데이터 적재 방식으로, Azure Storage의 대규모 데이터를 Doris로 적재하는 데 적합합니다. 전체 절차는 다음과 같습니다.

### 1단계: 데이터 준비 {#step-1-prepare-data}

Azure Storage에 다음 내용으로 CSV 파일 `s3load_example.csv`를 생성하세요.

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 2단계: Doris에 테이블 생성 {#step-2-create-a-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: S3 Load를 사용하여 데이터 적재 {#step-3-import-data-using-s3-load}

다음 SQL을 실행하여 S3 Load 작업을 제출하세요.

```sql
LOAD LABEL s3_load_2022_04_01
(
    DATA INFILE("s3://your_bucket_name/s3load_example.csv")
    INTO TABLE test_s3load
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
WITH S3
(
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

주요 매개변수 설명:

| 매개변수 | 설명 |
|------|------|
| `provider` | 객체 스토리지 제공자를 식별할 수 있도록 `AZURE`로 설정해야 합니다. |
| `s3.endpoint` | Azure Blob 서비스 주소이며, 형식은 `<StorageAccount>.blob.core.windows.net`입니다. |
| `s3.region` | Azure 환경에서는 생략할 수 있습니다. |
| `s3.access_key` | Azure Storage 계정의 Access Key |
| `s3.secret_key` | Azure Storage 계정의 Secret Key |
| `timeout` | 데이터 적재 작업의 제한 시간(초 단위) |

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data}

```sql
SELECT * FROM test_s3load;
```

예상 결과:

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## 방법 2: TVF를 사용한 데이터 적재(동기) {#method-2-import-using-tvf-synchronous}

TVF(Table-Valued Function)는 하나의 SQL 문에서 데이터를 읽고 쓸 수 있는 동기 데이터 적재 방식으로, 소규모 배치 데이터나 임시 작업에 적합합니다.

### 1단계: 데이터 준비 {#step-1-prepare-data-1}

Azure Storage에 다음 내용으로 CSV 파일 `s3load_example.csv`를 생성하세요.

```text
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 2단계: Doris에 테이블 생성 {#step-2-create-a-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: TVF를 사용하여 데이터 적재 {#step-3-import-data-using-tvf}

`INSERT INTO ... SELECT FROM S3(...)`를 통해 데이터를 직접 적재하세요.

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "AZURE",
    "s3.endpoint" = "StorageAccountA.blob.core.windows.net",
    "s3.region" = "westus3",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

주요 매개변수 설명:

| 매개변수 | 설명 |
|------|------|
| `uri` | Azure Storage의 객체 경로이며, 형식은 `s3://<bucket>/<object>`입니다. |
| `format` | 파일 형식(예: `csv`, `parquet`, `orc` 등) |
| `provider` | `AZURE`로 설정해야 합니다. |
| `s3.endpoint` | Azure Blob 서비스 주소 |
| `s3.region` | Azure 환경에서는 생략할 수 있습니다. |
| `s3.access_key` / `s3.secret_key` | Azure Storage 액세스 자격 증명 |
| `column_separator` | 열 구분자(CSV에 적용) |
| `csv_schema` | CSV 열 정의이며, 형식은 `column_name:type;column_name:type`입니다. |

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data-1}

```sql
SELECT * FROM test_s3load;
```

예상 결과:

```text
mysql> select * from test_s3load;
+---------+-----------+------+
| user_id | name      | age  |
+---------+-----------+------+
|       5 | Ava       |   17 |
|      10 | Liam      |   64 |
|       7 | Sophia    |   32 |
|       9 | Emma      |   37 |
|       1 | Emily     |   25 |
|       4 | Alexander |   60 |
|       2 | Benjamin  |   35 |
|       3 | Olivia    |   28 |
|       6 | William   |   69 |
|       8 | James     |   64 |
+---------+-----------+------+
10 rows in set (0.04 sec)
```

## 자주 묻는 질문 {#faq}

### Q1: S3 Load와 TVF 중 어떤 방식을 선택해야 하나요? {#q1-how-should-you-choose-between-s3-load-and-tvf}

- **S3 Load**: 비동기로 실행되며, 대규모 배치 데이터, Label로 적재 상태를 추적해야 하는 경우, 주기적인 작업으로 예약해야 하는 경우에 적합합니다.
- **TVF**: 동기로 실행되며, 소규모 배치 데이터, 임시 쿼리, 파일 내용의 빠른 검증, 데이터를 쓰기 전에 SELECT에서 변환해야 하는 경우에 적합합니다.

### Q2: Azure Storage에 액세스할 때 오류가 발생하거나 연결에 실패하는 이유는 무엇인가요? {#q2-why-does-an-error-or-connection-failure-occur-when-accessing-azure-storage}

다음 사항을 확인하세요.

1. `s3_client_http_scheme = https`가 BE 노드의 `be.conf`에 설정되어 있고, 설정을 적용하기 위해 BE를 재시작했는지 확인하세요.
2. Azure Storage 계정에서 `Secure transfer required`가 활성화되어 있으면 HTTPS를 사용해야 합니다.
3. `s3.endpoint`의 형식이 올바른지 확인하세요. 프로토콜 접두사 없이 `<StorageAccount>.blob.core.windows.net` 형식이어야 합니다.
4. AK/SK가 유효하고 대상 Bucket에 대한 읽기 권한이 있는지 확인하세요.

### Q3: `s3.region`은 필수인가요? {#q3-is-s3region-required}

아니요. Azure 환경에서는 `s3.region`을 생략할 수 있습니다. 지정하더라도 데이터 적재 과정에 영향을 주지 않습니다.

### Q4: URI는 어떤 형식을 사용해야 하나요? {#q4-what-format-should-the-uri-use}

S3 Load의 `DATA INFILE`과 TVF의 `uri` 모두 `s3://<bucket_name>/<object_path>` 형식을 사용하여 Azure Storage의 객체에 액세스하세요.

## 문제 해결 {#troubleshooting}

| 증상 | 가능한 원인 | 해결 방법 |
|------|----------|----------|
| 데이터 적재 작업에서 연결 오류 발생 | BE에서 HTTPS가 활성화되지 않음 | `s3_client_http_scheme = https`를 `be.conf`에 설정하고 BE를 재시작하세요. |
| 권한 또는 인증 오류 발생 | 잘못된 AK/SK 또는 권한 부족 | Access Key와 Secret Key가 올바른지 확인하고, 대상 컨테이너에 대한 읽기 권한을 확인하세요. |
| Endpoint 주소를 확인할 수 없음 | Endpoint에 프로토콜 접두사가 포함되어 있거나 철자가 잘못됨 | `<StorageAccount>.blob.core.windows.net`을 사용하고 `https://`와 같은 접두사는 포함하지 마세요. |
| 데이터 적재 작업 시간 초과 | 데이터 규모가 크거나 네트워크가 느림 | `timeout` 값을 `PROPERTIES`에서 늘리세요. |

## 관련 문서 {#related-documents}

- [Broker Load 사용 설명서](../import-way/broker-load-manual.md)
