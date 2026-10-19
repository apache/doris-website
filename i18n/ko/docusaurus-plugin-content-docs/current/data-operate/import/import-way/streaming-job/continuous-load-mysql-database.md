---
{
    "title": "자동 테이블 생성을 지원하는 MySQL CDC",
    "language": "ko",
    "sidebar_label": "자동 테이블 생성 동기화",
    "description": "Doris Streaming Job으로 자동 테이블 생성, 필터링, 오프셋, 스냅샷, SSL, 데이터 품질 제어를 적용하여 MySQL 테이블을 동기화하는 방법을 알아봅니다.",
    "keywords": [
        "MySQL 자동 테이블 생성 동기화",
        "MySQL 전체 데이터베이스 동기화",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC 실시간 동기화",
        "지속적 데이터 적재",
        "전체 및 증분 동기화",
        "자동 테이블 생성"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror sync of a whole MySQL database to Doris -->

자동 테이블 생성 동기화는 기본 제공 `FROM MYSQL (...) TO DATABASE (...)` DDL로 구현됩니다. 동기화 대상은 Doris 데이터베이스이며, Doris는 업스트림 테이블 스키마를 기반으로 해당 다운스트림 테이블을 자동으로 생성합니다. `include_tables`를 사용하여 하나의 테이블, 여러 테이블 또는 모든 테이블을 동기화할지 지정할 수 있습니다. 최초 동기화 시 Doris는 다운스트림 기본 키 테이블을 자동으로 생성하고 기본 키를 업스트림과 일치시킵니다. 이 기능은 SQL 처리가 필요하지 않고 다운스트림 테이블 스키마가 업스트림을 자동으로 따라야 하는 미러 복제 시나리오에 적합합니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc) 기능을 통합하여 MySQL의 변경 로그를 읽고, Stream Load를 통해 여러 테이블의 전체 데이터와 증분 데이터를 Doris에 지속적으로 기록합니다. 자동 테이블 생성 동기화는 개별 소스 테이블에 대상 테이블 이름을 지정하거나 키가 아닌 컬럼을 제외하는 기능을 지원합니다. SQL 표현식, 행 필터링 또는 데이터 변환이 필요한 경우 [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)를 참조하세요.

### 적용 시나리오 {#applicable-scenarios}

- MySQL의 여러 테이블 또는 전체 데이터베이스를 Doris로 미러링해야 하는 경우.
- 테이블을 수동으로 생성하지 않고 업스트림을 기반으로 다운스트림 테이블 스키마와 기본 키를 자동으로 생성하려는 경우.
- SQL 표현식, 행 필터링 또는 데이터 변환 없이 단순히 대상 테이블 이름을 변경하거나 일부 컬럼을 제외하기만 하면 되는 경우.
- 초기 전체 데이터 적재와 이후 증분 변경 사항의 지속적인 수신을 모두 지원해야 하는 경우.

### 기능 및 제한 사항 {#capabilities-and-limitations}

| 항목                  | 설명                                                          |
| --------------------- | -------------------------------------------------------------------- |
| 일관성 의미론 | 현재는 at-least-once 의미론만 보장합니다                |
| 테이블 유형            | 기본 키가 있는 업스트림 테이블만 동기화할 수 있으며, 자동으로 생성되는 다운스트림 테이블은 Unique Key 모델을 사용합니다 |
| 권한            | 데이터 적재 권한이 필요하며, 다운스트림 테이블이 없으면 생성 권한도 필요합니다 |
| 자동 테이블 생성   | 대상 테이블이 이미 있으면 생성을 건너뜁니다. 필요에 따라 테이블 스키마를 사용자 지정할 수 있습니다 |
| 데이터 처리       | 대상 테이블 이름 변경과 키가 아닌 컬럼의 제외를 지원합니다. SQL 표현식, 행 필터링 또는 데이터 변환은 지원하지 않습니다 |

## 사전 요구 사항 {#prerequisites}

자동 테이블 생성 동기화 작업을 생성하기 전에 다음 사항을 확인하세요.

1. Doris 클러스터가 배포되어 있고 데이터 적재 권한이 있어야 합니다. 자동 테이블 생성 시나리오에서는 생성 권한도 필요합니다.
2. MySQL 버전과 호환되는 JDBC 드라이버 jar가 업로드되어 있어야 하며, 파일 이름, 로컬 절대 경로 또는 HTTP 주소로 참조할 수 있어야 합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요.
3. MySQL에서 binlog가 활성화되어 있어야 하며, 계정에 binlog 읽기 권한이 있어야 합니다.
4. 전체 데이터베이스를 동기화할지, `include_tables`에 지정된 테이블만 동기화할지 동기화 범위가 명확해야 합니다.

## 빠른 시작 {#quick-start}

<!-- Knowledge type: Procedure -->

### 1단계: 데이터 적재 작업 생성 {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)을 사용하여 지속적 데이터 적재 작업을 생성합니다.

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-java-8.0.25.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "test",
        "include_tables" = "user_info,order_info",
        "offset" = "initial"
)
TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"  -- Set to 1 for single-BE deployment
)
```

위 예제의 주요 내용은 다음과 같습니다.

- `database`는 업스트림 MySQL 데이터베이스를 지정합니다. `include_tables`는 동기화할 테이블을 제한합니다. 여러 테이블은 쉼표로 구분하며, 비워 두면 전체 데이터베이스를 동기화합니다.
- `offset = "initial"`은 먼저 전체 데이터를 초기화한 다음 증분 동기화로 전환함을 의미합니다. 증분 데이터만 동기화하려면 `latest`로 변경하세요.
- `TO DATABASE target_test_db`는 다운스트림 Doris 데이터베이스를 지정합니다. `table.create.properties.*`를 사용하여 복제본 수와 같이 자동으로 생성되는 테이블의 속성을 제어할 수 있습니다.

### 2단계: 데이터 적재 상태 확인 {#step-2-check-load-status}

`jobs("type"="insert")` 테이블 함수를 통해 Streaming Job의 실행 상태를 조회합니다.

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
             Id: 1765332859199
             Name: mysql_db_sync
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: FROM MYSQL('include_tables'='user_info','database'='test','driver_class'='com.mysql.cj.jdbc.Driver','driver_url'='mysql-connector-java-8.0.25.jar','offset'='initial','jdbc_url'='jdbc:mysql://127.0.0.1:3306','user'='root' ) TO DATABASE target_test_db ('table.create.properties.replication_num'='1')
       CreateTime: 2025-12-10 10:19:35
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: 
       Properties: \N
    CurrentOffset: {"ts_sec":"1765284495","file":"binlog.000002","pos":"9350","kind":"SPECIFIC","splitId":"binlog-split","row":"1","event":"2","server_id":"1"}
        EndOffset: \N
    LoadStatistic: {"scannedRows":24,"loadBytes":1146,"fileNumber":0,"fileSize":0}
         ErrorMsg: \N
```

