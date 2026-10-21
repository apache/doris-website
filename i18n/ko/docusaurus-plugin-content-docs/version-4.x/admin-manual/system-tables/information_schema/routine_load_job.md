---
{
    "title": "routine_load_job",
    "language": "ko",
    "description": "Routine Load 작업 정보를 조회하는 데 사용됩니다."
}
---

## 개요 {#overview}

Routine Load 작업 정보를 조회하는 데 사용됩니다.

## 데이터베이스 및 테이블 {#database-and-table}

`information_schema.routine_load_jobs`

## 테이블 정보 {#table-information}

| 열 이름                  | 타입    | 설명                                                                                                                                                    | 예시 |
| :----------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :------ |
| JOB_ID                   | text    | Doris가 생성한 작업 ID.                                                                                                                                 | `12025` |
| JOB_NAME                 | text    | Routine Load 작업 이름.                                                                                                                                 | `example_routine_load` |
| CREATE_TIME              | text    | 작업 생성 시간.                                                                                                                                         | `2024-01-15 08:12:42` |
| PAUSE_TIME               | text    | 작업이 가장 최근에 일시 중지된 시간. 작업이 일시 중지된 적이 없으면 `NULL`입니다.                                                                         | `NULL` |
| END_TIME                 | text    | 작업 종료 시간. 작업이 종료되지 않았으면 `NULL`입니다.                                                                                                   | `NULL` |
| DB_NAME                  | text    | 작업이 속한 데이터베이스 이름.                                                                                                                          | `default_cluster:testdb` |
| TABLE_NAME               | text    | 작업의 대상 테이블 이름. 여러 테이블에 데이터를 적재하는 작업의 경우 이 값은 `multi-table`입니다.                                                         | `test_routineload_tbl` |
| STATE                    | text    | 작업 실행 상태. `NEED_SCHEDULE`, `RUNNING`, `PAUSED`, `STOPPED`, `CANCELLED`가 포함됩니다.                                                                  | `RUNNING` |
| CURRENT_TASK_NUM         | text    | 현재 스케줄링 중이거나 실행 중인 하위 작업 수.                                                                                                            | `1` |
| JOB_PROPERTIES           | text    | 배치 크기, 동시 실행 수, 데이터 적재 형식, 열 매핑 및 오류 허용 범위 등 작업 속성 설정.                                                                    | `{"max_batch_rows":"200000","format":"csv","columnToColumnExpr":"user_id,name,age","max_filter_ratio":"1.0"}` |
| DATA_SOURCE_PROPERTIES   | text    | 데이터 소스 속성 설정. Kafka의 경우 토픽, 브로커 목록 및 현재 Kafka 파티션이 포함됩니다.                                                                   | `{"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}` |
| CUSTOM_PROPERTIES        | text    | 작업 생성 시 설정한 사용자 지정 속성. Kafka의 경우 일반적으로 오프셋, 그룹 ID 및 `property.` 접두사로 전달되는 Kafka 클라이언트 매개변수가 포함됩니다. 버전 4.0.8부터 민감한 속성은 `******`로 표시됩니다 | `{"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}` |
| STATISTIC                | text    | 작업 런타임 통계. 주요 필드로는 `receivedBytes`, `loadedRows`, `errorRows`, `committedTaskNum`, `abortedTaskNum`, `loadRowsRate` 및 `taskExecuteTimeMs`가 있습니다. | `{"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}` |
| PROGRESS                 | text    | 작업 진행 상황. Kafka의 경우 각 파티션에서 소비한 오프셋을 표시합니다.                                                                                   | `{"0":"2"}` |
| LAG                      | text    | 작업 지연 정보. Kafka의 경우 각 파티션의 소비 지연을 표시합니다.                                                                                         | `{"0":0}` |
| REASON_OF_STATE_CHANGED  | text    | 작업 상태가 변경된 이유. 정상적으로 실행 중인 작업에서는 일반적으로 비어 있으며, 작업이 비정상적으로 일시 중지되거나 취소되면 구체적인 이유를 기록합니다. | `The number of failed task exceeded max_error_number` |
| ERROR_LOG_URLS           | text    | 품질 검사를 통과하지 못해 필터링된 데이터를 확인할 수 있는 오류 로그 URL. 오류 로그가 없으면 비어 있습니다.                                               | `http://fe_host:8030/api/_load_error_log?file=error.log` |
| USER_NAME                | text    | 작업을 생성하거나 조작한 사용자.                                                                                                                        | `root` |
| CURRENT_ABORT_TASK_NUM   | int     | 현재 실패한 하위 작업 수.                                                                                                                               | `0` |
| IS_ABNORMAL_PAUSE        | boolean | 사용자가 수동으로 일시 중지한 것이 아니라 시스템이 비정상적으로 작업을 일시 중지했는지 여부. `true`는 시스템에 의한 비정상 일시 중지를 나타내고, `false`는 비정상 일시 중지가 없음을 나타냅니다. | `false` |
| COMPUTE_GROUP            | text    | 작업이 실행되는 컴퓨트 그룹. | `default_compute_group` |
| FIRST_ERROR_MSG          | text    | 작업에서 처음 발생한 오류 메시지로, 근본 원인을 찾는 데 유용합니다. 오류가 없으면 비어 있습니다. | `too many filtered rows` |

