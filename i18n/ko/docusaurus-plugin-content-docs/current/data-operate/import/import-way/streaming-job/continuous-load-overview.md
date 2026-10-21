---
{
    "title": "연속 데이터 적재 개요",
    "language": "ko",
    "sidebar_label": "개요",
    "description": "MySQL, PostgreSQL, OceanBase, S3를 비롯한 Doris Streaming Job의 데이터 소스와 동기화 모드, 일관성 보장 방식, 작업 상태, 공통 매개변수, 운영 명령을 살펴봅니다.",
    "keywords": [
        "Doris 연속 데이터 적재",
        "Streaming Job",
        "MySQL 실시간 동기화",
        "PostgreSQL 실시간 동기화",
        "OceanBase 실시간 동기화",
        "S3 연속 데이터 적재",
        "SQL 매핑 동기화",
        "자동 테이블 생성 동기화",
        "exactly-once",
        "at-least-once",
        "autoResume"
    ]
}
---

<!-- Knowledge type: Feature overview + architecture selection decision -->
<!-- Applicable scenarios: Real-time data ingestion selection / continuous load operations -->

Doris는 **Streaming Job**을 통해 여러 데이터 소스의 데이터를 Doris 테이블에 지속적으로 적재할 수 있습니다. 작업을 제출하면 Doris는 데이터 적재 작업을 계속 실행하면서 소스의 데이터를 실시간으로 읽어 Doris 테이블에 씁니다.

:::tip
이 기능은 버전 4.1.0부터 지원됩니다.
:::

이 문서에서는 다음 질문에 대한 답을 제공합니다.

- 연속 데이터 적재는 어떤 데이터 소스와 동기화 모드를 지원하나요?
- SQL 매핑 동기화와 자동 테이블 생성 동기화 중 어떤 방식을 선택해야 하나요?
- 작업 상태는 어떻게 전이되며, 자동 복구는 어떻게 작동하나요?
- 일상적인 운영에서 데이터 적재 작업을 조회, 일시 중지, 재개, 삭제하려면 어떻게 해야 하나요?
- 공통 FE 및 작업 구성 매개변수에는 어떤 것이 있나요?

## 지원되는 데이터 소스 및 동기화 모드 {#supported-data-sources-and-sync-modes}

연속 데이터 적재는 다음 데이터 소스와 동기화 모드를 지원합니다.

| 데이터 소스 | 지원 버전 | SQL 매핑 동기화                                                  | 자동 테이블 생성 동기화                                                | 구성 가이드                                                                                                                       |
| :---------- | :----------------- | :---------------------------------------------------------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| MySQL       | 5.6, 5.7, 8.0.x    | [SQL 매핑을 사용하는 MySQL CDC](./continuous-load-mysql-table.md)    | [자동 테이블 생성을 사용하는 MySQL CDC](./continuous-load-mysql-database.md) | [Amazon RDS MySQL](./prerequisites/amazon-rds-mysql.md) · [Amazon Aurora MySQL](./prerequisites/amazon-aurora-mysql.md)                   |
| PostgreSQL  | 14, 15, 16, 17     | [SQL 매핑을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-table.md) | [자동 테이블 생성을 사용하는 PostgreSQL CDC](./continuous-load-postgresql-database.md) | [Amazon RDS PostgreSQL](./prerequisites/amazon-rds-postgresql.md) · [Amazon Aurora PostgreSQL](./prerequisites/amazon-aurora-postgresql.md) |
| OceanBase   | MySQL 호환 모드 | -                                                           | [자동 테이블 생성을 사용하는 OceanBase CDC](./continuous-load-oceanbase-database.md) (버전 4.1.4부터) | -                                                                                                                                         |
| S3          | -                  | [S3 연속 데이터 적재](./continuous-load-s3.md)                     | -                                                                       | -                                                                                                                                         |

업스트림 열 유형이 Doris 유형에 매핑되는 방식은 [MySQL](./data-type-mapping-mysql.md), [PostgreSQL](./data-type-mapping-postgresql.md), [OceanBase](./data-type-mapping-oceanbase.md)의 데이터 유형 매핑을 참조하세요.