주로 확인할 필드는 다음과 같습니다.

- `Status`: 작업의 전체 상태입니다(예: `RUNNING`).
- `CurrentOffset`: 현재 소비한 binlog 위치로, 동기화 진행 상황을 추적하는 데 유용합니다.
- `LoadStatistic`: 스캔한 행 수, 기록한 바이트 수 등의 데이터 적재 통계입니다.
- `ErrorMsg`: 오류 메시지로, 작업에 문제가 발생했을 때 문제를 해결하는 주요 근거가 됩니다.

### 3단계: 데이터 적재 작업 수정 {#step-3-modify-the-load-job}

계정 자격 증명 교체 등으로 데이터 소스 연결 정보를 업데이트해야 하는 경우 `ALTER JOB`을 사용합니다.

```sql
ALTER JOB <job_name>
FROM MYSQL (
    "user" = "root",
    "password" = "123456"
)
TO DATABASE target_test_db
```

일시 중지, 재개, 삭제, 태스크 조회 등의 일반적인 작업은 [지속적 데이터 적재 개요](./continuous-load-overview.md)를 참조하세요.

## 데이터 소스 매개변수 {#data-source-parameters}

<!-- Knowledge type: Configuration parameters -->

MySQL 소스(`FROM MYSQL`)는 다음 매개변수를 지원합니다. 연결 정보, 데이터베이스 이름, 드라이버 정보는 필수입니다.

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `jdbc_url` | 예 | - | MySQL JDBC 연결 문자열입니다. |
| `driver_url` | 예 | - | JDBC 드라이버 jar 경로입니다. 파일 이름, 로컬 절대 경로 또는 HTTP URL을 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요. |
| `driver_class` | 예 | - | JDBC 드라이버 클래스 이름입니다. 예: `com.mysql.cj.jdbc.Driver`. |
| `user` | 예 | - | 데이터베이스 사용자 이름입니다. |
| `password` | 예 | - | 데이터베이스 비밀번호입니다. |
| `database` | 예 | - | MySQL 데이터베이스 이름입니다. |
| `include_tables` | 아니요 | - | 동기화할 테이블 이름이며, 쉼표로 구분합니다. 설정하지 않으면 데이터베이스의 모든 테이블을 동기화합니다. |
| `exclude_tables` | 아니요 | - | 동기화하지 않을 테이블 이름이며, 쉼표로 구분합니다. 이 매개변수는 `include_tables`가 설정되지 않은 경우에만 적용됩니다. |
| `table.<table_name>.target_table` | 아니요 | 소스 테이블 이름 | 버전 4.1.0부터 지원합니다. 소스 테이블에 대응하는 Doris 대상 테이블 이름을 설정합니다. `<table_name>`은 소스 테이블 이름입니다. |
| `table.<table_name>.exclude_columns` | 아니요 | - | 버전 4.1.0부터 지원합니다. 동기화하지 않을 소스 컬럼을 쉼표로 구분하여 지정합니다. 해당 컬럼이 존재해야 하며, 기본 키 컬럼은 포함할 수 없습니다. |
| `offset` | 아니요 | `latest` | 시작 오프셋입니다. `initial`: 전체 및 증분 동기화, `earliest`: 사용 가능한 가장 이른 Binlog 오프셋부터 시작, `latest`: 작업 시작 이후의 변경 사항만 동기화합니다. `{"file":"binlog.000001","pos":"154"}` 또는 `{"gtids":"<gtid_set>"}`과 같이 정확한 JSON 오프셋을 지정할 수도 있습니다. 버전 4.1.0부터는 전체 동기화만 수행하는 `snapshot`도 지원합니다. |
| `snapshot_split_size` | 아니요 | `40960` (4.1.4 이전에는 `8096`) | split 크기이며, 행 수로 지정합니다. 전체 동기화 중 테이블은 여러 split으로 나뉩니다. 양의 정수여야 합니다. |
| `snapshot_parallelism` | 아니요 | `1` | 전체 동기화 단계의 병렬도, 즉 Task가 한 번에 스케줄링하는 최대 split 수입니다. 양의 정수여야 합니다. |
| `server_id` | 아니요 | 자동 생성 | 버전 4.1.0부터 지원합니다. MySQL CDC 리더의 Server ID입니다. `5400`과 같은 단일 값이나 `5400-5408`과 같은 닫힌 범위를 지원합니다. 범위의 크기는 `snapshot_parallelism` 이상이어야 합니다. |
| `ssl_mode` | 아니요 | `disable` | 버전 4.1.0부터 지원합니다. SSL 모드입니다. 유효한 값은 `disable`, `require`, `verify-ca`입니다. |
| `ssl_rootcert` | 조건부 필수 | - | 버전 4.1.0부터 지원합니다. `FILE:<file_name>` 형식의 CA 인증서 파일입니다. `ssl_mode`가 `verify-ca`인 경우 필수입니다. 먼저 [CREATE FILE](../../../../sql-manual/sql-statements/security/CREATE-FILE.md)을 사용하여 파일을 업로드하세요. |

