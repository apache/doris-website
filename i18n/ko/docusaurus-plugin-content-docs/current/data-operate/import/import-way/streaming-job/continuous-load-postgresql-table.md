---
{
    "title": "SQL 매핑을 사용하는 PostgreSQL CDC",
    "language": "ko",
    "sidebar_label": "SQL 매핑 동기화",
    "description": "Doris Job + CDC Stream TVF를 사용하여 컬럼 매핑, 데이터 변환 및 exactly-once 시맨틱을 지원하면서 PostgreSQL 테이블을 Doris로 지속적으로 동기화합니다.",
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

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: PostgreSQL real-time data sync / single-table CDC ingestion with SQL mapping -->

SQL 매핑 동기화는 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)를 통해 구현됩니다. 대상은 기존 Doris 테이블입니다(`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). Doris SQL의 표현력을 활용하여 컬럼 매핑, 필터링 및 데이터 변환을 수행할 수 있습니다. 이 방식은 데이터를 쓰기 전에 처리해야 하는 실시간 동기화 시나리오에 적합합니다.

> SQL 매핑 동기화는 4.1.0 버전부터 지원됩니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 PostgreSQL의 변경 로그(WAL)를 읽고, 원본 테이블에서 대상 테이블로 전체 + 증분 동기화를 수행합니다. Doris가 다운스트림 테이블을 자동으로 생성하고 데이터베이스 단위로 여러 테이블을 동기화하도록 하려면 [자동 테이블 생성을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-database.md)를 참조하십시오.

### 사용 사례 {#use-cases}

-   쓰기 전에 컬럼 가지치기, 필터링 또는 표현식 기반 변환이 필요한 단일 테이블의 실시간 데이터 웨어하우스 수집.
-   다운스트림 Doris 테이블이 이미 존재하며, SQL로 필드 매핑을 명시적으로 제어하려는 경우.
-   exactly-once 시맨틱이 필요할 정도로 일관성 요구 사항이 높은 경우.

### 사전 요구 사항 {#prerequisites}

작업을 생성하기 전에 다음 사항을 확인하십시오.

1. PostgreSQL 측에서 논리적 복제가 활성화되어 있어야 합니다. 자세한 내용은 [설정 가이드](./continuous-load-overview.md#supported-data-sources-and-sync-modes)를 참조하십시오.
2. 현재 사용자에게 `Load` 권한이 있어야 합니다.
3. 원본 테이블은 기본 키 테이블이어야 합니다. 현재는 기본 키 테이블만 동기화할 수 있습니다.
4. 대상 Unique Key 테이블이 Doris에 미리 생성되어 있어야 하며, 해당 스키마가 매핑 SQL과 호환되어야 합니다.

### 참고 사항 {#notes}

-   exactly-once 시맨틱을 지원합니다.
-   현재는 기본 키 테이블의 동기화만 지원합니다.
-   `Load` 권한이 필요합니다.
-   PostgreSQL 측에서 논리적 복제를 활성화해야 합니다. [설정 가이드](./continuous-load-overview.md#supported-data-sources-and-sync-modes)를 참조하십시오.

## 빠른 시작 {#quick-start}

전체 절차는 지속적 데이터 적재 작업을 생성한 다음 작업 상태를 확인하는 두 단계로 구성됩니다.

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

그 밖의 일반적인 작업(일시 중지, 재개, 삭제, 태스크 조회 등)은 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하십시오.

## 매개변수 참조 {#parameter-reference}

<!-- Knowledge type: Configuration parameters -->

### 데이터 소스 매개변수 {#data-source-parameters}

데이터 소스 매개변수는 `cdc_stream(...)` TVF를 통해 설정합니다. 동기화할 PostgreSQL 테이블과 읽기 동작을 지정합니다.

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | 예 | - | 데이터 소스 유형입니다. `postgres`로 설정합니다. |
| `jdbc_url` | 예 | - | PostgreSQL JDBC 연결 문자열입니다. |
| `driver_url` | 예 | - | JDBC 드라이버 jar의 경로입니다. 파일 이름, 로컬 절대 경로 또는 HTTP URL을 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하십시오. |
| `driver_class` | 예 | - | JDBC 드라이버 클래스 이름입니다. 예: `org.postgresql.Driver`. |
| `user` | 예 | - | 데이터베이스 사용자 이름입니다. |
| `password` | 예 | - | 데이터베이스 비밀번호입니다. |
| `database` | 아니요 | JDBC URL의 데이터베이스 이름 | PostgreSQL 데이터베이스 이름입니다. 명시적으로 설정하면 JDBC URL의 데이터베이스 이름보다 우선 적용됩니다. UTF-8 인코딩 후 63바이트를 초과할 수 없습니다. |
| `schema` | 예 | - | 스키마 이름입니다. |
| `table` | 예 | - | 동기화할 테이블의 이름입니다. 각 SQL 매핑 작업은 하나의 원본 테이블을 지원합니다. |
| `offset` | 예 | - | 시작 오프셋입니다. `initial`: 전체 및 증분 동기화, `snapshot`: 전체 동기화만 수행, `latest`: 작업 시작 이후의 변경 사항만 동기화합니다. `{"lsn":"12345678"}`과 같이 정확한 JSON 오프셋을 지정할 수도 있습니다. PostgreSQL은 `earliest`를 지원하지 않습니다. |
| `snapshot_split_size` | 아니요 | `40960` (4.1.4 이전에는 `8096`) | 행 수로 지정하는 분할 크기입니다. 전체 동기화 중에는 테이블을 여러 분할로 나눕니다. 양의 정수여야 합니다. |
| `snapshot_parallelism` | 아니요 | `1` | 전체 동기화 단계의 병렬 처리 수준으로, Task가 한 번에 스케줄링하는 최대 분할 수를 의미합니다. 양의 정수여야 합니다. |
| `skip_snapshot_backfill` | 아니요 | `false` | 스냅샷 중 WAL 백필을 건너뛸지 여부입니다. `true`로 설정하면 at-least-once 시맨틱을 사용합니다. |
| `slot_name` | 아니요 | `doris_cdc_<job_id>` | 논리적 복제 슬롯 이름입니다. 이름에는 영문 소문자, 숫자 및 밑줄만 사용할 수 있으며, 숫자로 시작할 수 없고 63자로 제한됩니다. 사용자 지정 슬롯은 미리 생성해야 하며 Doris가 삭제하지 않습니다. |
| `publication_name` | 아니요 | `doris_pub_<job_id>` | Publication 이름입니다. 명명 규칙은 `slot_name`과 같습니다. 사용자 지정 Publication은 미리 생성해야 하고 현재 원본 테이블을 포함해야 하며, Doris가 삭제하지 않습니다. |
| `ssl_mode` | 아니요 | `disable` | SSL 모드입니다. 유효한 값은 `disable`, `require`, `verify-ca`입니다. |
| `ssl_rootcert` | 조건부 필수 | - | `FILE:<file_name>` 형식의 CA 인증서 파일입니다. `ssl_mode`가 `verify-ca`인 경우 필수입니다. 먼저 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md)을 사용하여 파일을 업로드하십시오. |
| `include_delete_sign` | 아니요 | `false` | TVF가 `__DORIS_DELETE_SIGN__` 컬럼을 추가로 출력할지 여부입니다. `true`로 설정하면 업스트림 DELETE 작업을 Doris 기본 키 테이블의 삭제 작업으로 동기화합니다. |

`include_delete_sign`을 활성화하면 대상 테이블은 Merge-on-Write Unique Key 테이블이어야 하며, INSERT 대상 컬럼 목록과 SELECT 목록 모두에 `__DORIS_DELETE_SIGN__`을 명시적으로 매핑해야 합니다.

```sql
CREATE JOB pg_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "postgres",
    "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url" = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user" = "postgres",
    "password" = "postgres",
    "schema" = "public",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

`slot_name` 또는 `publication_name`을 사용자 지정하는 경우 Job을 생성하기 전에 해당 리소스를 준비하십시오. Doris는 Job을 삭제할 때 사용자가 제공한 리소스를 유지합니다.

### Job 설정 매개변수 {#job-configuration-parameters}

다음 매개변수는 `CREATE JOB ... PROPERTIES (...)`를 통해 설정합니다.

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `max_interval` | `10` | 업스트림에 새 데이터가 없을 때의 유휴 스케줄링 간격(초)입니다. 1 이상의 정수여야 합니다. |
| `compute_group` | 현재 세션 또는 사용자의 기본 컴퓨팅 그룹 | 컴퓨팅과 스토리지가 분리된 모드에서만 지원됩니다. 작업을 실행할 컴퓨팅 그룹을 지정합니다. 사용자에게 해당 컴퓨팅 그룹에 대한 USAGE 권한이 있어야 합니다. |
| `session.<variable_name>` | 해당 세션 변수의 기본값 | INSERT 태스크의 세션 변수를 설정합니다. 데이터 적재 변수는 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)를 참조하십시오. |

CDC 위치를 재설정하는 데 사용하는 Job 속성 `offset`과 `ALTER JOB`을 통한 재설정에 적용되는 모든 제약 사항은 [Job 공통 데이터 적재 설정 매개변수](./continuous-load-overview.md#job-common-load-configuration-parameters)를 참조하십시오. 새 작업의 초기 위치는 `cdc_stream(...)`에서 설정해야 합니다.
