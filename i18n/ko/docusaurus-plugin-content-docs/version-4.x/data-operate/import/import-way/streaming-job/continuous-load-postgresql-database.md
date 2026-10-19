---
{
    "title": "자동 테이블 생성을 지원하는 PostgreSQL CDC",
    "language": "ko",
    "sidebar_label": "자동 테이블 생성 동기화",
    "description": "Streaming Job을 사용하여 PostgreSQL 데이터베이스 전체의 전체 및 증분 데이터를 Doris로 지속적으로 동기화하고, 첫 동기화 시 테이블을 자동으로 생성합니다.",
    "keywords": [
        "PostgreSQL 동기화",
        "PostgreSQL CDC",
        "자동 테이블 생성 동기화",
        "전체 데이터베이스 동기화",
        "Streaming Job",
        "Flink CDC",
        "Doris 데이터 적재",
        "PostgreSQL에서 Doris로 동기화",
        "전체 및 증분 동기화",
        "자동 테이블 생성"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Continuously sync an entire PostgreSQL database to Doris -->

자동 테이블 생성 동기화는 네이티브 `FROM POSTGRES (...) TO DATABASE (...)` DDL로 구현됩니다. **대상은 Doris 데이터베이스 컨테이너이며, Doris가 다운스트림 테이블을 자동으로 생성합니다.** `include_tables`를 사용하여 테이블 하나, 여러 개 또는 전체를 동기화하도록 지정할 수 있습니다. 첫 동기화 시 Doris는 다운스트림 기본 키 테이블을 자동으로 생성하고, 기본 키를 업스트림과 일치하도록 유지합니다. 이 방식은 데이터에 SQL 처리가 필요 없고 다운스트림 테이블 스키마가 업스트림을 자동으로 따라야 하는 미러 복제 시나리오에 적합합니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc) 기능을 통합하여 PostgreSQL에서 변경 로그를 읽고, 여러 테이블의 전체 + 증분 데이터를 Stream Load를 통해 Doris에 지속적으로 기록합니다. 동기화 중에 열 매핑, 필터링 또는 데이터 변환을 수행해야 한다면 [SQL 매핑을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-table.md)를 참조하세요.

### 사용 사례 {#use-cases}

-   PostgreSQL 데이터베이스 전체 또는 여러 테이블을 Doris로 미러 복제해야 하는 경우
-   테이블을 수동으로 생성하지 않고 다운스트림 테이블 스키마를 업스트림과 일치하도록 유지해야 하는 경우
-   동기화 파이프라인에서 불필요한 열 제거, 필터링 또는 변환이 필요하지 않은 경우
-   전체 초기화와 증분 변경 사항의 지속적인 캡처가 모두 필요한 경우

### 참고 사항 {#notes}

1.  현재는 at-least-once(최소 한 번) 처리만 보장됩니다.
2.  현재는 기본 키 테이블의 동기화만 지원됩니다.
3.  Load 권한이 필요합니다. 다운스트림 테이블이 없으면 Create 권한도 필요합니다.
4.  자동 테이블 생성 중 대상 테이블이 이미 존재하면 해당 테이블을 건너뛰므로, 사용자는 다양한 시나리오에 맞게 테이블을 직접 구성할 수 있습니다.

## 빠른 시작 {#quick-start}

<!-- Knowledge type: Operating procedure -->

아래 단계에 따라 PostgreSQL 자동 테이블 생성 동기화 작업을 생성하고 상태를 확인합니다.

### 1단계: 데이터 적재 작업 생성 {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)을 사용하여 지속적 데이터 적재 작업을 생성합니다:

```sql
CREATE JOB test_postgres_job
ON STREAMING
FROM POSTGRES (
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "include_tables" = "test_tbls",
    "offset" = "latest"
)
TO DATABASE target_test_db (
  "table.create.properties.replication_num" = "1"  -- Set to 1 for single-BE deployments
)
```

### 2단계: 데이터 적재 상태 확인 {#step-2-check-load-status}

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

일시 중지, 재개, 삭제, 작업 조회 등 일반적인 작업에 관한 자세한 내용은 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하세요.

## 매개변수 참조 {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### 소스 매개변수(PostgreSQL 측) {#source-parameters-postgresql-side}

PostgreSQL 소스 매개변수는 JDBC 연결, 동기화 범위, 전체 스냅샷 분할 동작을 설정합니다.

| 매개변수 | 기본값 | 설명 |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| jdbc_url | - | PostgreSQL JDBC 연결 문자열 |
| driver_url | - | JDBC 드라이버 jar의 경로입니다. 파일 이름, 로컬 절대 경로, HTTP URL을 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요 |
| driver_class | - | JDBC 드라이버 클래스 이름 |
| user | - | 데이터베이스 사용자 이름 |
| password | - | 데이터베이스 비밀번호 |
| database | - | 데이터베이스 이름 |
| schema | - | 스키마 이름 |
| include_tables | - | 동기화할 테이블을 쉼표로 구분하여 지정합니다. 비워 두면 기본적으로 모든 테이블이 동기화됩니다 |
| offset | latest | latest: 증분 전용 동기화, initial: 전체 + 증분 동기화 |
| snapshot_split_size | 40960 (4.1.4 이전에는 8096) | 분할 크기(행 수)입니다. 전체 동기화 중에는 테이블을 여러 분할로 나누어 동기화합니다 |
| snapshot_parallelism | 1 | 전체 동기화 단계의 병렬 처리 수준으로, 단일 Task에 스케줄링되는 최대 분할 수입니다 |

### Doris 대상 데이터베이스 매개변수 {#doris-target-database-parameters}

대상 측 매개변수는 자동으로 생성되는 테이블의 속성과 Stream Load 쓰기 전략을 제어합니다.

| 매개변수 | 기본값 | 설명 |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | - | 테이블 생성 시 replication_num과 같은 테이블 속성을 지정할 수 있습니다 |
| load.strict_mode | - | 엄격 모드 사용 여부입니다. 기본적으로 비활성화되어 있습니다 |
| load.max_filter_ratio | - | 샘플링 구간 내에서 허용되는 최대 필터링 비율입니다. 값은 0 이상 1 이하여야 합니다. 기본값은 0으로, 오류를 전혀 허용하지 않는다는 뜻입니다. 샘플링 구간은 max_interval * 10입니다. 샘플링 구간 내에서 전체 행에 대한 오류 행의 비율이 max_filter_ratio를 초과하면 루틴 작업이 일시 중지되며, 데이터 품질 문제를 확인하기 위해 수동 개입이 필요합니다. |

## 참조 {#reference}

<!-- Knowledge type: Syntax reference -->

### 데이터 적재 명령 구문 {#load-command-syntax}

자동 테이블 생성 동기화 작업을 생성하는 구문은 다음과 같습니다:

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[ COMMENT <comment> ]
FROM POSTGRES (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

각 구성 요소는 다음과 같습니다:

| 구성 요소 | 설명 |
| ----------------- | ------------------------------------------------- |
| job_name | 작업 이름 |
| job_properties | 작업의 일반 데이터 적재 매개변수를 지정하는 데 사용 |
| comment | 작업을 설명하는 주석 정보를 지정하는 데 사용 |
| source_properties | PostgreSQL 소스 관련 매개변수 |
| target_properties | Doris 대상 데이터베이스 관련 매개변수 |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1: 자동 테이블 생성 동기화와 SQL 매핑 동기화 중 무엇을 선택해야 하나요?**

-   미러 복제와 자동 테이블 생성이 필요하고, 불필요한 열 제거나 변환이 필요하지 않다면 자동 테이블 생성 동기화를 사용하세요.
-   동기화 파이프라인에서 열 매핑, 필터링 또는 데이터 변환을 수행해야 한다면 [SQL 매핑을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-table.md)를 사용하세요.

**Q2: 기본 키가 없는 테이블도 지원하나요?**

현재는 기본 키 테이블의 동기화만 지원됩니다. 기본 키가 없는 테이블은 아직 지원되지 않습니다.

**Q3: 단일 BE 배포 환경에서 테이블 생성이 실패하면 어떻게 해야 하나요?**

`"table.create.properties.replication_num" = "1"`을 `TO DATABASE` 절에 명시적으로 설정하여 기본 복제본 수와 사용 가능한 BE 수가 일치하지 않는 문제를 방지해야 합니다.

**Q4: 대상 테이블이 이미 존재하면 덮어쓰나요?**

아니요. 자동 테이블 생성 단계에서는 이미 존재하는 대상 테이블을 건너뜁니다. 필요에 따라 테이블 스키마를 미리 구성할 수 있습니다.

**Q5: 전체 동기화 단계를 건너뛰고 증분 데이터만 동기화하려면 어떻게 해야 하나요?**

`offset`을 `latest`로 설정하세요. 작업은 최신 증분 변경 사항만 처리하며, 전체 초기화를 수행하지 않습니다.

## 관련 문서 {#related-docs}

-   [SQL 매핑을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-table.md)
-   [지속적 데이터 적재 개요](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
