---
{
    "title": "자동 테이블 생성을 지원하는 PostgreSQL CDC",
    "language": "ko",
    "sidebar_label": "자동 테이블 생성 동기화",
    "description": "Doris Streaming Job에서 자동 테이블 생성, 필터링, 복제 리소스, SSL 및 데이터 품질 제어를 활용하여 PostgreSQL 테이블을 동기화하는 방법을 알아봅니다.",
    "keywords": [
        "PostgreSQL 동기화",
        "PostgreSQL CDC",
        "자동 테이블 생성 동기화",
        "전체 데이터베이스 동기화",
        "Streaming Job",
        "Flink CDC",
        "Doris 데이터 수집",
        "PostgreSQL에서 Doris로",
        "전체 및 증분 동기화",
        "자동 테이블 생성"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Continuously sync an entire PostgreSQL database to Doris -->

자동 테이블 생성 동기화는 기본 제공 DDL인 `FROM POSTGRES (...) TO DATABASE (...)`를 통해 구현됩니다. 대상은 Doris 데이터베이스이며, Doris는 업스트림 테이블 스키마를 기반으로 해당 다운스트림 테이블을 자동으로 생성합니다. `include_tables`를 사용하여 단일 테이블, 여러 테이블 또는 모든 테이블을 동기화할지 제어할 수 있습니다. 최초 동기화 시 Doris는 다운스트림 기본 키 테이블을 자동으로 생성하고 기본 키를 업스트림과 일치시킵니다. 이 방식은 데이터에 대한 SQL 처리가 필요 없고 다운스트림 테이블 스키마가 업스트림을 자동으로 따라야 하는 미러 복제 시나리오에 적합합니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc) 기능을 통합하여 PostgreSQL에서 변경 로그를 읽고, 테이블 그룹의 전체 + 증분 데이터를 Stream Load를 통해 Doris에 지속적으로 기록합니다. 자동 테이블 생성 동기화는 개별 소스 테이블에 대상 테이블 이름을 지정하거나 기본 키가 아닌 컬럼을 제외하는 기능을 지원합니다. SQL 표현식, 행 필터링 또는 데이터 변환이 필요한 경우 [SQL 매핑을 통한 PostgreSQL CDC](./continuous-load-postgresql-table.md)를 참조하세요.

### 활용 사례 {#use-cases}

-   PostgreSQL 데이터베이스 전체 또는 여러 테이블을 Doris로 미러 복제
-   테이블을 수동으로 생성하지 않고 다운스트림 테이블 스키마를 업스트림과 일치하도록 유지
-   SQL 표현식, 행 필터링 또는 데이터 변환 없이 간단한 대상 테이블 이름 변경이나 컬럼 제외만 필요한 경우
-   전체 데이터 초기 적재와 증분 변경 사항의 지속적인 캡처가 모두 필요한 경우

### 유의 사항 {#notes}

1.  현재는 at-least-once 의미론만 보장됩니다.
2.  기본 키가 있는 업스트림 테이블만 동기화할 수 있으며, 자동으로 생성되는 다운스트림 테이블은 Unique Key 모델을 사용합니다.
3.  Load 권한이 필요합니다. 다운스트림 테이블이 없는 경우 Create 권한도 필요합니다.
4.  자동 테이블 생성 중 대상 테이블이 이미 존재하면 해당 테이블을 건너뛰므로, 사용자가 시나리오에 맞게 테이블을 사용자 지정할 수 있습니다.

## 빠른 시작 {#quick-start}

<!-- Knowledge type: Operating procedure -->

다음 단계에 따라 PostgreSQL 자동 테이블 생성 동기화 작업을 생성하고 상태를 확인합니다.

### 1단계: 데이터 적재 작업 생성 {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)을 사용하여 지속적 데이터 적재 작업을 생성합니다.

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

그 밖의 일반적인 작업(일시 중지, 재개, 삭제, 태스크 조회 등)은 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하세요.

## 매개변수 참조 {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### 소스 매개변수 (PostgreSQL 측) {#source-parameters-postgresql-side}

PostgreSQL 소스 매개변수는 JDBC 연결, 동기화 범위 및 전체 스냅샷 분할 동작을 구성합니다. 연결 정보, 드라이버 정보, `database`, `schema`는 필수입니다.

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `jdbc_url` | 예 | - | PostgreSQL JDBC 연결 문자열입니다. |
| `driver_url` | 예 | - | JDBC 드라이버 jar의 경로입니다. 파일 이름, 로컬 절대 경로 또는 HTTP URL을 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요. |
| `driver_class` | 예 | - | JDBC 드라이버 클래스 이름입니다. 예: `org.postgresql.Driver`. |
| `user` | 예 | - | 데이터베이스 사용자 이름입니다. |
| `password` | 예 | - | 데이터베이스 비밀번호입니다. |
| `database` | 예 | - | PostgreSQL 데이터베이스 이름입니다. JDBC URL의 데이터베이스 이름과 일치해야 하며, UTF-8 인코딩 후 63바이트를 초과할 수 없습니다. |
| `schema` | 예 | - | 스키마 이름입니다. |
| `include_tables` | 아니요 | - | 동기화할 테이블 이름을 쉼표로 구분하여 지정합니다. 설정하지 않으면 스키마의 모든 테이블을 동기화합니다. |
| `exclude_tables` | 아니요 | - | 동기화하지 않을 테이블 이름을 쉼표로 구분하여 지정합니다. 이 매개변수는 `include_tables`가 설정되지 않은 경우에만 적용됩니다. |
| `table.<table_name>.target_table` | 아니요 | 소스 테이블 이름 | 4.1.0 버전부터 지원됩니다. 소스 테이블에 대응하는 Doris 대상 테이블 이름을 설정합니다. `<table_name>`은 소스 테이블 이름입니다. |
| `table.<table_name>.exclude_columns` | 아니요 | - | 4.1.0 버전부터 지원됩니다. 동기화하지 않을 소스 컬럼을 쉼표로 구분하여 지정합니다. 해당 컬럼은 실제로 존재해야 하며 기본 키 컬럼을 포함할 수 없습니다. |
| `offset` | 아니요 | `latest` | 시작 오프셋입니다. `initial`: 전체 및 증분 동기화, `latest`: 작업 시작 후 발생한 변경 사항만 동기화합니다. `{"lsn":"12345678"}`와 같이 정확한 JSON 오프셋을 지정할 수도 있습니다. 4.1.0 버전부터는 전체 동기화만 수행하는 `snapshot`도 지원합니다. PostgreSQL은 `earliest`를 지원하지 않습니다. |
| `snapshot_split_size` | 아니요 | `40960` (4.1.4 이전에는 `8096`) | 행 수로 지정하는 분할 크기입니다. 전체 동기화 중에는 테이블을 여러 분할 단위로 나눕니다. 양의 정수여야 합니다. |
| `snapshot_parallelism` | 아니요 | `1` | 전체 동기화 단계의 병렬 처리 수준으로, Task가 한 번에 스케줄링할 수 있는 최대 분할 수입니다. 양의 정수여야 합니다. |
| `slot_name` | 아니요 | `doris_cdc_<job_id>` | 4.1.0 버전부터 지원됩니다. 논리 복제 슬롯 이름입니다. 이름에는 소문자, 숫자 및 밑줄만 사용할 수 있으며, 숫자로 시작할 수 없고 길이는 63자로 제한됩니다. 사용자 지정 슬롯은 미리 생성해야 하며 Doris가 삭제하지 않습니다. |
| `publication_name` | 아니요 | `doris_pub_<job_id>` | 4.1.0 버전부터 지원됩니다. Publication 이름입니다. 명명 규칙은 `slot_name`과 동일합니다. 사용자 지정 Publication은 미리 생성하고 동기화할 모든 테이블을 포함해야 하며, Doris가 삭제하지 않습니다. |
| `ssl_mode` | 아니요 | `disable` | 4.1.0 버전부터 지원됩니다. SSL 모드입니다. 유효한 값은 `disable`, `require`, `verify-ca`입니다. |
| `ssl_rootcert` | 조건부 필수 | - | 4.1.0 버전부터 지원됩니다. `FILE:<file_name>` 형식의 CA 인증서 파일입니다. `ssl_mode`가 `verify-ca`인 경우 필수입니다. 먼저 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md)을 사용하여 파일을 업로드하세요. |

