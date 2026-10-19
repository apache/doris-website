---
{
    "title": "HDFS에서 데이터 가져오기",
    "language": "ko",
    "description": "HDFS Load(비동기)와 TVF(동기)를 사용하여 HDFS 파일을 Apache Doris로 가져오는 방법을 전체 절차와 예제를 통해 설명합니다.",
    "sidebar_label": "HDFS",
    "keywords": [
        "Doris HDFS 데이터 가져오기",
        "HDFS Load",
        "HDFS TVF",
        "Broker Load",
        "Hadoop 데이터 가져오기",
        "비동기 가져오기",
        "동기 가져오기",
        "fs.defaultFS",
        "hadoop.username"
    ]
}
---

<!-- Knowledge type: Procedure / Data import -->
<!-- Applicable scenario: Importing data from HDFS to Doris -->

Apache Doris는 HDFS에서 파일을 가져오는 두 가지 방법을 제공하며, 각 방법은 서로 다른 비즈니스 시나리오에 적합합니다.

## 가져오기 방식 선택 {#choosing-an-approach}

시작하기 전에 데이터 양, 지연 시간 요구 사항, 비즈니스 시나리오에 따라 적절한 가져오기 방식을 선택하세요:

| 가져오기 방식 | 실행 방식 | 적용 시나리오 | 참고 자료 |
|----------|----------|----------|----------|
| **HDFS Load** | 비동기 | 가져오기가 완료될 때까지 현재 세션을 차단할 필요가 없는 대규모 배치 및 예약된 오프라인 작업 | [Broker Load 사용 설명서](../import-way/broker-load-manual.md) |
| **TVF (Table-Valued Function)** | 동기 | 소규모 배치 가져오기 및 임시 쿼리 시나리오. `INSERT INTO ... SELECT`와 유연하게 결합 가능 | 이 문서의 아래 예제 |

> 팁: 두 방식 모두 올바른 HDFS 연결 매개변수(`fs.defaultFS`, `hadoop.username` 등)가 필요합니다. Doris 클러스터가 네트워크를 통해 HDFS에 접근할 수 있는지 확인하세요.

---

## 방법 1: HDFS Load로 가져오기(비동기) {#method-1-importing-with-hdfs-load-asynchronous}

<!-- Knowledge type: Procedure -->

HDFS Load는 Broker Load를 기반으로 하는 비동기 가져오기 방식으로, 대량 데이터 적재에 적합합니다. 전체 기능은 [Broker Load 사용 설명서](../import-way/broker-load-manual.md)를 참고하세요.

### 1단계: HDFS 데이터 파일 준비 {#step-1-prepare-the-hdfs-data-file}

