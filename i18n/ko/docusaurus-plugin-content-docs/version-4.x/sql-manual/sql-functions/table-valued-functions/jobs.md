---
{
    "title": "JOBS",
    "language": "ko",
    "description": "특정 작업 유형의 작업 정보를 조회할 수 있는 임시 태스크 테이블을 생성하는 테이블 함수입니다."
}
---

## 설명 {#description}

특정 작업 유형의 작업 정보를 조회할 수 있는 임시 태스크 테이블을 생성하는 테이블 함수입니다.

## 구문 {#syntax}

```sql
JOBS(
    "type"="<type>"
)
```

## 매개변수 {#parameters}
| 매개변수     | 설명                                                                                   |
|---------------|-----------------------------------------------------------------------------------------------|
| **`<type>`**  | 작업 유형: <br/> `insert`: Insert into 유형 작업. <br/> `mv`: 구체화된 뷰 작업. |



## 반환 값 {#return-value}

이 테이블 함수는 행을 반환하지 않거나 하나 이상의 행을 반환합니다. 함수 자체는 NULL을 반환하지 않습니다. 해당 메타데이터를 사용할 수 없는 경우 개별 필드는 비어 있거나 `NULL`일 수 있습니다.

-  **`jobs("type"="insert")`** insert 유형 작업의 반환 값

    | 매개변수     | 설명                |
    |--------------------|----------------------------|
    | Id                 | 작업 ID                     |
    | Name               | 작업 이름                   |
    | Definer            | 작업 정의자                |
    | ExecuteType        | 실행 유형             |
    | RecurringStrategy  | 반복 실행 전략         |
    | Status             | 작업 상태                 |
    | ExecuteSql         | 실행 SQL              |
    | CreateTime         | 작업 생성 시간          |
    | SucceedTaskCount   | 성공한 태스크 수 |
    | FailedTaskCount    | 실패한 태스크 수     |
    | CanceledTaskCount  | 취소된 태스크 수   |
    | Comment            | 작업 설명                |
    | Properties         | 작업 속성. `ExecuteType = STREAMING`인 작업에만 값이 있습니다 |
    | CurrentOffset      | 작업이 처리를 완료한 오프셋. `ExecuteType = STREAMING`인 작업에만 값이 있습니다 |
    | EndOffset          | 작업이 데이터 소스에서 가져온 가장 큰 오프셋. `ExecuteType = STREAMING`인 작업에만 값이 있습니다 |
    | LoadStatistic      | 작업의 데이터 적재 통계 |
    | ErrorMsg           | 작업 실행 오류 메시지 |
    | JobRuntimeMsg      | 작업의 런타임 메시지 |
    | LagBytes           | 소스 측 로그(MySQL binlog 또는 PostgreSQL WAL 등)의 누적 데이터 크기(바이트). `-1`은 현재 이 값을 사용할 수 없음을 의미하며, 예를 들어 S3 데이터 소스를 사용하거나 전체 스냅샷 단계에 있는 경우가 이에 해당합니다.<br/>**4.1.4부터** 이 열의 이름이 `Lag`(초 단위)에서 `LagBytes`(바이트 단위)로 변경되었습니다 |
    | LastSourceEventTimestamp | 작업이 커밋한 오프셋에 기록된 가장 최근 소스 측 이벤트의 타임스탬프(Unix 초). 비어 있으면 사용할 수 없음을 의미합니다. **4.1.4에서 추가됨** |
    | LastTaskSuccessTime | 태스크가 마지막으로 성공적으로 완료된 시간 |


- **`jobs("type"="mv")`** MV 유형 작업의 반환 값

    | 매개변수     | 설명                                                 |
    |----------------------|-------------------------------------------------------------|
    | Id                   | 작업 ID. MV 작업의 경우 `tasks("type"="mv").JobId`에 해당합니다. |
    | Name                 | 작업 이름. MV 작업의 경우 `mv_infos("database"="...").JobName` 및 `tasks("type"="mv").JobName`에 해당합니다. |
    | MvId                 | 이 작업이 유지 관리하는 구체화된 뷰의 ID. |
    | MvName               | 이 작업이 유지 관리하는 구체화된 뷰의 이름. |
    | MvDatabaseId         | 구체화된 뷰가 속한 데이터베이스의 ID. |
    | MvDatabaseName       | 구체화된 뷰가 속한 데이터베이스의 이름. |
    | ExecuteType          | 작업 실행 유형. MV 작업에서 가능한 값은 `MANUAL`과 `RECURRING`입니다. `MANUAL`은 새로 고침 태스크가 수동으로, 커밋에 의해 또는 내부 이벤트에 의해 트리거됨을 의미합니다. `RECURRING`은 새로 고침 태스크가 주기적으로 예약됨을 의미합니다. |
    | RecurringStrategy    | `ExecuteType`에서 파생된 스케줄링 설명. `MANUAL TRIGGER`는 작업이 타이머에 따라 실행되지 않음을 의미합니다. `EVERY ... STARTS ... [ENDS ...]`는 작업이 주기적으로 실행됨을 의미합니다. |
    | Status               | 작업 상태. 가능한 값: `PENDING`은 작업이 스케줄링을 기다리고 있음을 의미합니다. `RUNNING`은 작업이 태스크를 생성할 수 있음을 의미합니다. `PAUSED`는 작업이 일시 중지되었으며 재개할 수 있음을 의미합니다. `STOPPED`는 작업이 중지되었으며 재개할 수 없음을 의미합니다. `FINISHED`는 작업이 완료되었음을 의미합니다. |
    | CreateTime           | 작업이 생성된 시간. |

### MV 작업의 열거형 필드 {#mv-job-enum-fields}