`include_tables`와 `exclude_tables`가 모두 설정된 경우 `include_tables`가 우선 적용됩니다. 다음 `FROM POSTGRES` 매개변수 예시는 `orders`와 `customers`를 동기화하고, `orders`를 `ods_orders`에 기록하며, 기본 키가 아닌 컬럼 `internal_note`를 제외하고, 미리 생성된 논리 복제 리소스와 CA 검증을 사용합니다.

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"slot_name" = "orders_slot",
"publication_name" = "orders_publication",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

사용자 지정 복제 슬롯과 Publication은 사용자가 관리하며, Streaming Job이 삭제되어도 유지됩니다. `slot_name` 또는 `publication_name`을 생략하면 Doris가 작업에 필요한 해당 리소스를 생성하고, 작업이 삭제될 때 직접 생성한 리소스를 정리합니다.

### Doris 대상 데이터베이스 매개변수 {#doris-target-database-parameters}

대상 측 매개변수는 자동으로 생성되는 테이블의 속성과 Stream Load 쓰기 전략을 제어합니다. 다음 매개변수는 모두 선택 사항입니다.

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris가 테이블을 생성할 때 테이블 속성을 추가합니다. 예: `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Stream Load 쓰기에 엄격 모드를 활성화할지 여부입니다. 유효한 값은 `true`와 `false`입니다. |
| `load.max_filter_ratio` | `0` | 샘플링 구간에서 허용되는 최대 필터링 비율이며, 범위는 `[0, 1]`입니다. `0`은 오류 행을 필터링할 수 없음을 의미합니다. 샘플링 구간은 `max_interval * 10`초입니다. 이 구간에서 전체 행 대비 오류 행의 비율이 이 값을 초과하면 작업이 일시 중지됩니다. |

## 참조 {#reference}

<!-- Knowledge type: Syntax reference -->

### 데이터 적재 명령 구문 {#load-command-syntax}

자동 테이블 생성 동기화 작업을 생성하는 구문은 다음과 같습니다.

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

각 구성 요소는 다음과 같습니다.

| 구성 요소            | 설명                                       |
| ----------------- | ------------------------------------------------- |
| job_name          | 작업 이름                                          |
| job_properties    | 작업의 일반 데이터 적재 매개변수를 지정하는 데 사용 |
| comment           | 주석 정보로 작업을 설명하는 데 사용 |
| source_properties | PostgreSQL 소스 관련 매개변수              |
| target_properties | Doris 대상 데이터베이스 관련 매개변수          |

`job_properties`는 `max_interval`과 `compute_group`을 지원합니다. 자세한 내용은 [작업 공통 데이터 적재 구성 매개변수](./continuous-load-overview.md#job-common-load-configuration-parameters)를 참조하세요. 자동 테이블 생성 모드에서는 `session.*`를 사용하지 않습니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Frequently asked questions -->

**Q1: 자동 테이블 생성 동기화와 SQL 매핑 동기화 중 어떤 것을 선택해야 하나요?**

-   미러 복제, 자동 테이블 생성이 필요하거나 대상 테이블 이름 변경과 기본 키가 아닌 컬럼 제외만 필요한 경우 자동 테이블 생성 동기화를 사용하세요.
-   동기화 파이프라인에서 SQL 표현식, 행 필터링 또는 데이터 변환이 필요한 경우 [SQL 매핑을 통한 PostgreSQL CDC](./continuous-load-postgresql-table.md)를 사용하세요.

**Q2: 기본 키가 없는 테이블도 지원하나요?**

현재는 기본 키가 있는 테이블의 동기화만 지원합니다. 기본 키가 없는 테이블은 아직 지원하지 않습니다.

**Q3: 단일 BE 배포에서 테이블 생성에 실패하면 어떻게 해야 하나요?**

기본 복제본 수와 사용 가능한 BE 수가 일치하지 않는 문제를 방지하려면 `"table.create.properties.replication_num" = "1"`을 `TO DATABASE` 절에 명시적으로 설정해야 합니다.

**Q4: 대상 테이블이 이미 존재하면 덮어쓰나요?**

아니요. 자동 테이블 생성 단계에서는 이미 존재하는 대상 테이블을 건너뜁니다. 필요에 따라 테이블 스키마를 미리 사용자 지정할 수 있습니다.

**Q5: 전체 동기화 단계를 건너뛰고 증분 데이터만 동기화하려면 어떻게 해야 하나요?**

`offset`을 `latest`로 설정하세요. 작업은 최신 증분 변경 사항만 소비하며 전체 데이터 초기 적재는 수행하지 않습니다.

## 관련 문서 {#related-docs}

-   [SQL 매핑을 통한 PostgreSQL CDC](./continuous-load-postgresql-table.md)
-   [지속적 데이터 적재 개요](./continuous-load-overview.md)
-   [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