## 데이터 소스 및 완전성 {#data-source-and-completeness}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Multi-FE cluster troubleshooting / Empty error messages -->

`FIRST_ERROR_MSG`와 `ERROR_LOG_URLS`는 master FE의 메모리에서만 유지되는 일시적인 런타임 필드입니다. Follower FE는 메타데이터를 재생할 때 이 필드의 값을 채우지 않습니다.

:::caution 동작 변경 (4.0.8)

버전 4.0.8부터 `information_schema.routine_load_jobs` 스캔은 master FE로 라우팅되므로, 어느 FE에서 쿼리하더라도 완전한 `FIRST_ERROR_MSG`와 `ERROR_LOG_URLS` 값이 반환됩니다.

4.0.8 이전에는 쿼리를 수신한 FE가 이 테이블의 데이터를 제공했으므로, master가 아닌 FE에서는 이 두 열이 빈 값으로 반환되어 `SHOW ROUTINE LOAD`의 결과와 일치하지 않았습니다(이 명령은 master FE로 전달됩니다).

이 라우팅은 세션 변수 `enable_schema_scan_from_master_fe`로 제어되며, 기본값은 `true`입니다.

:::

## 비정상 작업 조회 {#query-abnormal-jobs}

작업이 비정상적으로 일시 중지되었거나 실패한 하위 작업이 있는 경우, 또는 `RUNNING` 상태이지만 실행 중인 하위 작업이 없고 Kafka에 소비 지연이 남아 있는 경우에는 원인을 조사해야 합니다. 다음 SQL로 이러한 작업을 조회할 수 있습니다:

```sql
SELECT DB_NAME, JOB_NAME
FROM information_schema.routine_load_jobs
WHERE IS_ABNORMAL_PAUSE = TRUE
   OR (
        STATE = 'RUNNING'
        AND (
             CURRENT_ABORT_TASK_NUM > 0
             OR (
                  CAST(CURRENT_TASK_NUM AS INT) = 0
                  AND `LAG` REGEXP ':[[:space:]]*[1-9][0-9]*'
             )
        )
   );
```

비정상 작업을 찾은 후에는 해당 데이터베이스로 전환하고 `SHOW ROUTINE LOAD`를 사용하여 작업 세부 정보를 확인합니다:

```sql
USE `db_name`;
SHOW ROUTINE LOAD FOR `job_name`;
```

`LAG`는 각 파티션의 Kafka 소비 지연 정보입니다. `LAG REGEXP ':[[:space:]]*[1-9][0-9]*'`는 하나 이상의 파티션에서 지연이 0보다 큰 작업과 일치합니다.