다음 열거형 필드는 구체화된 뷰 새로 고침 작업을 확인할 때 자주 사용됩니다.

- `ExecuteType`: 작업이 새로 고침 태스크를 생성하는 방식입니다.
  - `MANUAL`: 작업이 자체 타이머에 따라 실행되지 않습니다. 새로 고침이 수동으로, 커밋에 의해 또는 시스템에 의해 트리거될 때만 태스크가 생성됩니다.
  - `RECURRING`: 작업이 일정에 따라 실행되며 주기적으로 새로 고침 태스크를 생성합니다.
- `RecurringStrategy`: `ExecuteType`에서 생성된 스케줄링 규칙을 읽기 쉬운 형태로 나타냅니다.
  - `MANUAL TRIGGER`: 작업이 주기적으로 예약되지 않습니다. 일반적으로 `ExecuteType`이 `MANUAL`일 때 이 값이 표시됩니다.
  - `EVERY <interval> <unit> STARTS <time> [ENDS <time>]`: 작업이 주기적으로 예약됩니다. 예: `EVERY 10 MINUTE STARTS 2025-01-17 14:42:53`.
- `Status`: 작업 자체의 현재 상태입니다.
  - `PENDING`: 작업이 스케줄링을 기다리고 있습니다.
  - `RUNNING`: 작업이 활성 상태이며 새로 고침 태스크를 생성할 수 있습니다.
  - `PAUSED`: 작업이 일시 중지되었습니다. 재개될 때까지 새 새로 고침 태스크를 생성하지 않습니다.
  - `STOPPED`: 작업이 중지되었으며 재개할 수 없습니다.
  - `FINISHED`: 작업이 완료되었습니다. 장기간 유지되는 MV 새로 고침 작업에서는 드문 상태이지만, 범용 작업 프레임워크에서는 나타날 수 있습니다.

구체화된 뷰 하나에는 새로 고침 작업 하나가 있으며, 새로 고침 작업 하나는 여러 새로 고침 태스크를 생성할 수 있습니다. `jobs("type"="mv").Name`을 사용하여 작업을 `mv_infos("database"="...").JobName` 및 `tasks("type"="mv").JobName`과 연결합니다.


## 예제 {#examples}

구체화된 뷰의 새로 고침 작업을 조회합니다.

```sql
select *
from jobs("type"="mv")
where MvDatabaseName = "test" and MvName = "mv1"\G
```
```text
*************************** 1. row ***************************
               Id: 19508
             Name: inner_mtmv_19494
             MvId: 19494
           MvName: mv1
     MvDatabaseId: 16016
   MvDatabaseName: test
      ExecuteType: MANUAL
RecurringStrategy: MANUAL TRIGGER
           Status: RUNNING
       CreateTime: 2025-01-07 22:13:31
```

이 결과에서 각 필드의 의미는 다음과 같습니다.

- `Id`는 MV 새로 고침 작업 ID입니다. `JobId`의 값은 `tasks("type"="mv")`에서 이 값과 같습니다.
- `Name`은 MV 새로 고침 작업 이름입니다. `JobName`의 값은 `mv_infos("database"="test")` 및 `tasks("type"="mv")`에서 이 값과 같습니다.
- `MvId`와 `MvName`은 이 작업이 유지 관리하는 구체화된 뷰를 식별합니다.
- `MvDatabaseId`와 `MvDatabaseName`은 구체화된 뷰가 속한 데이터베이스를 식별합니다.
- `ExecuteType`이 `MANUAL`이므로 이 작업은 자체 타이머에 따라 실행되지 않습니다. 구체화된 뷰를 수동으로 새로 고치거나, 커밋 시 새로 고치거나, 시스템이 새로 고침을 트리거하면 새로 고침 태스크가 생성됩니다.
- `RecurringStrategy`는 `MANUAL TRIGGER`이며, 이는 `ExecuteType = MANUAL`과 일치합니다. 일정에 따라 실행되는 구체화된 뷰의 경우 이 필드는 `EVERY ... STARTS ...`로 표시됩니다.
- `Status`가 `RUNNING`이므로 작업이 새로 고침 태스크를 생성할 수 있습니다. `PAUSED` 상태라면 구체화된 뷰 작업을 재개해야 새 태스크가 생성될 수 있습니다.
- `CreateTime`은 이 MV 새로 고침 작업이 생성된 시간입니다.

이 작업이 생성한 태스크를 조회하려면 작업 이름을 사용합니다.

```sql
select TaskId, JobName, MvName, Status, CreateTime, FinishTime
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc;
```
```text
+-----------------+------------------+--------+---------+---------------------+---------------------+
| TaskId          | JobName          | MvName | Status  | CreateTime          | FinishTime          |
+-----------------+------------------+--------+---------+---------------------+---------------------+
| 437156301250803 | inner_mtmv_19494 | mv1    | SUCCESS | 2025-01-07 22:13:48 | 2025-01-07 22:17:45 |
+-----------------+------------------+--------+---------+---------------------+---------------------+
```

모든 insert 작업을 조회합니다.
```sql
select * from jobs("type"="insert");
```
```text
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| Id             | Name           | Definer | ExecuteType | RecurringStrategy                          | Status  | ExecuteSql                                                   | CreateTime          | SucceedTaskCount | FailedTaskCount | CanceledTaskCount | Comment |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| 78533940810334 | insert_tab_job | root    | RECURRING   | EVERY 10 MINUTE STARTS 2025-01-17 14:42:53 | RUNNING | INSERT INTO test.insert_tab SELECT * FROM test.example_table | 2025-01-17 14:32:53 | 0                | 0               | 0                 |         |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
```