HDFS에 다음 내용을 담은 CSV 파일 `hdfsload_example.csv`를 생성하세요:

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
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: HDFS Load 작업 제출 {#step-3-submit-the-hdfs-load-job}

```sql
LOAD LABEL hdfs_load_2022_04_01
(
    DATA INFILE("hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv")
    INTO TABLE test_hdfsload
    COLUMNS TERMINATED BY ","
    FORMAT AS "CSV"
    (user_id, name, age)
)
with HDFS
(
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "user"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

주요 매개변수:

| 매개변수 | 설명 |
|------|------|
| `LABEL` | 가져오기 작업의 고유 식별자로, 작업 추적 및 중복 제거에 사용 |
| `DATA INFILE` | HDFS 파일 경로 |
| `COLUMNS TERMINATED BY` | 열 구분자. 원본 파일과 일치해야 함 |
| `FORMAT AS` | 파일 형식. 이 예제에서는 `CSV` 사용 |
| `fs.defaultFS` | HDFS NameNode 주소 |
| `hadoop.username` | HDFS에 접근할 때 사용할 사용자 이름 |
| `timeout` | 작업 제한 시간(초 단위) |

### 4단계: 가져오기 결과 확인 {#step-4-verify-the-import-result}

```sql
SELECT * FROM test_hdfsload;
```

예상 출력:

```text
mysql> select * from test_hdfsload;
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

---

## 방법 2: TVF로 가져오기(동기) {#method-2-importing-with-tvf-synchronous}

<!-- Knowledge type: Procedure -->

TVF (Table-Valued Function)는 동기 가져오기 방식으로, HDFS에서 데이터를 읽고 Doris에 쓰는 작업을 `INSERT INTO ... SELECT`로 유연하게 수행하는 데 적합합니다.

### 1단계: HDFS 데이터 파일 준비 {#step-1-prepare-the-hdfs-data-file-1}

HDFS에 다음 내용을 담은 CSV 파일 `hdfsload_example.csv`를 생성하세요:

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
CREATE TABLE test_hdfsload(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: TVF를 통해 동기 방식으로 데이터 가져오기 {#step-3-import-data-synchronously-via-tvf}

```sql
INSERT INTO test_hdfsload
SELECT * FROM hdfs (
    "uri" = "hdfs://127.0.0.1:8020/tmp/hdfsload_example.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8020",
    "hadoop.username" = "doris",
    "format" = "csv",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

주요 매개변수:

| 매개변수 | 설명 |
|------|------|
| `uri` | HDFS 파일의 전체 경로 |
| `fs.defaultFS` | HDFS NameNode 주소 |
| `hadoop.username` | HDFS에 접근할 때 사용할 사용자 이름 |
| `format` | 파일 형식. 예: `csv` |
| `csv_schema` | CSV 파일의 열 정의. `column_name:type;column_name:type` 형식으로 작성 |

### 4단계: 가져오기 결과 확인 {#step-4-verify-the-import-result-1}

```sql
SELECT * FROM test_hdfsload;
```

예상 출력:

```text
mysql> select * from test_hdfsload;
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

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Import failure troubleshooting / parameter selection -->

### Q1: HDFS Load와 TVF 중 어떤 것을 선택해야 하나요? {#q1-how-do-i-choose-between-hdfs-load-and-tvf}

- 데이터 양이 많고 비동기 실행이 가능하다면 **HDFS Load**를 선택하세요.
- 데이터 양이 적고 가져오기 결과가 즉시 필요하거나, `INSERT INTO ... SELECT`와 결합해 데이터를 변환하려면 **TVF**를 선택하세요.

### Q2: HDFS에 연결할 때 공통으로 필요한 매개변수는 무엇인가요? {#q2-what-are-the-common-required-parameters-for-connecting-to-hdfs}

- `fs.defaultFS`: HDFS NameNode 주소입니다. 필수입니다.
- `hadoop.username`: HDFS에 접근할 때 사용할 사용자 이름입니다. 필수입니다.
- Kerberos와 같은 인증을 사용하는 경우 해당 인증 설정을 추가하세요.

### Q3: TVF에서 `csv_schema`는 어떻게 작성하나요? {#q3-how-should-csv_schema-be-written-in-tvf}

형식은 `column_name:type;column_name:type`이며, 예를 들면 `user_id:int;name:string;age:int`와 같이 작성합니다. CSV 파일의 실제 열 순서 및 자료형과 일치해야 합니다.

### Q4: HDFS Load 작업의 제한 시간이 초과되면 어떻게 해야 하나요? {#q4-what-if-an-hdfs-load-job-times-out}

작업 제한 시간인 `timeout`(초 단위)을 `PROPERTIES`에서 조정하세요. 기본값은 3600입니다. 파일이 크면 필요에 따라 값을 늘리세요.

### Q5: 가져오기 결과의 순서가 원본 파일과 다른 이유는 무엇인가요? {#q5-why-does-the-import-result-not-match-the-order-of-the-source-file}

Doris는 분산 스토리지 엔진이며, `SELECT *`는 기본적으로 결과의 순서를 보장하지 않습니다. 정렬된 결과를 얻으려면 `ORDER BY`를 명시적으로 추가하세요.
