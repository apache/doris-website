---
{
    "title": "Snowflake",
    "language": "ko",
    "description": "오브젝트 스토리지를 중간 매개체로 사용하여 Snowflake 데이터를 Doris로 마이그레이션합니다. COPY INTO로 S3에 내보낸 다음 S3 Load로 Doris에 데이터를 적재합니다.",
    "keywords": [
        "Snowflake에서 Doris로 마이그레이션",
        "Snowflake 데이터 적재",
        "COPY INTO 내보내기",
        "S3 Load",
        "Snowflake Doris 데이터 타입 매핑",
        "ETL_QUALITY_UNSATISFIED"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data migration / Snowflake to Doris sync -->

Snowflake 데이터를 Apache Doris로 마이그레이션할 때는 일반적으로 오브젝트 스토리지를 중간 매개체로 사용합니다. 전체 과정은 두 단계로 구성됩니다:

1. Snowflake의 [COPY INTO](https://docs.snowflake.cn/zh/guides-overview-unloading-data) 문을 사용하여 데이터를 오브젝트 스토리지(예: AWS S3, GCS 또는 Azure Blob)로 내보냅니다.
2. Doris의 S3 Load 기능을 사용하여 오브젝트 스토리지에서 데이터를 읽고 Doris에 적재합니다. 자세한 매개변수는 [S3 Load](./amazon-s3.md)를 참조하세요.

## 마이그레이션 사전 준비 {#pre-migration-preparation}

<!-- Knowledge type: Pre-deployment check -->

마이그레이션을 수행하기 전에 Snowflake 테이블 구조를 바탕으로 Doris에서 사용할 테이블 구조와 데이터 적재 전략을 계획합니다:

- 적절한 [데이터 모델](../../../table-design/data-model/intro.mdx)(Detail 모델 / Unique Key 모델 / Aggregate 모델)을 선택합니다.
- [파티셔닝](../../../table-design/data-partitioning/dynamic-partitioning.md) 및 [버킷팅](../../../table-design/data-partitioning/data-bucketing.md) 전략을 설계합니다.
- [데이터 적재 모범 사례](../load-best-practices/load-best-practices.md)를 참고하여 배치 크기와 동시성을 계획합니다.

## 데이터 타입 매핑 {#data-type-mapping}

<!-- Knowledge type: Configuration parameters -->

다음 표는 Snowflake와 Doris 간의 데이터 타입 매핑을 보여 줍니다. 이를 참고하여 Doris에 대응하는 테이블 구조를 생성할 수 있습니다:

| Snowflake                                        | Doris          | 설명                                                |
| ------------------------------------------------ | -------------- | --------------------------------------------------- |
| NUMBER(p, s) / DECIMAL(p, s) / NUMERIC(p, s)     | DECIMAL(p, s)  |                                                     |
| INT / INTEGER                                    | INT            |                                                     |
| TINYINT / BYTEINT                                | TINYINT        |                                                     |
| SMALLINT                                         | SMALLINT       |                                                     |
| BIGINT                                           | BIGINT         |                                                     |
| FLOAT / FLOAT4 / FLOAT8 / DOUBLE / DOUBLE PRECISION / REAL | DOUBLE         |                                                     |
| VARCHAR / STRING / TEXT                          | VARCHAR / STRING | VARCHAR의 최대 길이는 65535입니다                    |
| CHAR / CHARACTER / NCHAR                         | CHAR           |                                                     |
| BINARY / VARBINARY                               | STRING         |                                                     |
| BOOLEAN                                          | BOOLEAN        |                                                     |
| DATE                                             | DATE           |                                                     |
| DATETIME / TIMESTAMP / TIMESTAMP_NTZ             | DATETIME       | TIMESTAMP는 사용자가 설정할 수 있는 별칭이며, 기본값은 TIMESTAMP_NTZ입니다 |
| TIME                                             | STRING         | Snowflake에서 내보낼 때 String 타입으로 변환해야 합니다 |
| VARIANT                                          | VARIANT        |                                                     |
| ARRAY                                            | ARRAY\<T\>     |                                                     |
| OBJECT                                           | JSON           |                                                     |
| GEOGRAPHY / GEOMETRY                             | STRING         |                                                     |

## 마이그레이션 절차 {#migration-process}

전체 마이그레이션은 **Doris에서 대상 테이블 생성 -> Snowflake에서 오브젝트 스토리지로 데이터 내보내기 -> S3 Load로 Doris에 데이터 적재**의 세 단계로 구성됩니다.

### 1단계: Doris에서 대상 테이블 생성 {#step-1-create-the-target-table-in-doris}

<!-- Knowledge type: Procedure -->

Snowflake에 다음 테이블과 데이터가 이미 있다고 가정합니다:

```sql
CREATE OR REPLACE TABLE sales_data (
    order_id      INT PRIMARY KEY,
    customer_name VARCHAR(128),
    order_date    DATE,
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
)
CLUSTER BY (order_date);

INSERT INTO sales_data VALUES
(1, 'Alice',   '2025-04-08',  99.99, 'USA'),
(2, 'Bob',     '2025-04-08', 149.50, 'Canada'),
(3, 'Charlie', '2025-04-09',  75.00, 'UK'),
(4, 'Diana',   '2025-04-10', 200.00, 'Australia');
```

이 테이블 구조를 기반으로 Doris에 Unique Key 파티션 테이블을 생성합니다. 파티션 컬럼은 Snowflake의 클러스터링 키와 일치하도록 설정하고, 일 단위 동적 파티셔닝을 활성화합니다:

```sql
CREATE TABLE `sales_data` (
    order_id      INT,
    order_date    DATE NOT NULL,
    customer_name VARCHAR(128),
    amount        DECIMAL(10,2),
    country       VARCHAR(48)
) ENGINE=OLAP
UNIQUE KEY(`order_id`, `order_date`)
PARTITION BY RANGE(`order_date`) (
    PARTITION p20250408 VALUES [('2025-04-08'), ('2025-04-09')),
    PARTITION p20250409 VALUES [('2025-04-09'), ('2025-04-10')),
    PARTITION p20250410 VALUES [('2025-04-10'), ('2025-04-11'))
)
DISTRIBUTED BY HASH(`order_id`) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.end" = "5",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "16",
    "replication_num" = "1"
);
```

### 2단계: Snowflake에서 오브젝트 스토리지로 데이터 내보내기 {#step-2-export-data-from-snowflake-to-object-storage}

<!-- Knowledge type: Procedure -->

Snowflake는 여러 오브젝트 스토리지 서비스로 데이터를 내보내는 기능을 지원합니다:

- [AWS S3](https://docs.snowflake.com/en/user-guide/data-unload-s3)
- [Google Cloud Storage](https://docs.snowflake.com/en/user-guide/data-unload-gcs)
- [Azure Blob Storage](https://docs.snowflake.com/en/user-guide/data-unload-azure)

**Doris의 파티션 컬럼을 기준으로 데이터를 분할하여 내보내는 것을 권장합니다**. 이렇게 하면 이후에 파티션별로 데이터를 나누어 적재할 수 있습니다.

#### 2.1 COPY INTO를 사용하여 Parquet 파일로 내보내기 {#21-export-to-parquet-files-with-copy-into}

다음 예시는 Snowflake 데이터를 `order_date`를 기준으로 분할하여 AWS S3에 Parquet 형식으로 내보냅니다:

```sql
CREATE FILE FORMAT my_parquet_format TYPE = parquet;

CREATE OR REPLACE STAGE external_stage
URL='s3://mybucket/sales_data'
CREDENTIALS=(AWS_KEY_ID='<ak>' AWS_SECRET_KEY='<sk>')
FILE_FORMAT = my_parquet_format;

COPY INTO @external_stage FROM sales_data
PARTITION BY (CAST(order_date AS VARCHAR))
HEADER=TRUE;
```

#### 2.2 S3에서 내보낸 파일 확인 {#22-view-the-exported-files-on-s3}

내보내기가 완료되면 S3에 각 파티션에 해당하는 하위 디렉터리가 하나씩 생성됩니다:

![snowflake_s3_out](/images/data-operate/snowflake_s3_out_en.png)

![snowflake_s3_out2](/images/data-operate/snowflake_s3_out2_en.png)

### 3단계: S3 Load로 Doris에 데이터 적재 {#step-3-import-into-doris-with-s3-load}

<!-- Knowledge type: Procedure -->

S3 Load는 **비동기 데이터 적재 방식**입니다. 실행 후 Doris가 데이터 소스에서 직접 데이터를 가져옵니다. [AWS S3](./amazon-s3.md), [GCS](./google-cloud-storage.md), [Azure](./azure-storage.md) 등 S3 프로토콜과 호환되는 오브젝트 스토리지를 지원합니다.

S3 Load는 **대용량 데이터를 백그라운드에서 비동기로 처리해야 하는 경우**에 적합합니다. 소량의 데이터를 동기 방식으로 처리하려면 [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous)를 사용할 수 있습니다.

:::caution 참고
**복합 타입(Struct / Array / Map)이 포함된 Parquet / ORC 파일**은 현재 TVF Load를 사용해야 합니다.
:::

#### 3.1 단일 파티션의 데이터 적재 {#31-import-data-from-a-single-partition}

다음 예시는 S3의 `2025_04_08` 파티션 디렉터리에 있는 모든 Parquet 파일을 Doris의 `sales_data` 테이블에 적재합니다:

```sql
LOAD LABEL sales_data_2025_04_08
(
    DATA INFILE("s3://mybucket/sales_data/2025_04_08/*")
    INTO TABLE sales_data
    FORMAT AS "parquet"
    (order_id, order_date, customer_name, amount, country)
)
WITH S3
(
    "provider" = "S3",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.access_key" = "<ak>",
    "s3.secret_key" = "<sk>",
    "s3.region" = "ap-southeast-1"
);
```

#### 3.2 SHOW LOAD로 작업 상태 확인 {#32-check-job-status-with-show-load}

S3 Load는 비동기로 제출되므로 `SHOW LOAD`로 특정 Label의 데이터 적재 상태를 쿼리해야 합니다:

```yaml
mysql> show load where label = "sales_data_2025_04_08"\G
*************************** 1. row ***************************
        JobId: 17956078
        Label: sales_data_2025_04_08
        State: FINISHED
     Progress: 100.00% (1/1)
         Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=0; dpp.norm.ALL=2
     TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):3600; max_filter_ratio:0.0; priority:NORMAL
     ErrorMsg: NULL
   CreateTime: 2025-04-10 17:50:53
 EtlStartTime: 2025-04-10 17:50:54
EtlFinishTime: 2025-04-10 17:50:54
LoadStartTime: 2025-04-10 17:50:54
LoadFinishTime: 2025-04-10 17:50:54
          URL: NULL
   JobDetails: {"Unfinished backends":{"5eec1be8612d4872-91040ff1e7208a4f":[]},"ScannedRows":2,"TaskNumber":1,"LoadBytes":91,"All   backends":{"5eec1be8612d4872-91040ff1e7208a4f":[10022]},"FileNumber":1,"FileSize":1620}
TransactionId: 766228
 ErrorTablets: {}
         User: root
      Comment:
1 row in set (0.00 sec)
```

#### 3.3 데이터 적재 중 오류 처리 {#33-handle-errors-during-import}

데이터 적재 작업이 여러 개 있을 때는 다음 구문으로 실패한 작업과 실패 원인을 일괄 쿼리할 수 있습니다:

```sql
mysql> show load where state='CANCELLED' and label like "label_test%"\G
*************************** 1. row ***************************
        JobId: 18312384
        Label: label_test123
        State: CANCELLED
     Progress: 100.00% (3/3)
         Type: BROKER
      EtlInfo: unselected.rows=0; dpp.abnorm.ALL=4; dpp.norm.ALL=0
     TaskInfo: cluster:s3.ap-southeast-1.amazonaws.com; timeout(s):14400; max_filter_ratio:0.0; priority:NORMAL
     ErrorMsg: type:ETL_QUALITY_UNSATISFIED; msg:quality not good enough to cancel
   CreateTime: 2025-04-15 17:32:59
 EtlStartTime: 2025-04-15 17:33:02
EtlFinishTime: 2025-04-15 17:33:02
LoadStartTime: 2025-04-15 17:33:02
LoadFinishTime: 2025-04-15 17:33:02
          URL: http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342
   JobDetails: {"Unfinished backends":{"7602ccd7c3a4854-95307efca7bfe341":[]},"ScannedRows":4,"TaskNumber":1,"LoadBytes":188,"All   backends":{"7602ccd7c3a4854-95307efca7bfe341":[10022]},"FileNumber":3,"FileSize":4839}
TransactionId: 769213
 ErrorTablets: {}
         User: root
      Comment:
```

위 예시는 **데이터 품질 오류** (`ETL_QUALITY_UNSATISFIED`)입니다. 구체적인 오류 내용을 확인하려면 `URL` 필드에 반환된 링크에 접속해야 합니다. 예를 들어 다음 오류는 데이터의 `country` 컬럼 값의 실제 길이가 테이블 스키마에 정의된 길이를 초과했음을 보여 줍니다:

```python
[root@VM-10-6-centos ~]$ curl "http://10.16.10.6:28747/api/_load_error_log?file=__shard_2   error_log_insert_stmt_7602ccd7c3a4854-95307efca7bfe342_7602ccd7c3a4854_95307efca7bfe342"
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [USA] schema length: 1; actual   length: 3; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Canada] schema length: 1; actual   length: 6; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [UK] schema length: 1; actual   length: 2; . src line [];
Reason: column_name[country], the length of input is too long than schema. first 32 bytes of input str: [Australia] schema length: 1;   actual length: 9; . src line [];
```

데이터 품질 오류가 발생했을 때 일부 오류 데이터를 건너뛰어도 된다면, S3 Load 작업의 `PROPERTIES`에서 오류 허용 비율을 설정할 수 있습니다. 자세한 내용은 [데이터 적재 설정 매개변수](../../import/import-way/broker-load-manual.md#import-configuration-parameters)를 참조하세요.

#### 3.4 여러 파티션의 일괄 데이터 적재 {#34-batch-import-multiple-partitions}

<!-- Applicable scenario: Large-scale stock data migration -->

대규모 기존 데이터를 마이그레이션할 때는 **배치 단위 데이터 적재 전략**을 권장합니다:

- 각 배치는 Doris의 파티션 하나 또는 소수의 파티션에 해당합니다.
- 배치당 권장 크기는 **100 GB 이하**입니다.
- 이렇게 하면 시스템 부하를 줄이고 데이터 적재 실패 후 재시도 비용을 낮출 수 있습니다.

[s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) 스크립트를 참고할 수 있습니다. 이 스크립트는 S3의 파티션 디렉터리를 폴링하고 Doris에 S3 Load 작업을 자동으로 제출하여 배치 단위로 데이터를 적재합니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ / Troubleshooting -->

### Q1: 데이터 적재 작업에서 `ETL_QUALITY_UNSATISFIED` 오류가 발생합니다. 어떻게 문제를 진단하나요? {#q1-an-import-job-reports-an-etl_quality_unsatisfied-error-how-can-i-troubleshoot-it}

이 오류는 데이터 품질 오류입니다. 일반적인 원인으로는 스키마 정의를 초과하는 필드 길이, 타입 불일치, 필수 필드가 null인 경우 등이 있습니다. 문제 해결 단계는 다음과 같습니다:

1. 작업의 `URL` 필드를 `SHOW LOAD`로 확인합니다.
2. `curl`로 URL에 접속하여 상세 오류 로그를 가져옵니다.
3. 오류 메시지에 따라 원본 데이터를 수정하거나 Doris 테이블 스키마를 조정합니다.
4. 소량의 불량 데이터를 허용할 수 있다면 `max_filter_ratio` 오류 허용 비율을 작업의 `PROPERTIES`에 설정합니다.

### Q2: 복합 타입이 포함된 Parquet 파일은 어떻게 적재하나요? {#q2-how-do-i-import-parquet-files-containing-complex-types}

Struct / Array / Map 등의 복합 타입이 포함된 Parquet / ORC 파일은 **현재 S3 Load에서 지원하지 않습니다**. [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous)를 사용해야 합니다.

### Q3: Snowflake의 TIME 타입을 String으로 변환해야 하는 이유는 무엇인가요? {#q3-why-does-the-snowflake-time-type-need-to-be-converted-to-string}

Doris에는 Snowflake의 `TIME`에 완전히 대응하는 타입이 없습니다. 따라서 Snowflake에서 `COPY INTO`로 내보낼 때는 `CAST`를 사용하여 `TIME` 필드를 `STRING` 타입으로 변환해야 합니다. Doris에 적재된 후에는 `STRING`으로 저장됩니다.

### Q4: 대용량 테이블의 마이그레이션 속도를 높이려면 어떻게 해야 하나요? {#q4-how-can-i-speed-up-the-migration-of-large-tables}

- Snowflake에서는 병렬 데이터 적재가 가능하도록 Doris의 파티션 컬럼을 기준으로 데이터를 분할하여 내보냅니다.
- Doris에서는 배치 단위로 데이터를 적재하고, 각 배치의 크기를 100 GB 이하로 유지합니다.
- [s3_load_demo.sh](https://github.com/apache/doris/blob/master/samples/load/shell/s3_load_demo.sh) 스크립트를 사용하여 여러 S3 Load 작업을 동시에 제출합니다.

### Q5: Snowflake의 OBJECT 및 VARIANT 타입은 어떻게 매핑되나요? {#q5-how-do-snowflakes-object-and-variant-types-map}

- `VARIANT`는 Doris의 `VARIANT` 타입에 직접 매핑됩니다.
- `OBJECT`는 Doris의 `JSON` 타입에 매핑됩니다.

## 관련 문서 {#related-documents}

- [S3 Load](./amazon-s3.md)
- [GCS Load](./google-cloud-storage.md)
- [Azure Load](./azure-storage.md)
- [TVF Load](./amazon-s3.md#method-2-load-with-tvf-synchronous)
- [데이터 적재 모범 사례](../load-best-practices/load-best-practices.md)
- [데이터 적재 설정 매개변수](../../import/import-way/broker-load-manual.md#import-configuration-parameters)
