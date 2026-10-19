---
{
    "title": "Tencent Cloud COS",
    "language": "ko",
    "description": "Tencent Cloud COS에서 Apache Doris로 데이터를 적재하는 방법: S3 Load 비동기 모드와 TVF 동기 모드의 전체 절차 및 예제.",
    "keywords": [
        "Tencent Cloud COS",
        "Tencent COS",
        "S3 Load",
        "TVF",
        "객체 스토리지 데이터 적재",
        "Doris 데이터 적재",
        "COS에서 Doris로 데이터 적재",
        "S3 프로토콜"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Tencent Cloud COS into Apache Doris -->

Apache Doris는 S3 호환 프로토콜을 통해 Tencent Cloud Object Storage (COS)에 접근합니다. 다음 두 가지 데이터 적재 방식을 지원하며, 데이터 규모와 지연 시간 요구 사항에 맞는 방식을 선택할 수 있습니다.

## 적재 방식 선택 {#choosing-a-solution}

| 적재 방식 | 모드 | 적합한 사용 사례 | 참고 자료 |
| --- | --- | --- | --- |
| S3 Load | 비동기 | 오프라인 대량 데이터 적재. 적재 작업이 백그라운드에서 실행되며 작업 상태를 확인할 수 있음 | [Broker Load 매뉴얼](../import-way/broker-load-manual.md) |
| TVF (Table Value Function) | 동기 | 임시 쿼리 또는 소규모 일괄 적재. `INSERT INTO ... SELECT`로 COS 파일을 직접 읽음 | - |

## 사전 준비 {#prerequisites}

데이터를 적재하기 전에 다음을 준비하세요.

- COS 버킷 이름과 객체 경로(예: `s3://your_bucket_name/s3load_example.csv`)
- COS 엔드포인트(예: `cos.ap-beijing.myqcloud.com`)와 리전(예: `ap-beijing`)
- 버킷에 접근할 권한이 있는 AccessKey (`access_key`)와 SecretKey (`secret_key`)
- 접근 가능한 Apache Doris 클러스터

이 문서의 예제는 모두 다음 CSV 파일 `s3load_example.csv`를 사용합니다.

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

대상 테이블은 다음 `test_s3load`입니다.

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

## 방법 1: S3 Load로 비동기 데이터 적재 {#method-1-asynchronous-import-with-s3-load}

S3 Load는 오프라인 처리나 대량 데이터 처리에 적합한 비동기 적재 방식입니다. 자세한 동작 원리는 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참조하세요.

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

위의 `s3load_example.csv` 파일을 Tencent Cloud COS의 대상 버킷에 업로드합니다.

### 2단계: Doris에 테이블 생성 {#step-2-create-the-table-in-doris}

`CREATE TABLE` 문([사전 준비](#prerequisites) 절 참조)을 실행하여 대상 테이블 `test_s3load`를 생성합니다.

### 3단계: S3 Load 작업 제출 {#step-3-submit-the-s3-load-job}

다음 SQL로 적재 작업을 제출합니다. `<your-ak>`와 `<your-sk>`를 실제 인증 정보로 바꾸고, `your_bucket_name`을 실제 버킷 이름으로 바꾸세요.

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
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### 4단계: 적재 결과 확인 {#step-4-check-the-import-result}

```sql
SELECT * FROM test_s3load;
```

결과 예시:

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

## 방법 2: TVF로 동기 데이터 적재 {#method-2-synchronous-import-with-tvf}

TVF (Table Value Function)는 `S3` 함수를 통해 COS 파일을 테이블로 읽습니다. `INSERT INTO ... SELECT`와 함께 사용하면 동기 방식으로 데이터를 적재하므로 소규모 일괄 적재나 임시 쿼리에 적합합니다.

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

위의 `s3load_example.csv` 파일을 Tencent Cloud COS의 대상 버킷에 업로드합니다.

### 2단계: Doris에 테이블 생성 {#step-2-create-the-table-in-doris-1}

`CREATE TABLE` 문([사전 준비](#prerequisites) 절 참조)을 실행하여 대상 테이블 `test_s3load`를 생성합니다.

### 3단계: TVF로 데이터 적재 {#step-3-import-the-data-with-the-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "COS",
    "s3.endpoint" = "cos.ap-beijing.myqcloud.com",
    "s3.region" = "ap-beijing",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

### 4단계: 적재 결과 확인 {#step-4-check-the-import-result-1}

```sql
SELECT * FROM test_s3load;
```

결과 예시:

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

다음 표는 Tencent Cloud COS에서 데이터를 적재할 때 자주 사용하는 매개변수를 정리한 것입니다.

| 매개변수 | 설명 | 예시 |
| --- | --- | --- |
| `provider` | 객체 스토리지 제공업체. Tencent Cloud COS에서는 `COS`로 고정 | `COS` |
| `s3.endpoint` | 버킷의 리전과 일치하는 COS 엔드포인트 | `cos.ap-beijing.myqcloud.com` |
| `s3.region` | COS 리전 | `ap-beijing` |
| `s3.access_key` | Tencent Cloud 액세스 키 ID | `<your-ak>` |
| `s3.secret_key` | Tencent Cloud 액세스 키 시크릿 | `<your-sk>` |
| `uri` / `DATA INFILE` | COS 파일 경로. 항상 `s3://` 접두사를 사용 | `s3://your_bucket_name/s3load_example.csv` |
| `format` / `FORMAT AS` | 파일 형식(CSV, Parquet, ORC 등) | `csv` |
| `column_separator` / `COLUMNS TERMINATED BY` | 열 구분자 | `,` |
| `csv_schema` | TVF 모드에서 CSV 열 스키마 선언 | `user_id:int;name:string;age:int` |
| `timeout` | S3 Load 작업의 제한 시간(초) | `3600` |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

**질문 1: S3 Load와 TVF 중 어떤 적재 방식을 선택해야 하나요?**

- 백그라운드에서 비동기로 처리할 수 있는 대량 데이터라면 **S3 Load**를 선택하세요.
- 즉시 결과를 확인해야 하는 소량 데이터이거나 SELECT 쿼리 안에서 COS 파일을 사용해야 한다면 **TVF**를 선택하세요.

**질문 2: `s3.endpoint` 값은 어떻게 확인하나요?**

버킷의 리전에 해당하는 COS 공용 또는 내부 도메인 이름을 사용하세요. 예를 들어 베이징 리전은 `cos.ap-beijing.myqcloud.com`을, 상하이 리전은 `cos.ap-shanghai.myqcloud.com`을 사용합니다. 자세한 내용은 Tencent Cloud COS 공식 문서를 참조하세요.

**질문 3: URI는 반드시 `s3://`로 시작해야 하나요?**

네. Doris는 S3 프로토콜을 통해 COS에 접근하므로 S3 Load의 `DATA INFILE`과 TVF의 `uri`는 모두 `s3://bucket_name/path` 형식을 사용해야 합니다.

**질문 4: 결과의 행 순서가 원본 파일과 다른 이유는 무엇인가요?**

Doris 테이블은 분산되어 있습니다. 데이터는 버킷 키 `HASH(user_id)`에 따라 여러 태블릿에 분산되며, `SELECT *`는 특정 순서를 보장하지 않습니다. 정렬된 결과를 얻으려면 `ORDER BY`를 명시적으로 사용하세요.

**질문 5: 데이터 적재가 실패하면 어떻게 문제를 해결하나요?**

- `access_key` / `secret_key`에 대상 버킷의 읽기 권한이 있는지 확인하세요.
- `s3.endpoint`와 `s3.region`이 버킷의 리전과 일치하는지 확인하세요.
- S3 Load 작업의 경우 `SHOW LOAD WHERE LABEL = 's3_load_2022_04_01';`를 실행하여 오류 세부 정보를 확인하세요.
