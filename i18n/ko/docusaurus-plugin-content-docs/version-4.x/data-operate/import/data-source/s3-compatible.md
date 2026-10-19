---
{
    "title": "S3 호환 스토리지",
    "language": "ko",
    "description": "MinIO, Ceph 등의 S3 호환 스토리지에서 Apache Doris로 데이터를 적재하는 방법: S3 Load를 통한 비동기 데이터 적재 또는 TVF를 통한 동기 데이터 적재.",
    "keywords": [
        "S3 호환 스토리지",
        "Doris로 MinIO 데이터 적재",
        "Doris로 Ceph 데이터 적재",
        "S3 Load",
        "S3 TVF",
        "Broker Load",
        "객체 스토리지 데이터 적재",
        "use_path_style",
        "virtual-hosted style",
        "path style"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Applicable scenario: Loading data from S3-compatible storage (MinIO, Ceph, etc.) into Doris -->

Apache Doris는 MinIO, Ceph, Huawei Cloud OBS, Tencent Cloud COS 등 S3 프로토콜과 호환되는 다양한 객체 스토리지 시스템에서 데이터를 적재할 수 있습니다. 이 문서에서는 두 가지 데이터 적재 방식의 적용 시나리오와 전체 절차를 설명합니다.

## 방식 선택 {#choosing-a-method}

데이터 크기와 처리 모드에 따라 적절한 데이터 적재 방식을 선택하세요:

| 데이터 적재 방식 | 모드 | 적용 시나리오 | 참고 자료 |
| --- | --- | --- | --- |
| **S3 Load** | 비동기 | 대규모 배치 데이터 적재, 작업 관리 및 재시도 메커니즘 필요 | [Broker Load 매뉴얼](../import-way/broker-load-manual.md) |
| **TVF (Table Value Function)** | 동기 | 임시 쿼리, 소규모 배치 데이터 적재, SQL에서 직접 데이터 사용 | - |

:::caution 참고
S3 SDK는 기본적으로 **virtual-hosted style**로 객체 스토리지에 접근합니다. 대상 스토리지 시스템에서 이 방식을 활성화하지 않았거나 지원하지 않는 경우, `"use_path_style" = "true"` 매개변수를 추가하여 **path style**을 강제로 사용하도록 설정하세요.
:::

## S3 Load로 데이터 적재(비동기) {#loading-with-s3-load-asynchronous}

S3 Load는 대규모 배치 데이터 적재에 적합합니다. 데이터 적재 작업은 비동기로 제출되며, Doris가 백그라운드에서 스케줄링합니다. 자세한 동작 원리는 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참조하세요.

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

S3 호환 스토리지에 다음 내용의 CSV 파일 `s3load_example.csv`를 생성하세요:

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

### 2단계: Doris에 대상 테이블 생성 {#step-2-create-the-target-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: S3 Load 작업 제출 {#step-3-submit-the-s3-load-job}

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
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

주요 매개변수:

| 매개변수 | 설명 |
| --- | --- |
| `provider` | 객체 스토리지 공급자 유형입니다. S3 호환 스토리지에는 항상 `S3`를 사용하세요. |
| `s3.endpoint` | S3 호환 스토리지의 접근 엔드포인트입니다(프로토콜 접두사 제외). |
| `s3.region` | 버킷이 위치한 리전입니다. |
| `s3.access_key` | 액세스 키(AK)입니다. |
| `s3.secret_key` | 시크릿 키(SK)입니다. |
| `use_path_style` | path style 접근을 사용할지 여부입니다. MinIO 등의 스토리지 시스템에서는 일반적으로 이 값을 `true`로 설정해야 합니다. |
| `timeout` | 데이터 적재 작업의 제한 시간이며, 단위는 초입니다. |

### 4단계: 데이터 적재 결과 확인 {#step-4-verify-the-loading-result}

```sql
SELECT * FROM test_s3load;
```

예상 출력:

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

## TVF로 데이터 적재(동기) {#loading-with-tvf-synchronous}

TVF는 S3 호환 스토리지의 파일을 테이블로 취급하여 쿼리할 수 있게 합니다. `INSERT INTO ... SELECT`와 함께 사용하면 동기 데이터 적재가 가능하며, 임시 분석과 소규모 배치 데이터 적재에 적합합니다.

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

S3 호환 스토리지에 다음 내용의 CSV 파일 `s3load_example.csv`를 생성하세요:

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

### 2단계: Doris에 대상 테이블 생성 {#step-2-create-the-target-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: TVF로 동기 데이터 적재 {#step-3-load-synchronously-via-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

주요 매개변수:

| 매개변수 | 설명 |
| --- | --- |
| `uri` | S3 호환 스토리지에 있는 파일의 전체 경로입니다. |
| `format` | 파일 형식입니다. 예: `csv`, `parquet`, `orc`. |
| `provider` | 객체 스토리지 공급자 유형입니다. S3 호환 스토리지에는 항상 `S3`를 사용하세요. |
| `s3.endpoint` | S3 호환 스토리지의 접근 엔드포인트입니다. |
| `s3.region` | 버킷이 위치한 리전입니다. |
| `s3.access_key` | 액세스 키(AK)입니다. |
| `s3.secret_key` | 시크릿 키(SK)입니다. |
| `column_separator` | 열 구분자입니다. |
| `csv_schema` | CSV 파일의 열 정의이며, `field_name:type` 형식을 사용합니다. |
| `use_path_style` | path style 접근을 사용할지 여부입니다. |

### 4단계: 데이터 적재 결과 확인 {#step-4-verify-the-loading-result-1}

```sql
SELECT * FROM test_s3load;
```

예상 출력:

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

<!-- Knowledge type: Troubleshooting -->

### 1. MinIO 등의 스토리지에 접근할 때 버킷이 존재하지 않거나 버킷 이름을 확인할 수 없다는 오류가 발생하는 이유는 무엇인가요? {#1-why-does-accessing-storage-such-as-minio-report-that-the-bucket-does-not-exist-or-cannot-be-resolved}

S3 SDK는 기본적으로 virtual-hosted style로 도메인 이름을 구성하지만(예: `bucket.endpoint`), MinIO, Ceph 및 이와 유사한 시스템은 일반적으로 path style을 사용합니다(예: `endpoint/bucket`). 데이터 적재 매개변수에 `"use_path_style" = "true"`를 추가하면 이 문제를 해결할 수 있습니다.

### 2. `s3.endpoint`에 `http://` 또는 `https://` 접두사를 포함해야 하나요? {#2-does-s3endpoint-need-to-include-the-http-or-https-prefix}

아니요. `s3.endpoint`에는 호스트 이름과 포트만 지정합니다(예: `play.min.io:9000`).

### 3. S3 Load와 TVF 중 어떤 방식을 선택해야 하나요? {#3-how-do-i-choose-between-s3-load-and-tvf}

- 데이터 양이 많고 비동기 실행과 작업 이력 보존이 필요하면 **S3 Load**를 사용하세요.
- 단일 SQL 문으로 S3 파일을 읽고 `INSERT INTO ... SELECT`로 결과를 동기적으로 기록해야 한다면 **TVF**를 사용하세요.

### 4. 데이터 적재 작업의 제한 시간이 초과되면 어떻게 해야 하나요? {#4-what-should-i-do-if-the-loading-job-times-out}

S3 Load의 `timeout` 속성(초 단위)을 늘리거나, 대용량 파일을 여러 개의 작은 파일로 나누어 동시성을 높이세요.
