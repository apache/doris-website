---
{
    "title": "MinIO에서 데이터 적재하기",
    "language": "ko",
    "description": "MinIO 객체 스토리지의 CSV, Parquet 및 기타 파일을 Doris로 어떻게 적재할 수 있나요? 비동기 S3 Load 방식과 동기 TVF 방식을 모두 지원합니다.",
    "keywords": [
        "MinIO 데이터 적재",
        "Doris MinIO",
        "S3 Load",
        "S3 TVF",
        "객체 스토리지 데이터 적재",
        "use_path_style",
        "MinIO 엔드포인트"
    ],
    "sidebar_label": "MinIO"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing files from MinIO object storage into Doris -->

[MinIO](https://min.io/)는 S3와 호환되는 객체 스토리지입니다. Doris는 MinIO의 파일을 적재하는 두 가지 방식을 제공합니다. 데이터 규모와 필요한 처리 시점에 따라 적합한 방식을 선택하세요.

| 데이터 적재 방식 | 실행 모드 | 적합한 사용 사례 | 참고 문서 |
|----------|----------|----------|----------|
| S3 Load   | 비동기 | 대량 일괄 데이터 적재, 백그라운드에서 실행해야 하는 작업 | [Broker Load 매뉴얼](../import-way/broker-load-manual.md) |
| TVF (Table Value Function) | 동기 | 소량 데이터 적재 및 임시 쿼리를 통한 적재, `INSERT INTO ... SELECT`와 함께 사용 | 이 문서의 예제 |

## 사전 요구 사항 {#prerequisites}

어느 방식으로든 MinIO 데이터를 적재하기 전에 다음 조건을 확인하세요.

- Doris 클러스터가 배포되어 있으며 MinIO 서비스에 정상적으로 접근할 수 있어야 합니다.
- MinIO의 엔드포인트, 리전, 액세스 키, 시크릿 키를 확보해야 합니다.
- 적재할 CSV/Parquet 파일이 MinIO 버킷에 업로드되어 있어야 합니다.

:::caution 중요: MinIO 연결 구성 시 유의 사항
S3 Load 또는 TVF로 MinIO 데이터를 적재할 때는 다음 두 가지 사항에 유의하세요.

- **엔드포인트 프로토콜 접두사**: TLS를 활성화하지 않고 로컬 네트워크에 MinIO를 배포했다면, `http://`를 `endpoint`에 명시적으로 추가해야 합니다. 예: `"s3.endpoint" = "http://localhost:9000"`.
- **경로 접근 방식**: S3 SDK는 기본적으로 가상 호스트 방식을 사용하지만, MinIO는 기본적으로 이 접근 모드를 활성화하지 않습니다. `"use_path_style" = "true"`를 추가하여 경로 방식을 사용하도록 설정하세요.
:::

## 방법 1: S3 Load로 데이터 적재하기(비동기) {#method-1-import-using-s3-load-asynchronous}

S3 Load는 MinIO의 파일을 비동기 작업으로 Doris에 적재하는 데 적합합니다. 자세한 절차는 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참고하세요.

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

다음 내용으로 CSV 파일 `s3load_example.csv`를 생성하고 MinIO에 업로드하세요.

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

### 3단계: S3 Load로 데이터 적재 {#step-3-import-data-using-s3-load}

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
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "use_path_style" = "true"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data}

쿼리를 실행하여 데이터가 정상적으로 적재되었는지 확인하세요.

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

## 방법 2: TVF로 데이터 적재하기(동기) {#method-2-import-using-tvf-synchronous}

TVF (Table Value Function) 방식은 `S3()` 함수를 통해 MinIO 파일을 가상 테이블로 읽고, `INSERT INTO ... SELECT`와 결합하여 동기적으로 데이터를 적재합니다. 소량 데이터를 처리하거나 필요에 따라 임시로 사용하는 경우에 적합합니다.

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

다음 내용으로 CSV 파일 `s3load_example.csv`를 생성하고 MinIO에 업로드하세요.

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

### 3단계: TVF로 데이터 적재 {#step-3-import-data-using-tvf}

다음 SQL을 실행하여 데이터를 동기적으로 적재하세요.

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "S3",
    "s3.endpoint" = "play.min.io:9000",
    "s3.region" = "us-east-1",
    "s3.access_key" = "myminioadmin",
    "s3.secret_key" = "minio-secret-key-change-me",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int",
    "use_path_style" = "true"
);
```

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data-1}

쿼리를 실행하여 데이터가 정상적으로 적재되었는지 확인하세요.

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

## 주요 매개변수 {#key-parameters}

<!-- Knowledge type: Configuration parameters -->

S3 Load와 TVF 모두 다음 매개변수를 올바르게 구성해야 합니다.

| 매개변수 | 설명 | 예시 값 |
|------|------|--------|
| `provider` | 객체 스토리지 제공자입니다. MinIO를 사용할 때는 `S3`로 설정하세요. | `S3` |
| `s3.endpoint` | MinIO 서비스 주소입니다. TLS가 활성화되어 있지 않으면 `http://` 접두사가 필요합니다. | `http://localhost:9000` |
| `s3.region` | MinIO가 배포된 리전입니다. 임의의 값으로 설정할 수 있지만 일관되게 유지해야 합니다. | `us-east-1` |
| `s3.access_key` | MinIO 액세스 키 ID입니다. | `myminioadmin` |
| `s3.secret_key` | MinIO 시크릿 액세스 키입니다. | `minio-secret-key-change-me` |
| `use_path_style` | 경로 방식으로 접근할지 여부입니다. MinIO에서는 반드시 `true`로 설정해야 합니다. | `true` |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Connection configuration -->

### Q1: S3 Load와 TVF 중 어떤 방식을 선택해야 하나요? {#q1-how-do-i-choose-between-s3-load-and-tvf}

- **S3 Load**: 비동기적으로 실행됩니다. 대량 일괄 데이터 적재에 적합합니다. 작업을 제출하면 Doris가 백그라운드에서 작업을 예약하고 실행하며, `SHOW LOAD`로 작업 상태를 조회할 수 있습니다.
- **TVF**: 동기적으로 실행됩니다. 소량 데이터 처리, 임시 분석 또는 `INSERT INTO ... SELECT` 파이프라인과 결합하는 경우에 적합합니다. 결과를 즉시 반환합니다.

### Q2: MinIO에 연결할 때 엔드포인트 관련 오류가 발생하면 어떻게 해야 하나요? {#q2-what-should-i-do-if-i-get-endpoint-related-errors-when-connecting-to-minio}

엔드포인트에 올바른 프로토콜 접두사가 포함되어 있는지 확인하세요.

- TLS가 비활성화된 경우: 반드시 `http://`를 포함해야 합니다. 예: `http://localhost:9000`.
- TLS가 활성화된 경우: `https://` 접두사를 사용하세요.

### Q3: 접근 시 버킷 파싱 오류 또는 404 오류가 발생하면 어떻게 해야 하나요? {#q3-what-should-i-do-if-access-reports-a-bucket-parsing-error-or-404}

MinIO는 기본적으로 가상 호스트 방식의 접근을 지원하지 않습니다. 데이터 적재 매개변수에 다음 설정을 명시적으로 추가해야 합니다.

```text
"use_path_style" = "true"
```

### Q4: Parquet/ORC와 같은 다른 형식도 지원하나요? {#q4-are-other-formats-such-as-parquetorc-supported}

네. `FORMAT AS "CSV"`(TVF에서는 `"format" = "csv"`)를 `parquet`, `orc` 또는 해당하는 다른 형식으로 바꾸세요. 자세한 내용은 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참고하세요.
