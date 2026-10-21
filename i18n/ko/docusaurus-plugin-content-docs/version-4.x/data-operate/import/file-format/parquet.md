---
{
    "title": "Parquet | 파일 형식",
    "language": "ko",
    "description": "Parquet 파일을 Apache Doris로 어떻게 가져올 수 있나요? Stream Load, Broker Load, S3/HDFS TVF를 모두 지원합니다. 이 문서에서는 전체 예제를 제공합니다.",
    "keywords": [
        "Doris Parquet 가져오기",
        "Parquet 파일 형식",
        "Stream Load Parquet",
        "Broker Load Parquet",
        "S3 TVF",
        "HDFS TVF",
        "컬럼형 스토리지 가져오기"
    ],
    "sidebar_label": "Parquet"
}
---

<!-- Knowledge type: Operating procedure / File format reference -->
<!-- Applicable scenarios: Data import / File format adaptation -->

이 문서는 Parquet 형식의 데이터 파일을 Apache Doris로 가져오는 방법을 설명하고, 각 가져오기 방식에 대해 바로 사용할 수 있는 예제를 제공합니다.

## 적용 시나리오 {#applicable-scenarios}

Parquet는 오프라인 데이터 웨어하우스와 객체 스토리지에 영구 저장되는 대량 데이터에 널리 사용되는 컬럼형 스토리지 형식입니다. 다음과 같은 시나리오에서 Parquet를 가져오기 원본으로 사용하기에 적합합니다.

- S3 또는 HDFS와 같은 객체 스토리지나 분산 파일 시스템에서 과거 데이터를 대량으로 가져오는 경우.
- 로컬이나 서버에서 생성한 Parquet 파일을 Stream Load로 전송하는 경우.
- 원격에 저장된 Parquet 파일을 Broker Load로 대량 적재하는 경우.
- 테이블 값 함수(TVF)를 사용하여 객체 스토리지나 HDFS의 Parquet 데이터를 필요에 따라 쿼리하고, 그 결과를 Doris에 다시 저장하는 경우.

## 지원되는 가져오기 방식 {#supported-import-methods}

다음 표는 Parquet 형식을 지원하는 가져오기 방식과 일반적인 용도를 정리한 것입니다.

| 가져오기 방식 | 적용 시나리오 | 문서 링크 |
| --- | --- | --- |
| Stream Load | 로컬 또는 서버 측 파일을 실시간이나 배치로 전송 | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | 원격 스토리지(HDFS, 객체 스토리지)에서 대량으로 가져오기 | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | S3의 Parquet 파일을 직접 쿼리하여 대상 테이블에 저장 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | HDFS의 Parquet 파일을 직접 쿼리하여 대상 테이블에 저장 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## 사용 예제 {#usage-examples}

이 절에서는 각 가져오기 방식에 대해 실행에 필요한 최소한의 예제를 제공합니다. 예제의 자리 표시자(예: `<user>`, `<fe_host>`, `bucket`)를 실제 환경의 값으로 바꾸세요.

### 1. Stream Load로 Parquet 가져오기 {#1-importing-parquet-with-stream-load}

HTTP 인터페이스를 통해 로컬 Parquet 파일을 Doris 테이블로 직접 전송하려면 요청 헤더에 `format: parquet`를 명시적으로 선언하세요.

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: parquet" \
    -T example.parquet \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

참고:

- `-H "format: parquet"`: 가져올 파일이 Parquet 형식임을 선언합니다.
- `-T example.parquet`: 업로드할 로컬 Parquet 파일을 지정합니다.
- URL의 `example_db`와 `example_table`은 각각 대상 데이터베이스와 대상 테이블입니다.

### 2. Broker Load로 Parquet 가져오기 {#2-importing-parquet-with-broker-load}

이 방식은 객체 스토리지나 HDFS의 Parquet 파일을 대량 적재하는 데 적합합니다. `FORMAT AS "parquet"`를 사용하여 파일 형식을 지정하세요.

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.parquet")
    INTO TABLE example_table
    FORMAT AS "parquet"
)
WITH S3 
(
    ...
);
```

참고:

- `DATA INFILE`: Parquet 파일의 원격 경로를 지정합니다. `s3://`, `hdfs://` 등의 프로토콜을 지원합니다.
- `FORMAT AS "parquet"`: 원본 파일이 Parquet 형식임을 선언합니다.
- `WITH S3 (...)`: 객체 스토리지에 액세스하는 데 필요한 자격 증명(예: `endpoint`, `access_key`, `secret_key`)을 제공합니다.

### 3. TVF로 Parquet 가져오기 {#3-importing-parquet-with-tvf}

테이블 값 함수(TVF)와 `INSERT INTO ... SELECT`를 함께 사용하면 원격 Parquet 파일을 직접 읽어 대상 테이블에 저장할 수 있습니다. 이 방식은 필요에 따라 데이터를 가져오거나 임시 분석 결과를 영구 저장하는 데 적합합니다.

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.parquet",
    "format" = "parquet",
    ...
);
```

참고:

- `S3(...)`: 테이블 값 함수입니다. 매개변수에는 `uri`와 `format`이 반드시 포함되어야 합니다. 필요에 따라 인증 정보 등의 다른 매개변수를 추가하세요.
- `S3`를 `HDFS`로 바꾸면 HDFS의 Parquet 파일을 읽을 수 있습니다.
- `SELECT *`를 컬럼 목록이나 필터 조건이 있는 쿼리로 바꾸면 필요한 데이터만 가져올 수 있습니다.

## 자주 묻는 질문 {#faq}

**Q1: Parquet를 가져올 때 파일 형식을 명시적으로 지정해야 하나요?**

네. Stream Load는 `format: parquet` 요청 헤더로, Broker Load는 `FORMAT AS "parquet"`로, TVF는 `"format" = "parquet"` 매개변수로 파일 형식을 지정합니다.

**Q2: HDFS에서 Parquet를 가져올 수 있나요?**

네. Broker Load(`hdfs://` 경로를 `DATA INFILE`에 지정) 또는 HDFS TVF를 사용할 수 있습니다.

**Q3: TVF를 통한 가져오기와 Broker Load는 어떻게 다른가요?**

Broker Load는 비동기 대량 가져오기 작업으로, 대규모 배치와 예약 작업에 적합합니다. TVF는 `INSERT INTO ... SELECT`를 통해 동기적으로 실행되며, 필요에 따라 데이터를 가져오거나 데이터 적재 전에 필터링, 집계 또는 기타 처리가 필요한 시나리오에 적합합니다.
