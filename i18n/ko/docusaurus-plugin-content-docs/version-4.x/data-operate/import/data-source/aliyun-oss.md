---
{
    "title": "Aliyun OSS",
    "language": "ko",
    "description": "이 문서에서는 S3 Load와 TVF를 사용하여 Aliyun OSS의 CSV 및 기타 파일을 Apache Doris로 효율적으로 가져오는 방법을 설명합니다.",
    "keywords": [
        "Aliyun OSS",
        "Aliyun OSS",
        "Doris OSS 가져오기",
        "S3 Load",
        "Table Value Function",
        "TVF 가져오기",
        "객체 스토리지 가져오기",
        "Broker Load",
        "OSS endpoint"
    ]
}
---

<!-- Knowledge type: Procedure / Data Import -->
<!-- Applicable scenario: Loading data from Aliyun OSS into Doris -->

Apache Doris는 Aliyun OSS(Object Storage Service)의 파일 가져오기를 지원하며, 대표적으로 대량 비동기 가져오기와 일회성 동기 가져오기라는 두 가지 시나리오에 사용할 수 있습니다. 이 문서에서는 두 방식을 비교하고, 실행 절차와 자주 발생하는 문제의 해결 방법을 설명합니다.

## 방식 선택 {#choosing-an-approach}

가져오기 방식을 선택하기 전에 아래 표를 참고하여 사용 환경에 적합한 방식을 선택하세요.

| 가져오기 방식 | 실행 명령                       | 동기/비동기 | 적용 시나리오                                                  | 참고 자료                                                         |
| ------------- | ------------------------------------- | ---------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| S3 Load       | `LOAD LABEL ...`                      | 비동기      | 대규모 배치 데이터 가져오기, 작업 관리 및 실패 시 재시도가 필요한 경우 | [Broker Load 매뉴얼](../import-way/broker-load-manual.md)         |
| TVF 가져오기    | `INSERT INTO ... SELECT FROM S3(...)` | 동기       | 일회성 쿼리, 소규모 데이터 가져오기, 즉시 결과가 필요한 경우  | -                                                                 |

## 사전 요구 사항 {#prerequisites}

시작하기 전에 다음 정보와 환경이 준비되어 있는지 확인하세요.

- Aliyun OSS의 `bucket` 이름과 대상 파일 경로
- 액세스 자격 증명: `AccessKey`(AK)와 `SecretKey`(SK)
- OSS Endpoint 및 Region 정보
- Doris 클러스터에서 OSS에 접근할 수 있는 네트워크 환경(공용망 또는 내부망)

:::caution Endpoint 선택 시 유의 사항
Aliyun OSS의 공용망 Endpoint와 내부망 Endpoint는 서로 다릅니다. Doris 클러스터와 OSS가 같은 Region에 있다면 내부망 Endpoint를 사용하세요. 지연 시간이 줄어들고 대역폭이 더 안정적이며, 공용망 트래픽 요금도 피할 수 있습니다.

- 내부망 Endpoint: `oss-cn-hangzhou-internal.aliyuncs.com`
- 공용망 Endpoint: `oss-cn-hangzhou.aliyuncs.com`
:::

## S3 Load로 가져오기(비동기) {#importing-with-s3-load-asynchronous}

S3 Load는 Broker Load를 기반으로 하는 비동기 가져오기 방식으로, 배치 데이터 적재에 적합합니다. 자세한 동작 원리는 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참고하세요.

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

Aliyun OSS에 다음 내용으로 CSV 파일 `s3load_example.csv`를 만듭니다.

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

### 3단계: S3 Load 가져오기 실행 {#step-3-run-the-s3-load-import}

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
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

주요 매개변수:

| 매개변수         | 설명                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `provider`        | 객체 스토리지 유형입니다. Aliyun OSS에서는 `OSS`로 고정합니다.         |
| `s3.endpoint`     | OSS 서비스 Endpoint입니다. Region과 네트워크 환경에 따라 선택합니다. |
| `s3.region`       | OSS Region 이름입니다. 예: `oss-cn-hangzhou`.                      |
| `s3.access_key`   | Aliyun 계정의 AccessKey ID입니다.                              |
| `s3.secret_key`   | Aliyun 계정의 AccessKey Secret입니다.                          |
| `timeout`         | 작업 제한 시간이며, 단위는 초입니다.                                            |

### 4단계: 가져오기 결과 확인 {#step-4-check-the-import-result}

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

## TVF로 가져오기(동기) {#importing-with-tvf-synchronous}

