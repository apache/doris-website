---
{
    "title": "Amazon S3",
    "language": "ko",
    "description": "Amazon S3에서 Doris로 데이터를 적재하는 방법: S3 Load를 사용한 비동기 데이터 적재와 TVF를 사용한 동기 데이터 적재의 전체 절차, 매개변수 및 예제.",
    "keywords": [
        "Amazon S3 데이터 적재",
        "Doris S3 Load",
        "S3 TVF",
        "AWS S3 데이터 적재",
        "Broker Load S3",
        "AWS Assume Role"
    ]
}
---

<!-- Knowledge type: Procedure / Data loading -->
<!-- Use case: Load files from AWS S3 into Doris -->

Doris는 AWS S3에서 파일을 적재하는 두 가지 방식을 제공하며, 각각 비동기 및 동기 시나리오에 적합합니다.

| 방법 | 유형 | 용도 |
| --- | --- | --- |
| **S3 Load** | 비동기 | 대규모 일괄 데이터 적재, 예약 작업, 높은 처리량과 안정성이 필요한 오프라인 데이터 적재 |
| **TVF (Table Value Function)** | 동기 | 임시 쿼리, ETL 처리, `INSERT INTO ... SELECT`와 결합한 동기 쓰기 |

> 팁: S3 Load는 Broker Load를 기반으로 구현되었습니다. 자세한 동작은 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참조하세요.

## 방법 1: S3 Load로 데이터 적재(비동기) {#method-1-load-with-s3-load-asynchronous}

<!-- Knowledge type: Procedure -->

S3 Load는 비동기 데이터 적재 방식입니다. 작업을 제출하면 즉시 반환되며, 작업은 백그라운드에서 실행됩니다. 데이터 양이 많거나 백그라운드 일괄 처리가 필요한 시나리오에 적합합니다.

### 단계 1: 데이터 준비 {#step-1-prepare-the-data}

S3에 다음 내용으로 CSV 파일 `s3load_example.csv`를 생성합니다.

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

### 단계 2: Doris에 테이블 생성 {#step-2-create-a-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 단계 3: S3 Load로 데이터 적재 {#step-3-load-the-data-with-s3-load}

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
    "s3.endpoint" = "https://s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

주요 매개변수:

| 매개변수 | 설명 |
| --- | --- |
| `DATA INFILE` | 적재할 S3 파일의 URI. 형식: `s3://bucket/path` |
| `COLUMNS TERMINATED BY` | CSV 열 구분자 |
| `FORMAT AS` | 파일 형식. 예: `CSV` |
| `provider` | 객체 스토리지 제공업체. AWS S3에는 `S3` 사용 |
| `s3.endpoint` | S3 서비스의 Endpoint. 예: `s3.us-west-2.amazonaws.com` |
| `s3.region` | S3 버킷이 위치한 Region |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `timeout` | 데이터 적재 작업의 제한 시간(초) |

### 단계 4: 적재된 데이터 확인 {#step-4-check-the-loaded-data}

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

## 방법 2: TVF로 데이터 적재(동기) {#method-2-load-with-tvf-synchronous}

<!-- Knowledge type: Procedure -->

TVF (Table Value Function)는 S3의 파일을 테이블로 취급합니다. `SELECT`로 직접 쿼리하고, `INSERT INTO`와 결합하여 결과를 Doris 테이블에 동기적으로 쓸 수 있습니다. 데이터 양이 적당하고 결과를 바로 확인해야 하는 시나리오에 적합합니다.

### 단계 1: 데이터 준비 {#step-1-prepare-the-data-1}

S3에 다음 내용으로 CSV 파일 `s3load_example.csv`를 생성합니다.

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

### 단계 2: Doris에 테이블 생성 {#step-2-create-a-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 단계 3: TVF로 데이터 적재 {#step-3-load-the-data-with-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "s3.endpoint" = "https://s3.us-west-2.amazonaws.com",
    "s3.region" = "us-west-2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

주요 매개변수:

