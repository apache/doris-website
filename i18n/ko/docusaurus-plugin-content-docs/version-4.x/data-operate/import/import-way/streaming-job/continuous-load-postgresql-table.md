---
{
    "title": "SQL 매핑을 사용한 PostgreSQL CDC",
    "language": "ko",
    "sidebar_label": "SQL 매핑 동기화",
    "description": "Doris Job + CDC Stream TVF를 사용하여 열 매핑, 데이터 변환 및 exactly-once 의미 체계를 지원하면서 PostgreSQL 테이블을 Doris에 지속적으로 동기화합니다.",
    "keywords": [
        "PostgreSQL CDC",
        "PostgreSQL 실시간 동기화",
        "Doris CDC Stream",
        "WAL 증분 동기화",
        "Flink CDC",
        "exactly-once",
        "Streaming Job",
        "SQL 매핑 동기화"
    ]
}
---

:::caution 실험적 기능

Doris 지속적 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- 지식 유형: 절차 -->
<!-- 적용 시나리오: PostgreSQL 실시간 데이터 동기화 / SQL 매핑을 사용한 단일 테이블 CDC 수집 -->

SQL 매핑 동기화는 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)를 통해 구현됩니다. 대상은 이미 존재하는 Doris 테이블(`INSERT INTO tbl SELECT * FROM cdc_stream(...)`)입니다. Doris SQL의 표현력을 활용해 열 매핑, 필터링 및 데이터 변환을 지원하면서 exactly-once 의미 체계를 보장합니다. 이 방식은 쓰기 전에 데이터를 처리해야 하는 실시간 동기화 시나리오에 적합합니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 PostgreSQL에서 변경 로그(WAL)를 읽고 소스 테이블에서 대상 테이블로 전체 + 증분 동기화를 수행합니다. Doris가 다운스트림 테이블을 자동으로 생성하고 데이터베이스별로 테이블 그룹을 동기화하도록 하려면 [PostgreSQL CDC 자동 테이블 생성](./continuous-load-postgresql-database.md)을 참조하십시오.

### 사용 사례 {#use-cases}

-   쓰기 전에 열 프루닝, 필터링 또는 식 기반 변환을 수행해야 하는 단일 테이블의 실시간 웨어하우스 수집.
-   다운스트림 Doris 테이블이 이미 존재하며 SQL로 필드 매핑을 명시적으로 제어하려는 경우.
-   높은 일관성 요구 사항으로 exactly-once 의미 체계가 필요한 경우.

### 사용 전제 조건 {#prerequisites}

작업을 생성하기 전에 다음 조건을 확인하십시오.

1. PostgreSQL 측에서 논리 복제가 활성화되어 있어야 합니다. 자세한 내용은 [구성 가이드](./continuous-load-overview.md)를 참조하십시오.
2. 현재 사용자에게 `Load` 권한이 있어야 합니다.
3. 소스 테이블이 기본 키 테이블이어야 합니다(현재 기본 키 테이블만 동기화가 지원됩니다).
4. Doris에 대상 테이블을 미리 생성했으며 스키마가 매핑 SQL과 호환되어야 합니다.

### 참고 사항 {#notes}

-   exactly-once 의미 체계가 지원됩니다.
-   현재 기본 키 테이블 동기화만 지원됩니다.
-   `Load` 권한이 필요합니다.
-   PostgreSQL 측에서 논리 복제를 활성화해야 합니다. [구성 가이드](./continuous-load-overview.md)를 참조하십시오.

## 빠른 시작 {#quick-start}

전체 워크플로는 두 단계로 구성됩니다. 먼저 지속적 데이터 적재 작업을 생성한 다음 작업 상태를 확인합니다.

### 1단계: 데이터 적재 작업 생성 {#step-1-create-the-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)을 사용하여 PostgreSQL의 `public.source_table`을 Doris의 `db1.tbl1`로 동기화하는 지속적 데이터 적재 작업을 생성합니다.

```sql
CREATE JOB pg_single_sync
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "database" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial"
)
```

### 2단계: 데이터 적재 상태 확인 {#step-2-check-the-load-status}

`jobs` 테이블 함수를 사용하여 Streaming 유형 작업의 실행 상태를 확인합니다.

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

일시 중지, 재개, 삭제, Task 보기 등의 기타 일반 작업은 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하십시오.

## 매개변수 설명 {#parameter-reference}

<!-- 지식 유형: 구성 매개변수 -->

### 데이터 소스 매개변수 {#data-source-parameters}

데이터 소스 매개변수는 `cdc_stream(...)` TVF를 통해 구성하며, 동기화할 PostgreSQL 테이블과 읽기 동작을 설명합니다.

| 매개변수            | 기본값 | 설명                                                                                                                                                       |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type                 | -       | 데이터 소스 유형입니다. `postgres`로 설정합니다.                                                                                                                              |
| jdbc_url             | -       | PostgreSQL JDBC 연결 문자열입니다.                                                                                                                                |
| driver_url           | -       | JDBC 드라이버 JAR 경로입니다. 파일 이름, 로컬 절대 경로 또는 HTTP URL을 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하십시오. |
| driver_class         | -       | JDBC 드라이버 클래스 이름입니다.                                                                                                                                           |
| user                 | -       | 데이터베이스 사용자 이름입니다.                                                                                                                                                |
| password             | -       | 데이터베이스 암호입니다.                                                                                                                                                |
| database             | -       | 데이터베이스 이름입니다.                                                                                                                                                    |
| schema               | -       | 스키마 이름입니다.                                                                                                                                                      |
| table                | -       | 동기화할 테이블 이름입니다.                                                                                                                                        |
| offset               | latest  | `latest`: 증분 동기화만 수행합니다. `initial`: 전체 + 증분 동기화를 수행합니다.                                                                                              |
| snapshot_split_size  | 40960    | `split` 크기(행 수)입니다. 전체 동기화 중 테이블이 여러 `split`으로 나뉘어 동기화됩니다.                                                                      |
| snapshot_parallelism | 1       | 전체 동기화 단계의 병렬도, 즉 한 번의 Task에서 예약되는 최대 `split` 수입니다.                                                                    |

### 데이터 적재 구성 매개변수 {#load-configuration-parameters}

데이터 적재 구성 매개변수는 작업의 `job_properties`를 통해 설정하며 데이터 적재 동작과 세션 변수를 제어합니다.

| 매개변수 | 기본값 | 설명                                                                                                                                                                       |
| --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| session.* | 없음    | 모든 세션 변수를 `job_properties`에서 구성할 수 있습니다. 데이터 적재 관련 변수는 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)를 참조하십시오. |

`max_interval`과 같은 기타 일반 매개변수는 지속적 데이터 적재 개요의 [일반 매개변수](./continuous-load-overview.md#common-parameters) 섹션을 참조하십시오.