## 동기화 방식 선택 방법 {#how-to-choose-a-sync-method}

<!-- Knowledge type: Architecture selection decision -->

SQL 매핑 동기화와 자동 테이블 생성 동기화는 **기반 메커니즘이 완전히 다른** 두 가지 연속 데이터 적재 방식이며, 단순히 "테이블 수"만 다른 것이 아닙니다. **자동 테이블 생성 동기화도 `include_tables`를 통해 단일 테이블만 동기화할 수 있으므로**, 필요한 기능을 기준으로 선택해야 합니다.

### 기능 비교 {#capability-comparison}

| 기능         | SQL 매핑 동기화                                                | 자동 테이블 생성 동기화                           |
| :----------------- | :-------------------------------------------------------------- | :------------------------------------------------- |
| 기반 메커니즘 | 작업 + TVF (`INSERT INTO tbl SELECT * FROM tvf()`)             | 작업 + 네이티브 데이터베이스 전체 DDL (`FROM src TO DATABASE db`) |
| 대상 수준       | 기존 Doris 테이블                                         | Doris 데이터베이스 컨테이너                         |
| 동기화 범위         | 단일 테이블                                                  | 단일 테이블부터 여러 테이블, 전체 데이터베이스까지 (`include_tables`로 제어) |
| 자동 테이블 생성 | 테이블을 미리 생성해야 함                                | 최초 동기화 시 기본 키 테이블을 자동으로 생성 |
| SQL 유연성    | 열 매핑, 필터링, 변환 지원(SELECT 절) | 대상 테이블 이름 변경 및 키가 아닌 열 제외 지원. SQL 표현식, 행 필터링, 데이터 변환은 지원하지 않음 |
| 의미적 보장 | exactly-once                                                    | at-least-once                                      |
| 필요 권한 | Load                                                           | Load + Create (테이블을 자동으로 생성하는 경우) |
| 일반적인 사용 시나리오  | SQL 표현식, 유형 변환 또는 조건부 필터링이 필요한 실시간 동기화 | 전체 데이터베이스 또는 테이블 그룹의 미러 복제. 간단한 대상 테이블 이름 변경이나 열 제외 가능 |

### 선택 권장 사항 {#selection-recommendations}

- **데이터에 SQL 처리를 적용해야 하거나 exactly-once 보장이 엄격하게 필요한 경우** -> **SQL 매핑 동기화** 선택
- **Doris에서 테이블을 자동으로 생성하고 하나의 설정으로 테이블 그룹을 동기화하려는 경우** -> **자동 테이블 생성 동기화** 선택
- **데이터 소스가 OceanBase인 경우** -> 현재는 MySQL 호환 모드의 자동 테이블 생성 동기화만 지원
- **데이터 소스가 S3 객체 스토리지인 경우** -> SQL 매핑 동기화만 지원(S3 TVF 사용)

## 작업 상태 전이 {#job-state-transitions}

<!-- Knowledge type: Runtime mechanism -->

Streaming Job은 실행 중 다음 상태 사이를 전이합니다. **SQL 매핑 동기화와 자동 테이블 생성 동기화는 동일한 상태 머신을 따릅니다**.

![작업 상태 흐름](/images/next/data-operate/streaming-job/job-state-flow.jpg)

### 상태 설명 {#state-descriptions}

| 상태        | 의미                                                                                                                  |
| :----------- | :----------------------------------------------------------------------------------------------------------------------- |
| **PENDING**  | 작업이 생성되었지만 아직 하위 태스크가 스케줄링되지 않은 상태입니다. 다음 스케줄링 주기에 `StreamingTask`가 생성되기를 기다립니다. |
| **RUNNING**  | 하위 태스크가 생성되어 실행 중이며, 소스에서 증분 데이터를 읽어 Doris에 쓰고 있습니다.         |
| **FINISHED** | 소스의 모든 데이터를 처리하여 작업이 종료된 상태입니다. S3 TVF 작업은 모든 파일의 데이터 적재가 완료되면 이 상태로 전환됩니다. |
| **PAUSED**   | 하위 태스크가 실패하여 작업이 자동으로 일시 중지되고 `failReason`이 기록된 상태입니다. `ErrorMsg` 필드를 `select * from jobs(...)`로 조회하여 원인을 확인할 수 있습니다. |