TVF(Table Value Function)를 사용하면 테이블 반환 함수로 객체 스토리지 파일을 직접 읽고, `INSERT INTO ... SELECT`를 통해 대상 테이블에 데이터를 동기식으로 기록할 수 있습니다. 이 방식은 일회성 데이터 가져오기나 소규모 배치 데이터 적재에 적합합니다.

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

Aliyun OSS에 다음 내용으로 CSV 파일 `s3load_example.csv`를 만듭니다.

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

### 3단계: TVF 가져오기 실행 {#step-3-run-the-tvf-import}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OSS",
    "s3.endpoint" = "oss-cn-hangzhou.aliyuncs.com",
    "s3.region" = "oss-cn-hangzhou",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

주요 매개변수:

| 매개변수           | 설명                                                                |
| ------------------- | -------------------------------------------------------------------------- |
| `uri`               | OSS 파일 주소입니다. `s3://` 프로토콜 접두사를 사용합니다.                   |
| `format`            | 파일 형식입니다. 예: `csv`, `parquet`, `orc`.                       |
| `provider`          | 객체 스토리지 유형입니다. Aliyun OSS에서는 `OSS`로 고정합니다.               |
| `s3.endpoint`       | OSS 서비스 Endpoint입니다.                                                      |
| `s3.region`         | OSS Region 이름입니다.                                                           |
| `s3.access_key`     | Aliyun 계정의 AccessKey ID입니다.                                    |
| `s3.secret_key`     | Aliyun 계정의 AccessKey Secret입니다.                                |
| `column_separator`  | CSV 열 구분자입니다.                                                  |
| `csv_schema`        | CSV 열 정의입니다. `column_name:type;column_name:type;...` 형식으로 지정합니다. |

### 4단계: 가져오기 결과 확인 {#step-4-check-the-import-result-1}

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

<!-- Knowledge type: FAQ / Troubleshooting -->

## 자주 묻는 질문 {#faq}

### Q1: S3 Load와 TVF 가져오기 중 어떤 방식을 선택해야 하나요? {#q1-how-do-i-choose-between-s3-load-and-tvf-import}

- 데이터양이 많고 작업 스케줄링 및 재시도 기능을 갖춘 비동기 실행이 필요하다면 **S3 Load**를 사용하세요.
- 일회성 쿼리나 동기식 쓰기가 필요하고 결과를 즉시 확인해야 한다면 **TVF 가져오기**를 사용하세요.

### Q2: 내부망 Endpoint와 공용망 Endpoint의 차이는 무엇인가요? {#q2-what-is-the-difference-between-an-internal-endpoint-and-a-public-endpoint}

- Doris 클러스터와 OSS가 같은 Region에 있다면 **내부망 Endpoint**(예: `oss-cn-hangzhou-internal.aliyuncs.com`)를 사용하여 지연 시간을 줄이고 더 안정적인 대역폭을 확보하며 공용망 트래픽 요금을 피할 수 있습니다.
- 다른 Region에 접근하거나 클러스터가 Aliyun 외부에 배포되어 있다면 **공용망 Endpoint**(예: `oss-cn-hangzhou.aliyuncs.com`)를 사용하세요.

### Q3: `provider` 매개변수를 반드시 `OSS`로 설정해야 하는 이유는 무엇인가요? {#q3-why-must-the-provider-parameter-be-set-to-oss}

`provider` 매개변수는 Doris 백엔드에 사용 중인 객체 스토리지 유형을 알려 주어, Aliyun OSS의 인증 및 프로토콜 세부 사항에 맞게 동작할 수 있도록 합니다. Aliyun OSS에서 파일을 가져올 때는 이 매개변수를 반드시 `OSS`로 명시적으로 설정해야 합니다.

### Q4: S3 Load 작업이 멈추거나 시간 초과가 발생하면 어떻게 해야 하나요? {#q4-what-should-i-do-if-an-s3-load-task-hangs-or-times-out}

- `timeout` 값(초 단위)을 `PROPERTIES`에서 늘리세요.
- 네트워크 연결을 확인하고 가능한 한 내부망 Endpoint를 사용하세요.
- `SHOW LOAD`를 실행하여 작업 상태와 실패 원인을 확인하세요. 자세한 내용은 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참고하세요.

### Q5: TVF 가져오기는 CSV 이외의 형식도 지원하나요? {#q5-does-tvf-import-support-formats-other-than-csv}

네. `csv`, `parquet`, `orc` 등의 형식을 `format` 매개변수로 지정할 수 있습니다. CSV 이외의 형식에는 `column_separator`나 `csv_schema`를 지정할 필요가 없습니다.