| 매개변수 | 설명 |
| --- | --- |
| `uri` | S3에서 읽을 파일의 URI |
| `format` | 파일 형식. 예: `csv` |
| `s3.endpoint` | S3 서비스의 Endpoint |
| `s3.region` | S3 버킷이 위치한 Region |
| `s3.access_key` | AWS Access Key |
| `s3.secret_key` | AWS Secret Key |
| `column_separator` | 열 구분자 |
| `csv_schema` | CSV 파일의 스키마 정의. 형식: `column_name:type;...` |

### 단계 4: 적재된 데이터 확인 {#step-4-check-the-loaded-data-1}

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

## AWS Assume Role을 사용한 인증 {#authentication-with-aws-assume-role}

<!-- Knowledge type: Configuration / Authentication -->

Doris는 Access Key / Secret Key를 사용하는 방식 외에도 `AWS Assume Role`을 통한 S3 Load 및 TVF 인증을 지원합니다. 이 방식은 자격 증명 배포에 제약이 있는 기업에 적합합니다. 자세한 구성 방법은 [AWS 통합 - Assumed Role 인증](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization)을 참조하세요.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: S3 Load와 TVF 중 어떤 방식을 선택해야 하나요?**

- 대규모 일괄 작업, 오프라인 작업, 예약 작업에는 **S3 Load**를 우선 사용하세요(비동기 방식, 백그라운드 실행, 제한 시간 제어 지원).
- 임시 쿼리를 실행하거나 쓰기 전에 SQL로 데이터를 처리해야 할 때는 **TVF**를 우선 사용하세요(동기 방식, `SELECT` / `INSERT`와 결합 가능).

**Q2: S3 파일의 Region과 Endpoint는 어떻게 지정하나요?**

- `s3.region`으로 버킷이 위치한 Region을 지정합니다. 예: `us-west-2`.
- `s3.endpoint`로 서비스 주소를 지정합니다. 예: `s3.us-west-2.amazonaws.com`.
- 두 값이 서로 일치해야 합니다. 그렇지 않으면 연결 실패나 리디렉션 오류가 발생할 수 있습니다.

**Q3: TVF 데이터 적재 시 `csv_schema`가 필수인가요?**

원본 파일이 CSV인 경우, `csv_schema`를 명시적으로 제공하여 각 열의 이름과 유형을 지정하는 것이 좋습니다. 이렇게 하면 유형 추론으로 인한 불확실성을 피할 수 있습니다.

**Q4: S3 Load 작업이 너무 오래 실행되면 어떻게 하나요?**

`timeout`을 `PROPERTIES`에서 적절히 늘리세요(단위: 초). 예제에서는 `3600`을 사용하며, 데이터 규모에 따라 조정할 수 있습니다.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 증상 | 가능한 원인 | 권장 조치 |
| --- | --- | --- |
| S3 연결 실패 / 연결 시간 초과 | `s3.endpoint`가 `s3.region`과 일치하지 않거나 네트워크에 연결할 수 없음 | Endpoint와 Region을 확인하고 Doris BE 노드가 S3에 접근할 수 있는지 확인 |
| 인증 실패(403) | Access Key / Secret Key가 잘못되었거나 권한이 부족함 | AK/SK가 올바른지 확인하고 해당 버킷 및 객체에 대한 읽기 권한 확인 |
| 파일을 찾을 수 없음 | `DATA INFILE` / `uri` 경로가 잘못됨 | 버킷 이름, 키 경로 및 대소문자 구분 확인 |
| CSV 파싱 오류 | 구분자 또는 스키마가 일치하지 않음 | `COLUMNS TERMINATED BY` / `column_separator` 및 `csv_schema` 확인 |
| 작업 시간 초과 | 데이터 양이 많거나 네트워크가 느림 | `timeout`을 늘리거나 파일을 분할하여 병렬로 적재 |

## 관련 문서 {#related-documents}

- [Broker Load 매뉴얼](../import-way/broker-load-manual.md)
- [AWS 통합 - Assumed Role 인증](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md#assumed-role-authentication-and-authorization)