### 자동 복구(autoResume) {#automatic-recovery-autoresume}

작업이 `PAUSED` 상태가 되면 스케줄러는 **지수 백오프 전략**을 사용하여 주기적으로 복구를 시도합니다. 복구되면 작업은 `PENDING` 상태로 돌아가 하위 태스크 생성을 계속합니다. **수동 개입은 필요하지 않습니다. 네트워크 지터, 일시적인 업스트림 사용 불가 등의 일시적 장애는 자동으로 처리됩니다.**

상황에 맞는 명령을 사용하세요.

- **즉시 재개하거나 문제 해결 후 수동으로 시작**: [`RESUME JOB`](#resume-a-load-job) 사용
- **완전히 중지하고 더 이상 스케줄링하지 않음**: [`PAUSE JOB`](#pause-a-load-job)(수동으로 일시 중지한 작업은 autoResume으로 다시 시작되지 않음) 또는 [`DROP JOB`](#delete-a-load-job) 사용

### CDC 태스크의 실행 계정 및 실패 처리 {#cdc-task-identity-and-failure-handling}

4.1.5부터 Streaming CDC는 고정된 관리자 계정 대신 작업 생성자의 Doris 계정으로 데이터 쓰기, 테이블 메타데이터 쿼리, 스키마 변경을 수행합니다. 생성자에게는 대상 테이블에 대한 `LOAD` 권한, 자동 테이블 생성에 필요한 `CREATE` 권한, 스키마 동기화에 필요한 해당 `ALTER` 권한과 테이블 조회 권한이 있어야 합니다. 실행 중에 권한을 취소하면 이후 태스크에도 영향을 줍니다. 작업에 기록된 생성자의 부여된 권한을 확인하세요.

`cdc_stream()`을 기반으로 하는 Streaming INSERT 태스크가 실패하면 일반적인 태스크 재시도 절차를 따르지 않습니다. `jobs()`와 `tasks()`에서 오류를 확인하고 소스 또는 권한 문제를 해결한 다음, 작업 상태에 따라 재개하세요. 실패한 태스크가 자동으로 재실행된다고 가정해서는 안 됩니다.

## 일반적인 운영 작업 {#common-operations}

<!-- Knowledge type: Operational steps -->

### 데이터 적재 상태 조회 {#view-load-status}

모든 Streaming 유형 Insert 작업을 쿼리합니다.

```sql
select * from jobs("type"="insert") where ExecuteType = "STREAMING";
```

결과 열:

| 열            | 설명                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| ID                | 작업 ID                                                                   |
| NAME              | 작업 이름                                                                 |
| Definer           | 작업 정의자                                                              |
| ExecuteType       | 작업 스케줄링 유형: *ONE_TIME/RECURRING/STREAMING/MANUAL*               |
| RecurringStrategy | 반복 실행 전략. 일반 Insert에서 사용하며, ExecuteType=Streaming인 경우 비어 있음 |
| Status            | 작업 상태                                                               |
| ExecuteSql        | 작업의 Insert SQL 문                                      |
| CreateTime        | 작업 생성 시간                                                        |
| SucceedTaskCount  | 성공한 태스크 수                                               |
| FailedTaskCount   | 실패한 태스크 수                                                   |
| CanceledTaskCount | 취소된 태스크 수                                                 |
| Comment           | 작업 설명                                                              |
| Properties        | 작업 속성                                                           |
| CurrentOffset     | 작업이 처리를 완료한 오프셋. ExecuteType=Streaming인 경우에만 설정됨 |
| EndOffset         | 데이터 소스에서 가져온 최대 EndOffset. ExecuteType=Streaming인 경우에만 설정됨 |
| LoadStatistic     | 작업 통계                                                           |
| ErrorMsg          | 작업 오류 메시지                                                 |
| JobRuntimeMsg     | 작업 실행 시 참고 정보                                                 |
| LagBytes          | 소스 로그(MySQL / OceanBase binlog 또는 PostgreSQL WAL)에 누적된 미처리 데이터의 바이트 수. `-1`은 현재 값을 사용할 수 없음을 의미하며, S3 데이터 소스를 사용하거나 전체 스냅샷 단계인 경우가 이에 해당함. **버전 4.1.4부터** 이 열은 기존의 `Lag` 열(초 단위)을 대체하며 바이트 단위로 보고됨 |
| LastSourceEventTimestamp | 커밋된 오프셋에 기록된 가장 최근 소스 이벤트의 타임스탬프(Unix 초 단위). 사용할 수 없으면 비어 있음. **버전 4.1.4에서 추가됨** |
| LastTaskSuccessTime | 가장 최근에 태스크가 성공적으로 완료된 시간                  |

### 태스크 상태 조회 {#view-task-status}

작업 ID로 해당 작업의 모든 하위 태스크를 쿼리합니다.

```sql
select * from tasks("type"="insert") where jobId='<job_id>';
```

결과 열:

| 열        | 설명                                                          |
| ------------- | -------------------------------------------------------------------- |
| TaskId        | 태스크 ID                                                              |
| JobID         | JobID                                                                |
| JobName       | 작업 이름                                                             |
| Label         | 태스크가 데이터 적재에 사용하는 레이블                               |
| Status        | 태스크 상태                                                          |
| ErrorMsg      | 태스크 실패 메시지                                                 |
| CreateTime    | 태스크 생성 시간                                                   |
| StartTime     | 태스크 시작 시간                                                      |
| FinishTime    | 태스크 완료 시간                                                     |
| LoadStatistic | 태스크 통계                                                      |
| User          | 태스크 실행자                                                        |
| RunningOffset | 태스크가 현재 동기화 중인 오프셋 정보. Job.ExecuteType=Streaming인 경우에만 설정됨 |

### 데이터 적재 작업 일시 중지 {#pause-a-load-job}

지정한 작업을 수동으로 일시 중지합니다(일시 중지한 작업은 autoResume으로 다시 시작되지 않음).

```sql
PAUSE JOB WHERE jobname = <job_name>;
```

### 데이터 적재 작업 재개 {#resume-a-load-job}

`PAUSED` 상태의 작업을 재개합니다.

```sql
RESUME JOB WHERE jobName = <job_name>;
```

### 데이터 적재 작업 삭제 {#delete-a-load-job}

지정한 작업을 영구적으로 삭제합니다. 삭제한 작업은 더 이상 스케줄링되지 않습니다.

```sql
DROP JOB WHERE jobName = <job_name>;
```

## 공통 매개변수 {#common-parameters}

<!-- Knowledge type: Configuration parameters -->

### FE 구성 매개변수 {#fe-configuration-parameters}

| 매개변수                            | 기본값 | 설명                                       |
| ------------------------------------ | ------- | ------------------------------------------------- |
| max_streaming_job_num                | 1024    | Streaming 작업의 최대 수                  |
| job_streaming_task_exec_thread_num   | 10      | StreamingTask 실행에 사용하는 스레드 수   |
| max_streaming_task_show_count        | 100    | 메모리에 유지하는 StreamingTask 실행 기록의 최대 수 |

### 작업의 공통 데이터 적재 구성 매개변수 {#job-common-load-configuration-parameters}

다음 매개변수는 `CREATE JOB ... PROPERTIES (...)`를 통해 구성합니다. 별도로 명시하지 않는 한 MySQL, PostgreSQL, OceanBase 연속 데이터 적재 작업에서 사용할 수 있습니다.

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `max_interval` | `10` | 업스트림에 새로운 데이터가 없을 때의 유휴 스케줄링 간격(초 단위). 1 이상의 정수만 허용되며, `10s`와 같은 단위 접미사는 지원하지 않습니다. |
| `compute_group` | 현재 세션 또는 사용자의 기본 컴퓨팅 그룹 | 컴퓨팅과 스토리지가 분리된 모드에서만 지원됩니다. 작업을 실행할 컴퓨팅 그룹을 지정합니다. 명시적으로 구성한 값은 비어 있을 수 없으며, 사용자에게 해당 컴퓨팅 그룹에 대한 USAGE 권한이 있어야 합니다. 이 매개변수를 설정하지 않았고 현재 세션과 사용자 모두 사용 가능한 기본 컴퓨팅 그룹이 없으면 작업 생성이 실패합니다. |
| `session.<variable_name>` | 해당 세션 변수의 기본값 | TVF 모드에서만 지원됩니다. 작업의 INSERT 태스크에 사용할 세션 변수를 설정합니다. 예를 들어 `session.insert_max_filter_ratio`를 설정할 수 있습니다. 변수 이름과 값은 유효한 Doris 세션 변수여야 합니다. |

작업 속성으로 사용하는 `offset`은 CDC 작업의 시작 위치를 설정하지 않습니다. 작업을 생성할 때 `FROM MYSQL`, `FROM POSTGRES`, `FROM OCEANBASE` 또는 `cdc_stream(...)`의 소스 매개변수에서 시작 위치를 설정하세요. CDC 작업을 일시 중지한 후에는 `ALTER JOB ... PROPERTIES ("offset" = '<json_offset>')`를 통해 위치를 재설정할 수 있습니다. MySQL과 OceanBase는 `{"file":"binlog.000001","pos":"154"}`를 사용하고, PostgreSQL은 `{"lsn":"12345678"}`를 사용합니다. `ALTER JOB`은 정확한 JSON 오프셋만 허용합니다.

## 제한 사항 {#limitations}

<!-- Knowledge type: Limitations / unsupported boundaries -->

동기화 범위, 자동 테이블 생성, 의미적 보장(exactly-once / at-least-once)은 [기능 비교](#capability-comparison)에 설명되어 있습니다. 이 섹션에서는 제약 사항과 **지원하지 않는** 동작만 나열합니다.

### 기본 키 테이블 {#primary-key-tables}

두 동기화 방식 모두 **기본 키가 있는** 업스트림 테이블만 동기화할 수 있습니다. 이에 대응하는 Doris 테이블은 **Unique Key** 테이블입니다. 자동 테이블 생성 동기화에서는 이 유형으로 자동 생성되며, SQL 매핑 동기화에서는 사용자가 직접 생성해야 합니다. 기본 키가 없는 테이블은 지원하지 않습니다.

### 스키마 변경(DDL) {#schema-change-ddl}

DDL 동기화는 **[자동 테이블 생성 동기화 방식](#capability-comparison)에만 적용됩니다**. [SQL 매핑 동기화 방식](#capability-comparison)은 어떠한 DDL도 동기화하지 않으며, `cdc_stream()` 테이블 함수는 항상 `schema_change_enabled`를 `false`로 강제 설정합니다.

- **MySQL, PostgreSQL, OceanBase**: `ADD COLUMN`과 `DROP COLUMN`만 동기화됩니다. **열 유형 변경, `RENAME COLUMN`, 기본 키 / 제약 조건 / 인덱스 / 파티션 변경은 동기화되지 않습니다**. 이러한 변경은 Doris에서 수동으로 적용하세요. 소스별 동작과 제한 사항은 [MySQL](./schema-change-mysql.md), [PostgreSQL](./schema-change-postgresql.md), [OceanBase](./schema-change-oceanbase.md)의 스키마 변경 동기화를 참조하세요.

자동 테이블 생성 동기화는 기본적으로 스키마 변경 동기화를 활성화합니다. 현재 Doris는 이를 비활성화하는 SQL 속성을 제공하지 않습니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ / troubleshooting -->

### MySQL 연결 오류: Public Key Retrieval is not allowed {#mysql-connection-error-public-key-retrieval-is-not-allowed}

**원인:** 구성된 MySQL 사용자가 SHA256 비밀번호 인증을 사용하며, 이 인증 방식은 TLS와 같은 프로토콜을 통해 비밀번호를 전송해야 합니다.

**해결 방법 1:** JDBC URL에 `allowPublicKeyRetrieval=true` 매개변수를 추가하세요.

```text
jdbc:mysql://127.0.0.1:3306?allowPublicKeyRetrieval=true
```

**해결 방법 2:** MySQL 사용자의 인증 방식을 `mysql_native_password`로 변경하세요.

```sql
ALTER USER 'username'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```
