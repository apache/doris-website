---
{
    "title": "ORC | 파일 형식",
    "language": "ko",
    "description": "Stream Load, Broker Load 및 TVF를 사용하여 ORC 형식 데이터 파일을 Apache Doris에 적재하는 방법을 전체 예제와 함께 설명합니다.",
    "sidebar_label": "ORC",
    "keywords": [
        "Doris ORC 데이터 적재",
        "ORC 형식",
        "Stream Load ORC",
        "Broker Load ORC",
        "S3 TVF ORC",
        "HDFS TVF ORC",
        "Apache Doris 파일 형식"
    ]
}
---

<!-- Knowledge type: Operating procedure / Configuration parameters -->
<!-- Applicable scenario: Data import / File format selection -->

이 문서에서는 지원되는 데이터 적재 방식과 일반적인 사용 예제를 포함하여 ORC 형식 데이터 파일을 Apache Doris에 적재하는 방법을 설명합니다.

## 지원되는 데이터 적재 방식 {#supported-import-methods}

다음 표는 Doris에서 ORC 형식에 사용할 수 있는 데이터 적재 방식과 각 방식의 적용 시나리오를 보여 줍니다.

| 데이터 적재 방식 | 적용 시나리오 | 문서 링크 |
| --- | --- | --- |
| Stream Load | 로컬 컴퓨터 또는 클라이언트에서 HTTP를 통해 ORC 파일 전송 | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | 객체 스토리지 또는 HDFS에서 ORC 파일을 비동기로 일괄 적재 | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | 테이블 반환 함수를 통해 S3의 ORC 파일 읽기 | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | 테이블 반환 함수를 통해 HDFS의 ORC 파일 읽기 | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## 사용 예제 {#usage-examples}

이 절에서는 데이터 적재 방식별로 ORC 형식의 일반적인 사용 예제를 보여 줍니다. 모든 예제에서 `<user>`, `<fe_host>`, `bucket` 등의 자리 표시자를 환경에 맞는 실제 값으로 바꾸세요.

### Stream Load를 사용한 데이터 적재 {#stream-load-import}

이 방식은 HTTP를 통해 로컬 ORC 파일을 Doris로 전송할 때 사용합니다.

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: orc" \
    -T example.orc \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

주요 사항:

- 요청 헤더 `-H "format: orc"`를 통해 데이터 형식을 ORC로 지정합니다.
- `-T`를 사용하여 적재할 로컬 ORC 파일의 경로를 지정합니다.
- URL에 대상 데이터베이스와 대상 테이블을 지정해야 합니다.

### Broker Load를 사용한 데이터 적재 {#broker-load-import}

이 방식은 객체 스토리지(예: S3) 또는 HDFS에서 ORC 파일을 일괄 적재할 때 사용합니다.

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.orc")
    INTO TABLE example_table
    FORMAT AS "orc"
)
WITH S3 
(
    ...
);
```

주요 사항:

- `FORMAT AS "orc"`를 사용하여 데이터 파일 형식을 명시적으로 선언합니다.
- `DATA INFILE`에 ORC 파일의 저장 경로를 입력합니다.
- `WITH S3 (...)`에 객체 스토리지의 접근 자격 증명과 기타 연결 정보를 입력합니다.

### TVF를 사용한 데이터 적재 {#tvf-import}

이 방식은 테이블 반환 함수(TVF)를 통해 원격 ORC 파일을 직접 쿼리하고 결과를 테이블에 기록할 때 사용합니다.

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.orc",
    "format" = "orc",
    ...
);
```

주요 사항:

- TVF 매개변수에서 `"format" = "orc"`로 데이터 형식을 지정합니다.
- `"uri"`를 사용하여 객체 스토리지 또는 HDFS에 있는 ORC 파일의 경로를 지정합니다.
- 대상 테이블에 기록하기 전에 `SELECT` 절에 컬럼 프루닝, 필터링 또는 변환 로직을 추가할 수 있습니다.

## 자주 묻는 질문 {#faq}

**Q1: ORC 파일을 적재할 때 `format` 매개변수를 명시적으로 지정해야 하나요?**

예. Stream Load, Broker Load 또는 TVF 중 어떤 방식을 사용하든 `format`을 `orc`로 명시적으로 선언해야 합니다. 그렇지 않으면 데이터가 기본 형식(예: CSV)으로 파싱되어 데이터 적재가 실패합니다.

**Q2: ORC 파일을 적재할 때 Stream Load, Broker Load, TVF 중 어떤 방식을 선택해야 하나요?**

- 데이터양이 적은 로컬 또는 클라이언트 측 파일에는 Stream Load를 우선적으로 사용하세요.
- 원격 객체 스토리지 또는 HDFS에 있는 대규모 파일을 일괄 적재할 때는 Broker Load를 우선적으로 사용하세요.
- 데이터 적재 중에 컬럼 프루닝, 필터링 또는 변환을 수행해야 한다면 TVF(`INSERT INTO ... SELECT FROM S3/HDFS`)를 우선적으로 사용하세요.

**Q3: 예제의 `...`는 무엇을 의미하나요?**

예제의 `...`는 자리 표시자입니다. 환경에 필요한 연결 매개변수(예: S3의 `AK/SK`, `endpoint`, `region`) 또는 기타 선택적 매개변수로 바꾸세요. 전체 매개변수 목록은 각 데이터 적재 방식의 공식 문서를 참조하세요.
