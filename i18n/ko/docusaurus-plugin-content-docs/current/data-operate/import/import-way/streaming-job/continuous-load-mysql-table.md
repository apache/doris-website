---
{
    "title": "SQL 매핑을 사용하는 MySQL CDC",
    "language": "ko",
    "sidebar_label": "SQL 매핑 동기화",
    "description": "Doris Streaming Jobs와 CDC Stream TVF를 사용하여 SQL 매핑, 전체 및 증분 오프셋, SSL, 삭제 처리를 활용해 MySQL 테이블을 동기화합니다.",
    "keywords": [
        "MySQL에서 Doris로 동기화",
        "SQL 매핑 동기화",
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

SQL 매핑 동기화는 Job + [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)로 구현되며, **기존** Doris 테이블을 대상으로 합니다(`INSERT INTO tbl SELECT * FROM cdc_stream(...)`). Doris SQL의 풍부한 표현력을 활용하여 동기화 파이프라인에서 열 매핑, 필터링, 데이터 변환을 수행할 수 있습니다. 데이터 처리가 필요한 실시간 동기화 시나리오에 적합합니다.

> SQL 매핑 동기화는 4.1.0 버전부터 지원됩니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 MySQL에서 변경 로그(Binlog)를 읽고, 원본 테이블에서 대상 테이블로 **전체 + 증분** 동기화를 수행합니다. Doris가 다운스트림 테이블을 자동으로 생성하고 데이터베이스 단위로 여러 테이블을 동기화하도록 하려면 [자동 테이블 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)를 참조하세요.

### 적용 시나리오 {#applicable-scenarios}

- 대상 테이블의 스키마가 이미 설계되어 있는 상태에서 단일 MySQL 테이블을 Doris로 지속적으로 동기화하는 경우
- 동기화 중 필요한 열만 선택하거나 열 매핑, 필드 이름 변경, 데이터 변환이 필요한 경우
- 엔드투엔드 exactly-once 시맨틱이 필요한 실시간 데이터 통합

### 사전 요구 사항 {#prerequisites}

| 항목 | 설명 |
| ------ | ---- |
| Doris 버전 | 4.1.0 이상 |
| 테이블 유형 | 업스트림 원본 테이블에는 기본 키가 있어야 하며, Doris 대상 테이블은 Unique Key 모델을 사용해야 합니다 |
| 사용자 권한 | `Load` 권한이 필요합니다 |
| MySQL 설정 | MySQL 측에서 Binlog를 활성화해야 합니다. [설정 가이드](./continuous-load-overview.md#supported-data-sources-and-sync-modes)를 참조하세요 |
| 시맨틱 보장 | exactly-once 시맨틱을 지원합니다 |

## 빠른 시작 {#quick-start}

다음은 실행 가능한 최소 예제로, 작업 생성부터 상태 확인까지의 전체 흐름을 보여 줍니다.

### 1단계: 데이터 적재 작업 생성 {#step-1-create-the-import-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)을 사용하여 지속적인 데이터 적재 작업을 생성합니다.

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

일시 중지, 재개, 삭제, 태스크 조회 등 일반적인 관리 방법은 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하세요.

## 매개변수 참조 {#parameter-reference}

### 데이터 소스 매개변수 {#data-source-parameters}

CDC Stream TVF는 다음 MySQL 데이터 소스 매개변수를 지원합니다.

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | 예 | - | 데이터 소스 유형입니다. `mysql`로 설정합니다. |
| `jdbc_url` | 예 | - | MySQL JDBC 연결 문자열입니다. |
| `driver_url` | 예 | - | JDBC 드라이버 jar의 경로입니다. 파일 이름, 로컬 절대 경로 또는 HTTP URL을 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요. |
| `driver_class` | 예 | - | JDBC 드라이버 클래스 이름입니다. 예: `com.mysql.cj.jdbc.Driver`. |
| `user` | 예 | - | 데이터베이스 사용자 이름입니다. |
| `password` | 예 | - | 데이터베이스 비밀번호입니다. |
| `database` | 예 | - | MySQL 데이터베이스 이름입니다. |
| `table` | 예 | - | 동기화할 테이블의 이름입니다. 각 SQL 매핑 작업은 원본 테이블 하나를 지원합니다. |
| `offset` | 예 | - | 시작 오프셋입니다. `initial`: 전체 및 증분 동기화, `snapshot`: 전체 동기화만 수행, `earliest`: 사용 가능한 가장 이른 Binlog 오프셋부터 시작, `latest`: 작업이 시작된 이후의 변경 사항만 동기화합니다. `{"file":"binlog.000001","pos":"154"}` 또는 `{"gtids":"<gtid_set>"}`과 같이 정확한 JSON 오프셋을 지정할 수도 있습니다. |
| `snapshot_split_size` | 아니요 | `40960` (4.1.4 이전에는 `8096`) | 분할 크기이며 단위는 행입니다. 전체 동기화 중 테이블을 여러 분할로 나눕니다. 양의 정수여야 합니다. |
| `snapshot_parallelism` | 아니요 | `1` | 전체 동기화 단계의 병렬 처리 수입니다. 즉, Task가 한 번에 스케줄링할 수 있는 최대 분할 수입니다. 양의 정수여야 합니다. |
| `skip_snapshot_backfill` | 아니요 | `false` | 스냅샷 중 Binlog 백필을 건너뛸지 여부입니다. `true`로 설정하면 at-least-once 시맨틱을 사용합니다. |
| `server_id` | 아니요 | 자동 생성 | MySQL CDC 리더의 서버 ID입니다. `5400`과 같은 단일 값 또는 `5400-5408`과 같이 양 끝값을 포함하는 범위를 지원합니다. 범위에 포함된 ID 수는 `snapshot_parallelism` 이상이어야 합니다. |
| `ssl_mode` | 아니요 | `disable` | SSL 모드입니다. 유효한 값은 `disable`, `require`, `verify-ca`입니다. |
| `ssl_rootcert` | 조건부 필수 | - | `FILE:<file_name>` 형식의 CA 인증서 파일입니다. `ssl_mode`가 `verify-ca`일 때 필요합니다. 먼저 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md)을 사용하여 파일을 업로드하세요. |
| `include_delete_sign` | 아니요 | `false` | TVF가 `__DORIS_DELETE_SIGN__` 열을 추가로 출력할지 여부입니다. 업스트림 DELETE 작업을 Doris 기본 키 테이블의 삭제 작업으로 동기화하려면 `true`로 설정합니다. |

`include_delete_sign`을 활성화하면 대상 테이블은 Merge-on-Write Unique Key 테이블이어야 하며, `__DORIS_DELETE_SIGN__`을 INSERT 대상 열 목록과 SELECT 목록 모두에 명시적으로 매핑해야 합니다.

```sql
CREATE JOB mysql_cdc_with_delete
ON STREAMING
DO
INSERT INTO db1.target_table (id, value, __DORIS_DELETE_SIGN__)
SELECT id, value, __DORIS_DELETE_SIGN__
FROM cdc_stream(
    "type" = "mysql",
    "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
    "driver_url" = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user" = "root",
    "password" = "123456",
    "database" = "source_db",
    "table" = "source_table",
    "offset" = "initial",
    "include_delete_sign" = "true"
);
```

### 작업 설정 매개변수 {#job-configuration-parameters}

다음 매개변수는 `CREATE JOB ... PROPERTIES (...)`를 통해 설정합니다.

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `max_interval` | `10` | 업스트림에 새 데이터가 없을 때의 유휴 스케줄링 간격이며 단위는 초입니다. 1 이상의 정수여야 합니다. |
| `compute_group` | 현재 세션 또는 사용자의 기본 컴퓨트 그룹 | 컴퓨트와 스토리지가 분리된 모드에서만 지원됩니다. 작업이 실행될 컴퓨트 그룹을 지정합니다. 사용자는 해당 컴퓨트 그룹에 대한 USAGE 권한이 있어야 합니다. |
| `session.<variable_name>` | 해당 세션 변수의 기본값 | INSERT 태스크의 세션 변수를 설정합니다. 데이터 적재 변수는 [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)를 참조하세요. |

Job 속성 `offset`을 사용하여 `ALTER JOB`으로 CDC 위치를 재설정하는 방법과 전체 제약 사항은 [작업 공통 데이터 적재 설정 매개변수](./continuous-load-overview.md#job-common-load-configuration-parameters)를 참조하세요. 새 작업의 초기 위치는 `cdc_stream(...)`에서 설정해야 합니다.

## 자주 묻는 질문 {#faq}

**Q1: SQL 매핑 동기화와 자동 테이블 생성 동기화의 차이점은 무엇인가요?**

- SQL 매핑 동기화: 대상 Doris 테이블을 **미리 생성**해야 합니다. 열 매핑과 데이터 변환을 지원하므로 세밀한 처리가 필요한 시나리오에 적합합니다.
- 자동 테이블 생성 동기화: Doris가 다운스트림 테이블을 **자동으로 생성**하고 데이터베이스 단위로 전체를 동기화합니다. 자세한 내용은 [자동 테이블 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)를 참조하세요.

**Q2: 기본 키가 없는 테이블을 대상 테이블로 사용할 수 있나요?**

업스트림 원본 테이블에는 기본 키가 있어야 하며, 현재 Doris 대상 테이블은 Unique Key 모델을 사용해야 합니다.

**Q3: 과거 전체 데이터를 제외하고 증분 데이터만 동기화하려면 어떻게 해야 하나요?**

`offset` 매개변수를 `latest`로 설정합니다. 작업은 전체 동기화 단계를 건너뛰고 Binlog 증분 데이터만 동기화합니다.

**Q4: 전체 동기화가 너무 느릴 때는 어떻게 최적화하나요?**

다음 두 매개변수를 조정하여 전체 동기화 단계의 처리량을 높일 수 있습니다.

- `snapshot_split_size`: 분할당 행 수를 늘립니다.
- `snapshot_parallelism`: Task마다 스케줄링하는 분할의 병렬 처리 수를 늘립니다.

`snapshot_parallelism`을 조정할 때 `server_id` 범위도 설정되어 있다면, 범위에 포함된 ID 수가 병렬 처리 수 이상인지 확인하세요.

## 관련 문서 {#related-documents}

- [지속적 데이터 적재 개요](./continuous-load-overview.md)
- [자동 테이블 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md)
- [CDC Stream TVF](../../../../sql-manual/sql-functions/table-valued-functions/cdc-stream.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md)
