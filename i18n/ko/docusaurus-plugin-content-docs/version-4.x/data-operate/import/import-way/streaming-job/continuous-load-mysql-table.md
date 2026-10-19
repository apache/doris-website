---
{
    "title": "SQL Mapping을 사용한 MySQL CDC",
    "language": "ko",
    "sidebar_label": "SQL Mapping 동기화",
    "description": "SQL Mapping(Job + CDC Stream TVF)을 사용하여 단일 MySQL 테이블을 Doris에 지속적으로 동기화하는 방법을 설명합니다. 컬럼 매핑과 데이터 변환을 지원합니다.",
    "keywords": [
        "MySQL에서 Doris로 동기화",
        "SQL Mapping 동기화",
        "CDC Stream TVF",
        "Streaming Job",
        "Binlog 증분 동기화",
        "exactly-once",
        "Flink CDC",
        "INSERT INTO SELECT"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenario: Real-time sync of a single MySQL table to Doris with column mapping or data transformation -->

SQL Mapping 동기화는 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)를 통해 구현되며, **기존** Doris 테이블을 대상으로 합니다(`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). Doris SQL의 풍부한 표현 기능을 활용해 동기화 파이프라인에서 컬럼 매핑, 필터링 및 데이터 변환을 수행할 수 있으며, exactly-once 처리를 보장합니다. 데이터 처리가 필요한 실시간 동기화 시나리오에 적합합니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 MySQL의 변경 로그(Binlog)를 읽고 소스 테이블에서 대상 테이블로 **전체 + 증분** 동기화를 수행합니다. Doris가 다운스트림 테이블을 자동으로 생성하고 데이터베이스 단위로 테이블 그룹을 동기화하도록 하려면 [자동 테이블 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)를 참조하세요.

### 적용 시나리오 {#applicable-scenarios}

- 대상 테이블 스키마가 이미 설계된 상태에서 단일 MySQL 테이블을 Doris로 지속적으로 동기화하는 경우
- 동기화 중 불필요한 컬럼 제외, 컬럼 매핑, 필드 이름 변경 또는 데이터 변환이 필요한 경우
- 종단 간 exactly-once 처리를 보장해야 하는 실시간 데이터 통합

### 사전 요구 사항 {#prerequisites}

| 항목 | 설명 |
| ------ | ---- |
| Doris 버전 | 4.1.0 이상 |
| 테이블 유형 | 현재 대상 테이블로 **기본 키 테이블**만 지원됩니다 |
| 사용자 권한 | `Load` 권한이 필요합니다 |
| MySQL 구성 | MySQL에서 Binlog를 활성화해야 합니다. [구성 가이드](./continuous-load-overview.md)를 참조하세요 |
| 처리 보장 | exactly-once 처리를 지원합니다 |

## 빠른 시작 {#quick-start}

다음은 실행 가능한 최소 예제로, 작업을 생성한 다음 상태를 확인하는 전체 흐름을 보여 줍니다.

### 1단계: 데이터 적재 작업 생성 {#step-1-create-the-import-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)을 사용하여 연속 데이터 적재 작업을 생성합니다.

```sql
CREATE JOB mysql_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM cdc_stream(
    "type" = "mysql",
    "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
    "driver_url" = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root",
    "password" = "123456",
    "database" = "source_db",
    "table" = "source_table",
    "offset" = "initial"
)
```

### 2단계: 데이터 적재 상태 확인 {#step-2-check-the-import-status}

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

### 3단계: 작업 관리 {#step-3-job-operations}

일시 중지, 재개, 삭제, 태스크 조회 등의 일반적인 작업 관리 방법은 [연속 데이터 적재 개요](./continuous-load-overview.md)를 참조하세요.

## 매개변수 참조 {#parameter-reference}

### 데이터 소스 매개변수 {#data-source-parameters}

CDC Stream TVF에서 지원하는 MySQL 데이터 소스 매개변수는 다음과 같습니다.

| 매개변수             | 기본값 | 설명                                                                                                                                     |
| --------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| type                  | -       | 데이터 소스 유형입니다. `mysql`로 설정합니다                                                                                                                |
| jdbc_url              | -       | MySQL JDBC 연결 문자열                                                                                                                    |
| driver_url            | -       | JDBC 드라이버 jar 파일의 경로입니다. 파일 이름, 로컬 절대 경로 및 HTTP URL을 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요 |
| driver_class          | -       | JDBC 드라이버 클래스 이름                                                                                                                          |
| user                  | -       | 데이터베이스 사용자 이름                                                                                                                               |
| password              | -       | 데이터베이스 비밀번호                                                                                                                               |
| database              | -       | 데이터베이스 이름                                                                                                                                   |
| table                 | -       | 동기화할 테이블 이름                                                                                                                       |
| offset                | latest  | `latest`: 증분 동기화만 수행, `initial`: 전체 + 증분 동기화 수행                                                                             |
| snapshot_split_size   | 40960 (4.1.4 이전에는 8096)    | 분할 크기(행 수)입니다. 전체 동기화 중 테이블을 여러 분할로 나누어 동기화합니다                                              |
| snapshot_parallelism  | 1       | 전체 동기화 단계의 병렬 처리 수준으로, Task별로 스케줄링되는 최대 분할 수를 의미합니다                                                |

### 데이터 적재 구성 매개변수 {#import-configuration-parameters}

| 매개변수 | 기본값 | 설명                                                                                                                                                                  |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | 없음    | 모든 세션 변수는 `job_properties`에서 구성할 수 있습니다. 데이터 적재 변수는 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)를 참조하세요 |

그 밖의 일반적인 매개변수(예: `max_interval`)는 [연속 데이터 적재 개요](./continuous-load-overview.md#common-parameters)를 참조하세요.

## 자주 묻는 질문 {#faq}

**Q1: SQL Mapping 동기화와 자동 테이블 생성 동기화의 차이점은 무엇인가요?**

- SQL Mapping 동기화: 대상 Doris 테이블을 **미리 생성**해야 합니다. 컬럼 매핑과 데이터 변환을 지원하므로 세밀한 처리가 필요한 시나리오에 적합합니다.
- 자동 테이블 생성 동기화: Doris가 다운스트림 테이블을 **자동으로 생성**하고 데이터베이스 단위로 전체 테이블을 동기화합니다. 자세한 내용은 [자동 테이블 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)를 참조하세요.

**Q2: 기본 키가 없는 테이블도 대상 테이블로 지원되나요?**

현재 대상 테이블로 **기본 키 테이블만** 지원됩니다.

**Q3: 과거 전체 데이터를 제외하고 증분 데이터만 동기화하려면 어떻게 해야 하나요?**

`offset` 매개변수를 `latest`로 설정하세요. 작업이 전체 동기화 단계를 건너뛰고 Binlog 증분 데이터만 동기화합니다.

**Q4: 전체 동기화가 너무 느릴 때는 어떻게 최적화하나요?**

다음 두 매개변수를 조정하여 전체 동기화 단계의 처리량을 높일 수 있습니다.

- `snapshot_split_size`: 분할당 행 수를 늘립니다.
- `snapshot_parallelism`: Task별로 스케줄링되는 분할의 병렬 처리 수준을 높입니다.

## 관련 문서 {#related-documents}

- [연속 데이터 적재 개요](./continuous-load-overview.md)
- [자동 테이블 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