`include_tables`와 `exclude_tables`가 모두 설정된 경우 `include_tables`가 우선합니다. 다음 `FROM MYSQL` 매개변수 예제는 `orders`와 `customers`를 동기화하고, `orders`를 `ods_orders`에 기록하며, 키가 아닌 컬럼 `internal_note`를 제외하고 CA 검증을 활성화합니다.

```sql
"include_tables" = "orders,customers",
"table.orders.target_table" = "ods_orders",
"table.orders.exclude_columns" = "internal_note",
"server_id" = "5400-5403",
"ssl_mode" = "verify-ca",
"ssl_rootcert" = "FILE:ca.pem"
```

## 참조 매뉴얼 {#reference-manual}

### 데이터 적재 구문 {#load-statement}

<!-- Knowledge type: Syntax reference -->

자동 테이블 생성 동기화 작업을 생성하는 구문은 다음과 같습니다.

```sql
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[ COMMENT <comment> ]
FROM MYSQL (
    [source_properties]
)
TO DATABASE <target_db> (
    [target_properties]
)
```

각 구성 요소에 대한 설명은 다음과 같습니다.

| 구성 요소            | 설명                                          |
| ----------------- | ---------------------------------------------------- |
| job_name          | 작업 이름                                             |
| job_properties    | 작업의 일반 데이터 적재 매개변수를 지정합니다  |
| comment           | 작업에 대한 설명을 작성합니다                |
| source_properties | MySQL 소스 관련 매개변수입니다               |
| target_properties | Doris 대상 데이터베이스 관련 매개변수입니다      |

