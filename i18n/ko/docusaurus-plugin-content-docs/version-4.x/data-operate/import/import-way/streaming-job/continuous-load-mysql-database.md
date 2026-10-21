---
{
    "title": "테이블 자동 생성을 지원하는 MySQL CDC",
    "language": "ko",
    "sidebar_label": "테이블 자동 생성 동기화",
    "description": "Streaming Job을 사용하여 MySQL 데이터베이스의 전체 및 증분 데이터를 Doris로 지속적으로 동기화하며, 첫 동기화 시 테이블을 자동으로 생성합니다.",
    "keywords": [
        "MySQL 테이블 자동 생성 동기화",
        "MySQL 전체 데이터베이스 동기화",
        "Doris Streaming Job",
        "Flink CDC",
        "MySQL CDC 실시간 동기화",
        "지속적 데이터 적재",
        "전체 및 증분 동기화",
        "테이블 자동 생성"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Mirror sync of a whole MySQL database to Doris -->

테이블 자동 생성 동기화는 기본 제공 `FROM MYSQL (...) TO DATABASE (...)` DDL로 구현됩니다. **대상은 Doris 데이터베이스 컨테이너이며, Doris가 다운스트림 테이블을 자동으로 생성합니다.** `include_tables`를 사용하여 단일 테이블, 여러 테이블 또는 모든 테이블의 동기화 여부를 제어할 수 있습니다. 첫 동기화 시 Doris는 다운스트림에 기본 키 테이블을 자동으로 생성하고 기본 키를 업스트림과 동일하게 유지합니다. SQL 처리가 필요하지 않고 다운스트림 테이블 스키마가 업스트림을 자동으로 따라야 하는 미러 복제 시나리오에 적합합니다.

Doris는 [Flink CDC](https://github.com/apache/flink-cdc) 기능을 통합하여 MySQL에서 변경 로그를 읽고, 여러 테이블의 전체 및 증분 데이터를 Stream Load를 통해 Doris에 지속적으로 기록합니다. 동기화 중에 열 매핑, 필터링 또는 데이터 변환이 필요한 경우 [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)를 참조하세요.

### 적용 시나리오 {#applicable-scenarios}

- MySQL의 여러 테이블 또는 전체 데이터베이스를 Doris로 미러링해야 합니다.
- 테이블을 수동으로 생성하지 않고 업스트림을 기준으로 다운스트림 테이블 스키마와 기본 키를 자동으로 생성하려고 합니다.
- 동기화 중에 열 매핑, 필터링 또는 데이터 변환이 필요하지 않습니다.
- 초기 전체 데이터 초기화와 지속적인 증분 변경 수신을 모두 지원해야 합니다.

### 기능 및 제한 사항 {#capabilities-and-limitations}

| 항목                  | 설명                                                          |
| --------------------- | -------------------------------------------------------------------- |
| 일관성 의미론 | 현재 at-least-once 의미론만 보장됩니다                |
| 테이블 유형            | 기본 키 테이블(Unique Key)만 동기화할 수 있습니다          |
| 권한            | Load 권한이 필요하며, 다운스트림 테이블이 없으면 Create 권한도 필요합니다 |
| 테이블 자동 생성   | 대상 테이블이 이미 있으면 생성을 건너뜁니다. 필요에 따라 테이블 스키마를 사용자 지정할 수 있습니다 |
| 데이터 처리       | 열 매핑, 필터링 및 변환은 지원하지 않습니다. 필요한 경우 SQL 매핑 동기화를 사용하세요 |

## 사전 요구 사항 {#prerequisites}

테이블 자동 생성 동기화 작업을 생성하기 전에 다음 사항을 확인하세요.

1. Doris 클러스터가 배포되어 있고 Load 권한이 있어야 합니다. 테이블 자동 생성 시나리오에서는 Create 권한도 필요합니다.
2. MySQL 버전과 호환되는 JDBC 드라이버 jar가 업로드되어 있고, 파일 이름, 로컬 절대 경로 또는 HTTP 주소로 참조할 수 있어야 합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요.
3. MySQL에서 binlog가 활성화되어 있고, 계정에 binlog를 읽을 권한이 있어야 합니다.
4. 전체 데이터베이스를 동기화할지, `include_tables`에 지정한 테이블만 동기화할지 동기화 범위가 명확해야 합니다.

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
- `offset = "initial"`은 먼저 전체 데이터를 초기화한 다음 증분 동기화로 전환한다는 의미입니다. 증분 데이터만 동기화하려면 `latest`로 변경하세요.
- `TO DATABASE target_test_db`는 다운스트림 Doris 데이터베이스를 지정합니다. `table.create.properties.*`를 사용하여 자동으로 생성되는 테이블의 속성(예: 복제본 수)을 제어합니다.

### 2단계: 데이터 적재 상태 확인 {#step-2-check-load-status}

`jobs("type"="insert")` 테이블 함수를 통해 Streaming Job의 실행 상태를 쿼리합니다.

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

주요 확인 필드는 다음과 같습니다.

- `Status`: 작업의 전체 상태입니다(예: `RUNNING`).
- `CurrentOffset`: 현재까지 소비한 binlog 위치로, 동기화 진행 상황을 추적하는 데 유용합니다.
- `LoadStatistic`: 스캔한 행 수와 기록한 바이트 수 등의 데이터 적재 통계입니다.
- `ErrorMsg`: 오류 메시지로, 작업에 문제가 있을 때 문제 해결의 주요 근거가 됩니다.

### 3단계: 데이터 적재 작업 수정 {#step-3-modify-the-load-job}

데이터 소스 연결 정보를 업데이트해야 하는 경우(예: 계정 자격 증명 교체) `ALTER JOB`을 사용합니다.

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

MySQL 소스 측(`FROM MYSQL`)은 다음 매개변수를 지원합니다.

| 매개변수            | 기본값 | 설명                                                                                                          |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| jdbc_url             | -       | MySQL JDBC 연결 문자열                                                                                         |
| driver_url           | -       | JDBC 드라이버 jar의 경로입니다. 파일 이름, 로컬 절대 경로 및 HTTP 주소를 지원합니다. 자세한 내용은 [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)를 참조하세요 |
| driver_class         | -       | JDBC 드라이버 클래스 이름                                                                                               |
| user                 | -       | 데이터베이스 사용자 이름                                                                                                   |
| password             | -       | 데이터베이스 비밀번호                                                                                                    |
| database             | -       | 데이터베이스 이름                                                                                                        |
| include_tables       | -       | 동기화할 테이블 이름이며 쉼표로 구분합니다. 비워 두면 기본적으로 모든 테이블을 동기화합니다                        |
| offset               | latest  | `latest`: 증분 동기화만 수행, `initial`: 전체 + 증분 동기화                                                  |
| snapshot_split_size  | 40960 (4.1.4 이전에는 8096)    | 분할 크기(행 단위)입니다. 전체 동기화 중에는 테이블을 여러 분할로 나누어 동기화합니다                        |
| snapshot_parallelism | 1       | 전체 동기화 단계의 병렬 처리 수입니다. 즉, 단일 Task가 한 번에 스케줄링할 수 있는 최대 분할 수입니다   |

## 참조 매뉴얼 {#reference-manual}

### 데이터 적재 구문 {#load-statement}

<!-- Knowledge type: Syntax reference -->

테이블 자동 생성 동기화 작업을 생성하는 구문은 다음과 같습니다.

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
| comment           | 주석으로 작업을 설명합니다                |
| source_properties | MySQL 소스 관련 매개변수               |
| target_properties | Doris 대상 데이터베이스 관련 매개변수      |

### Doris 대상 데이터베이스 구성 매개변수 {#doris-target-database-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

`TO DATABASE`는 다음 매개변수를 지원합니다.

| 매개변수                 | 기본값 | 설명                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| table.create.properties.* | -       | 테이블 생성 시 `replication_num` 등의 테이블 속성을 지정합니다                                                                                                                                                                                                                                                              |
| load.strict_mode          | -       | 엄격 모드 활성화 여부입니다. 기본적으로 비활성화됩니다                                                                                                                                                                                                                                                                                     |
| load.max_filter_ratio     | -       | 샘플링 구간 내에서 허용되는 최대 필터링 비율입니다. 0 이상 1 이하여야 합니다. 기본값은 0이며, 오류를 허용하지 않습니다. 샘플링 구간은 `max_interval * 10`입니다. 샘플링 구간 내 전체 행 대비 오류 행의 비율이 `load.max_filter_ratio`를 초과하면 루틴 작업이 일시 중지되며, 데이터 품질 문제를 확인하기 위해 수동 개입이 필요합니다. |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**질문 1: 테이블 자동 생성 동기화는 기본 키가 없는 테이블을 지원하나요?**

아니요. 현재 테이블 자동 생성 동기화는 기본 키 테이블(Unique Key)만 지원합니다. 첫 동기화 시 Doris는 업스트림 기본 키를 기준으로 다운스트림 기본 키 테이블을 자동으로 생성합니다.

**질문 2: 대상 테이블이 이미 있으면 덮어쓰나요?**

아니요. 테이블 자동 생성 단계에서 대상 테이블이 이미 있으면 생성을 건너뜁니다. 시나리오에 따라 테이블 스키마를 사용자 지정할 수 있습니다.

**질문 3: 전체 데이터 초기화 없이 증분 데이터만 동기화하려면 어떻게 하나요?**

`offset` 매개변수를 `latest`로 설정하세요. 작업은 전체 동기화 단계를 건너뛰고 최신 binlog 위치부터 바로 소비를 시작합니다.

**질문 4: 테이블 자동 생성 동기화와 SQL 매핑 동기화 중 어떤 것을 선택해야 하나요?**

- 미러 복제, 테이블 자동 생성 및 업스트림과 동일한 테이블 스키마 유지가 필요한 경우 테이블 자동 생성 동기화를 사용하세요.
- 열 매핑, 필터링 또는 데이터 변환이 필요한 경우 [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)를 사용하세요.

**질문 5: 단일 BE 배포 환경에서 테이블 생성에 실패하면 어떻게 해야 하나요?**

`TO DATABASE`에서 복제본 수를 1로 명시적으로 지정하세요. `"table.create.properties.replication_num" = "1"`.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 증상                                  | 가능한 원인                                              | 진단 및 해결 방법                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 권한 오류로 작업 생성 실패 | 현재 사용자에게 Load 또는 Create 권한이 없음            | 작업을 실행하는 계정에 Load 권한을 부여하세요. 테이블 자동 생성에는 Create 권한도 필요합니다         |
| 전체 동기화가 느림                           | `snapshot_parallelism`이 너무 작거나 분할이 너무 큼 | `snapshot_parallelism`을 적절히 늘리고, 테이블의 행 수에 따라 `snapshot_split_size`를 조정하세요 |
| 데이터 품질 문제로 작업이 일시 중지됨 | 오류 행 비율이 `load.max_filter_ratio`를 초과함         | `ErrorMsg` 필드를 확인하여 잘못된 데이터를 찾고, `load.strict_mode` 또는 `load.max_filter_ratio`를 조정하세요               |
| 테이블 자동 생성 중 복제본 수 오류 발생 | 단일 BE 배포 환경이지만 기본 복제본 수가 3임 | `table.create.properties.replication_num = 1`로 설정하세요                                                                    |
| 증분 데이터가 Doris에 도달하지 않음    | MySQL binlog가 활성화되지 않았거나 계정에 binlog 권한이 없음 | MySQL 측에서 binlog를 활성화하고 동기화 계정에 `REPLICATION SLAVE` 및 `REPLICATION CLIENT` 권한을 부여하세요 |

## 관련 문서 {#related-documents}

- [지속적 데이터 적재 개요](./continuous-load-overview.md)
- [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
- [JDBC Catalog 개요](../../../../lakehouse/catalogs/jdbc-catalog-overview.md)
- [Flink CDC](https://github.com/apache/flink-cdc)
