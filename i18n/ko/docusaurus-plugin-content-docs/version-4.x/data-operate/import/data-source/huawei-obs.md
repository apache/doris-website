---
{
    "title": "Huawei Cloud OBS",
    "language": "ko",
    "description": "비동기 데이터 적재에는 S3 Load를, 동기 데이터 적재에는 TVF를 사용하여 Huawei Cloud OBS의 CSV/Parquet 및 기타 파일을 Apache Doris에 효율적으로 적재하세요.",
    "keywords": [
        "Huawei Cloud OBS",
        "Huawei Cloud OBS",
        "Doris OBS 데이터 적재",
        "S3 Load OBS",
        "TVF S3",
        "객체 스토리지 데이터 적재",
        "OBS Endpoint",
        "obs.cn-north-1.myhuaweicloud.com"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import data files from Huawei Cloud OBS into Apache Doris -->

Apache Doris는 Huawei Cloud Object Storage Service (OBS)의 데이터 파일을 직접 적재할 수 있습니다. 이 기능은 오프라인 데이터 마이그레이션, 과거 데이터 백필, 데이터 레이크 파일을 데이터 웨어하우스로 적재하는 데 주로 사용됩니다. 이 문서에서는 CSV 파일을 예로 들어 두 가지 데이터 적재 방식의 전체 절차를 안내합니다.

## 데이터 적재 방식 선택 {#choosing-an-approach}

Doris는 Huawei Cloud OBS의 파일을 적재하는 두 가지 방식을 제공합니다. 데이터 크기와 처리 시점에 대한 요구 사항에 따라 선택하세요.

| 데이터 적재 방식 | 유형 | 적용 시나리오 | 참고 문서 |
|---------|------|---------|---------|
| **S3 Load** | 비동기 데이터 적재 | 대량 배치 데이터 적재. 작업이 백그라운드에서 실행되며 실패 시 재시도 지원 | [Broker Load 매뉴얼](../import-way/broker-load-manual.md) |
| **TVF (Table Value Function)** | 동기 데이터 적재 | 소규모 및 중간 규모 데이터, 임시 쿼리. `INSERT INTO ... SELECT`와 함께 사용 | 이 문서의 [TVF를 사용한 데이터 적재](#import-using-tvf) |

> 참고: 두 방식 모두 S3 프로토콜을 통해 OBS에 접근하며, OBS에서 제공하는 Endpoint, Region, Access Key, Secret Key가 필요합니다.

## 사전 준비 사항 {#prerequisites}

데이터 적재를 시작하기 전에 다음 사항을 준비하세요.

- 접근 가능한 Huawei Cloud OBS 버킷이 있고, 적재할 데이터 파일이 이미 업로드되어 있어야 합니다.
- OBS **Endpoint**(예: `obs.cn-north-1.myhuaweicloud.com`)와 해당 **Region**(예: `cn-north-1`)이 필요합니다.
- 버킷에 대한 읽기 권한이 있는 **Access Key (AK)**와 **Secret Key (SK)**가 필요합니다.
- Apache Doris 클러스터가 배포되어 있고, 현재 사용자에게 대상 데이터베이스와 테이블에 대한 `LOAD_PRIV` 권한이 있어야 합니다.

## S3 Load를 사용한 데이터 적재 {#import-using-s3-load}

S3 Load는 비동기 데이터 적재 방식입니다. 작업을 제출하면 Doris가 백그라운드에서 작업을 스케줄링하고 실행하므로 대용량 데이터에 적합합니다. 자세한 매개변수와 상태 조회 방법은 [Broker Load 매뉴얼](../import-way/broker-load-manual.md)을 참고하세요.

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

CSV 파일 `s3load_example.csv`를 Huawei Cloud OBS에 업로드하세요. 파일 내용은 다음과 같습니다.

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

파일 구조에 맞는 대상 테이블을 Doris에 생성하세요.

```sql
CREATE TABLE test_s3load(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: S3 Load로 데이터 적재 {#step-3-import-data-with-s3-load}

S3 Load 작업을 제출하여 OBS의 CSV 파일을 대상 테이블에 적재하세요.

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
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
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
| `DATA INFILE` | `s3://` 프로토콜 접두사를 사용하는 OBS 파일 경로 |
| `provider` | 객체 스토리지 유형이 Huawei Cloud임을 나타내도록 `OBS`로 고정해야 함 |
| `s3.endpoint` | OBS 서비스의 Endpoint. 버킷의 리전에 맞게 설정 |
| `s3.region` | OBS 버킷이 위치한 Region |
| `s3.access_key` / `s3.secret_key` | 인증에 사용하는 AK/SK |
| `timeout` | 작업 제한 시간(단위: 초) |

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data}

데이터 적재가 완료되면 대상 테이블을 쿼리하여 데이터가 올바르게 기록되었는지 확인하세요.

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

## TVF를 사용한 데이터 적재 {#import-using-tvf}

TVF (Table Value Function)는 OBS의 파일을 테이블 함수가 반환하는 가상 테이블로 제공하므로, `INSERT INTO ... SELECT`로 동기 데이터 적재를 직접 수행할 수 있습니다. 따라서 SQL 표현식과 결합하여 간단한 ETL을 수행하기에 편리합니다.

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

S3 Load에서 사용한 것과 동일한 CSV 파일 `s3load_example.csv`를 OBS에 업로드하세요.

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

### 3단계: TVF로 데이터 적재 {#step-3-import-data-with-tvf}

`S3` 테이블 함수로 OBS 파일을 읽고 `INSERT INTO ... SELECT`로 대상 테이블에 데이터를 적재하세요.

```sql
INSERT INTO test_s3load
SELECT * FROM S3
(
    "uri" = "s3://your_bucket_name/s3load_example.csv",
    "format" = "csv",
    "provider" = "OBS",
    "s3.endpoint" = "obs.cn-north-1.myhuaweicloud.com",
    "s3.region" = "cn-north-1",
    "s3.access_key" = "<your-ak>",
    "s3.secret_key" = "<your-sk>",
    "column_separator" = ",",
    "csv_schema" = "user_id:int;name:string;age:int"
);
```

주요 매개변수:

| 매개변수 | 설명 |
|------|------|
| `uri` | `s3://` 프로토콜 접두사를 사용하는 OBS 파일 URI |
| `format` | 파일 형식. CSV 파일에는 `csv` 사용 |
| `provider` | `OBS`로 고정해야 함 |
| `s3.endpoint` / `s3.region` | OBS의 Endpoint와 Region |
| `s3.access_key` / `s3.secret_key` | OBS 인증에 필요한 AK/SK |
| `column_separator` | 필드 구분자. CSV의 기본값은 `,` |
| `csv_schema` | CSV 열의 유형 정의. 형식은 `column_name:type;column_name:type;...` |

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data-1}

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

**Q1: S3 Load와 TVF 중 어떤 방식을 선택해야 하나요?**

- 데이터가 많고 비동기 실행과 실패 시 재시도가 필요하다면 **S3 Load**를 선택하세요.
- 데이터가 적고 즉시 결과를 확인해야 하거나, 데이터 적재 중 SQL 표현식으로 간단한 변환을 수행해야 한다면 **TVF**를 선택하세요.

**Q2: `provider` 매개변수를 반드시 `OBS`로 설정해야 하는 이유는 무엇인가요?**

`provider` 매개변수는 기반 객체 스토리지의 공급업체 유형을 식별합니다. Huawei Cloud OBS는 S3 프로토콜과 호환되지만 서명 등의 세부 사항에는 차이가 있습니다. Doris가 해당 접근 어댑터를 사용할 수 있도록 `OBS`로 명시해야 합니다.

**Q3: OBS의 Endpoint와 Region은 어디에서 확인하나요?**

Huawei Cloud OBS 콘솔의 버킷 개요 페이지에서 확인할 수 있습니다. 일반적인 Endpoint 형식은 `obs.<region>.myhuaweicloud.com`입니다. 예를 들어 `cn-north-1` 리전의 Endpoint는 `obs.cn-north-1.myhuaweicloud.com`입니다.

**Q4: CSV 외에 어떤 파일 형식을 지원하나요?**

S3 Load와 TVF 모두 `csv`, `parquet`, `orc`, `json` 등의 일반적인 형식을 지원합니다. 형식은 `FORMAT AS` 또는 `format` 매개변수로 지정하세요.

## 문제 해결 {#troubleshooting}

| 증상 | 가능한 원인 | 권장 조치 |
|------|---------|---------|
| `Access Denied` 또는 `403` 오류 | AK/SK가 올바르지 않거나 계정에 버킷 읽기 권한이 없음 | Huawei Cloud 콘솔에서 AK/SK를 확인하고 계정에 OBS 버킷 읽기 권한을 부여하세요 |
| `endpoint is invalid` 오류 | Endpoint에 오타가 있거나 리전과 일치하지 않음 | 버킷의 리전을 확인하고 해당 리전의 Endpoint를 사용하세요 |
| 데이터 적재 작업이 `PENDING` 상태로 유지됨 | 클러스터가 사용 중이거나 데이터 적재 동시 실행 수가 제한됨 | `SHOW LOAD`로 작업 상태를 확인하고, 필요하면 동시 실행 수를 조정하거나 리소스가 해제될 때까지 기다리세요 |
| TVF에서 열 개수 또는 유형 불일치 오류 발생 | `csv_schema`가 파일의 실제 열 구조와 일치하지 않음 | 파일의 열 순서, 열 개수, 데이터 유형을 확인하고 그에 맞게 `csv_schema`를 수정하세요 |
| 데이터 적재 시간 초과 | 파일이 커서 기본 `timeout`이 부족함 | `timeout` 값을 `PROPERTIES`에서 늘리세요(단위: 초) |

## 관련 문서 {#related-documents}

- [Broker Load 매뉴얼](../import-way/broker-load-manual.md)