`job_properties`는 `max_interval`과 `compute_group`을 지원합니다. 자세한 내용은 [작업 공통 데이터 적재 구성 매개변수](./continuous-load-overview.md#job-common-load-configuration-parameters)를 참조하세요. 자동 테이블 생성 모드에서는 `session.*`를 사용하지 않습니다.

### Doris 대상 데이터베이스 구성 매개변수 {#doris-target-database-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE`는 다음 선택적 매개변수를 지원합니다.

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris가 테이블을 생성할 때 테이블 속성을 추가합니다. 예: `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Stream Load 쓰기에 엄격 모드를 활성화할지 여부입니다. 유효한 값은 `true`와 `false`입니다. |
| `load.max_filter_ratio` | `0` | 샘플링 구간에서 허용되는 최대 필터링 비율이며, 범위는 `[0, 1]`입니다. `0`은 오류 행을 필터링할 수 없음을 의미합니다. 샘플링 구간은 `max_interval * 10`초입니다. 이 구간의 전체 행 수 대비 오류 행 수의 비율이 이 값을 초과하면 작업이 일시 중지됩니다. |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: 자동 테이블 생성 동기화는 기본 키가 없는 테이블도 지원하나요?**

아니요. 현재 자동 테이블 생성 동기화는 기본 키 테이블(Unique Key)만 지원합니다. 최초 동기화 시 Doris는 업스트림 기본 키를 기반으로 다운스트림 기본 키 테이블을 자동으로 생성합니다.

**Q2: 대상 테이블이 이미 있으면 덮어쓰나요?**

아니요. 자동 테이블 생성 단계에서 대상 테이블이 이미 있으면 생성을 건너뜁니다. 시나리오에 따라 테이블 스키마를 사용자 지정할 수 있습니다.

**Q3: 전체 초기화 없이 증분 데이터만 동기화하려면 어떻게 해야 하나요?**

`offset` 매개변수를 `latest`로 설정하세요. 작업은 전체 동기화 단계를 건너뛰고 최신 binlog 위치부터 바로 소비를 시작합니다.

**Q4: 자동 테이블 생성 동기화와 SQL 매핑 동기화 중 어떤 것을 선택해야 하나요?**

- 미러 복제, 자동 테이블 생성, 업스트림과의 테이블 스키마 일관성 유지가 필요하다면 자동 테이블 생성 동기화를 사용하세요.
- 대상 테이블 이름을 변경하거나 키가 아닌 컬럼을 제외하기만 하면 된다면 자동 테이블 생성 동기화를 사용하세요.
- SQL 표현식, 행 필터링 또는 데이터 변환이 필요하다면 [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)를 사용하세요.

**Q5: 단일 BE 배포 환경에서 테이블 생성에 실패하면 어떻게 해야 하나요?**

`TO DATABASE`에서 복제본 수를 1로 명시적으로 지정하세요: `"table.create.properties.replication_num" = "1"`.

## 관련 문서 {#related-documents}

- [지속적 데이터 적재 개요](./continuous-load-overview.md)
- [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
