---
{
    "title": "Google Cloud Storage(GCS)에서 데이터 가져오기",
    "language": "ko",
    "description": "Google Cloud Storage의 데이터를 Apache Doris로 가져오는 방법: S3 Load를 통한 비동기 가져오기 또는 S3 TVF를 통한 동기 가져오기.",
    "keywords": [
        "Google Cloud Storage 데이터 가져오기",
        "GCS에서 Doris로 데이터 가져오기",
        "S3 Load GCP",
        "S3 TVF GCS",
        "Doris 객체 스토리지 데이터 가져오기",
        "GCP 공급자"
    ],
    "sidebar_label": "Google Cloud Storage"
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Importing data from Google Cloud Storage into Apache Doris -->

Apache Doris는 S3 호환 프로토콜로 GCS 버킷에 액세스하여 Google Cloud Storage(GCS)에서 파일을 가져올 수 있습니다. 이 문서에서는 두 가지 가져오기 방식과 각 방식의 전체 작업 절차를 설명합니다.

## 가져오기 방식 선택 {#choosing-an-approach}

Doris는 Google Cloud Storage에서 파일을 가져오는 두 가지 방식을 제공합니다. 데이터 양과 처리 시점에 대한 요구 사항에 따라 선택하세요.

| 가져오기 방식 | 실행 모드 | 적합한 사용 사례 | 참고 자료 |
|---------|---------|---------|---------|
| S3 Load | 비동기 | 대량의 배치 데이터 가져오기, 장시간 실행되는 작업 | [Broker Load 매뉴얼](../import-way/broker-load-manual.md) |
| S3 TVF(테이블 함수) | 동기 | 소량의 배치 데이터 가져오기, 임시 쿼리, 빠른 검증 | 이 문서 |

권장 사항:

- 데이터 양이 많거나 작업을 백그라운드에서 실행해야 한다면 **S3 Load**를 사용하세요.
- 결과가 즉시 필요하거나 `INSERT INTO ... SELECT`와 함께 사용하려면 **S3 TVF**를 사용하세요.

## 사전 준비 사항 {#prerequisites}

데이터를 가져오기 전에 다음 정보를 준비하세요.

- Google Cloud Storage 버킷 이름(`your_bucket_name`).
- 액세스 자격 증명: Access Key 및 Secret Key.
- GCS Endpoint 및 Region(예: `storage.us-west2.rep.googleapis.com` 및 `US-WEST2`).
- 배포가 완료되어 액세스할 수 있는 Apache Doris 클러스터.

## 방법 1: S3 Load로 데이터 가져오기(비동기) {#method-1-import-with-s3-load-asynchronous}

S3 Load는 대량의 데이터를 비동기 방식으로 가져오는 데 적합합니다. 자세한 매개변수와 고급 사용법은 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참고하세요.

### 단계 1: 데이터 준비 {#step-1-prepare-the-data}

CSV 파일 `s3load_example.csv`를 생성하고 Google Cloud Storage에 업로드합니다. 파일 내용은 다음과 같습니다.

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

### 단계 2: Doris에서 테이블 생성 {#step-2-create-a-table-in-doris}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 단계 3: S3 Load로 데이터 가져오기 {#step-3-import-the-data-with-s3-load}

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
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
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
|------|------|
| `provider` | 객체 스토리지 공급자. GCS에서는 `GCP`로 고정 |
| `s3.endpoint` | GCS의 S3 호환 액세스 엔드포인트 |
| `s3.region` | GCS 버킷이 위치한 리전 |
| `s3.access_key` | GCS 액세스 키 ID |
| `s3.secret_key` | GCS 보안 액세스 키 |
| `timeout` | 데이터 가져오기 제한 시간(초) |

### 단계 4: 가져온 데이터 확인 {#step-4-verify-the-imported-data}

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

## 방법 2: TVF로 데이터 가져오기(동기) {#method-2-import-with-tvf-synchronous}

S3 테이블 함수(TVF)는 동기 방식의 데이터 가져오기와 임시 쿼리에 적합하며, `INSERT INTO ... SELECT`와 직접 함께 사용할 수 있습니다.

### 단계 1: 데이터 준비 {#step-1-prepare-the-data-1}

CSV 파일 `s3load_example.csv`를 생성하고 Google Cloud Storage에 업로드합니다. 파일 내용은 다음과 같습니다.

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

### 단계 2: Doris에서 테이블 생성 {#step-2-create-a-table-in-doris-1}

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 단계 3: TVF로 데이터 가져오기 {#step-3-import-the-data-with-tvf}

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "GCP",
    "s3.endpoint" = "storage.us-west2.rep.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

주요 매개변수:

| 매개변수 | 설명 |
|------|------|
| `uri` | 객체 스토리지에 있는 파일의 S3 URI |
| `format` | 파일 형식. 예: `csv`, `parquet`, `orc` |
| `provider` | 객체 스토리지 공급자. GCS에서는 `GCP`로 고정 |
| `s3.endpoint` | GCS의 S3 호환 액세스 엔드포인트 |
| `s3.region` | GCS 버킷이 위치한 리전 |
| `s3.access_key` | GCS 액세스 키 ID |
| `s3.secret_key` | GCS 보안 액세스 키 |
| `column_separator` | 열 구분자 |
| `csv_schema` | CSV 열 정의. 형식: `column_name:type;column_name:type` |

### 단계 4: 가져온 데이터 확인 {#step-4-verify-the-imported-data-1}

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

<!-- Knowledge type: Troubleshooting -->

**Q1: `provider` 매개변수는 어떤 값으로 설정해야 하나요?**

Google Cloud Storage에서 데이터를 가져올 때는 `provider`를 `GCP`로 설정해야 Doris가 S3 호환 프로토콜을 통해 GCS에 액세스합니다.

**Q2: S3 Load와 S3 TVF 중 어떤 것을 선택해야 하나요?**

- 대량의 데이터를 백그라운드에서 비동기 방식으로 처리해야 한다면 **S3 Load**를 선택하세요.
- 소량의 데이터를 처리하면서 즉시 결과를 확인해야 하거나 SQL 쿼리와 함께 사용해야 한다면 **S3 TVF**를 선택하세요.

**Q3: GCS의 Access Key와 Secret Key는 어떻게 발급받나요?**

Google Cloud Console의 **Cloud Storage > 설정 > 상호 운용성** 페이지에서 S3 호환 액세스에 사용할 HMAC 키(Access Key / Secret Key)를 생성하고 관리할 수 있습니다.

**Q4: Endpoint와 Region은 어떻게 확인하나요?**

Endpoint와 Region은 버킷이 위치한 리전에 따라 달라집니다. 예를 들어 `US-WEST2` 리전에 해당하는 엔드포인트는 `storage.us-west2.rep.googleapis.com`입니다. 버킷의 실제 위치에 맞게 이 값을 바꾸세요.

**Q5: 시간 초과로 데이터 가져오기에 실패하면 어떻게 해야 하나요?**

`timeout` 매개변수를 `PROPERTIES`에서 늘리세요(단위: 초). 기본값은 `3600`입니다. 파일이 매우 크거나 네트워크가 느리면 필요에 따라 제한 시간을 늘리세요.
