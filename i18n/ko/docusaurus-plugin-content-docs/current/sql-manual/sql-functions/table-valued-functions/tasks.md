---
{
    "title": "TASKS",
    "language": "ko",
    "description": "태스크의 임시 테이블을 생성하는 테이블 함수입니다."
}
---

## 설명 {#description}

태스크의 임시 테이블을 생성하는 테이블 함수로, 현재 Doris 클러스터에서 작업이 생성한 태스크 정보를 조회할 수 있습니다.

## 구문 {#syntax}
```sql
TASKS(
    "type"="<type>"
)
```

## 필수 매개변수 {#required-parameters}
| 필드         | 설명                                                                                       |
|---------------|---------------------------------------------------------------------------------------------------|
| **`<type>`**  | 태스크 유형: <br/> `insert`: insert into 유형 태스크. <br/> `mv`: 구체화된 뷰 유형 태스크. |


## 반환 값 {#return-value}

-  **`tasks("type"="insert")`** insert 유형 태스크의 반환 값

   | 필드 이름   | 설명                        |
   |--------------|------------------------------------|
   | **TaskId**   | 태스크 ID                            |
   | **JobId**    | 작업 ID                             |
   | **JobName**  | 작업 이름                           |
   | **Label**    | 레이블                              |
   | **Status**   | 태스크 상태                        |
   | **ErrorMsg** | 태스크 실패 정보          |
   | **CreateTime**| 태스크 생성 시간                |
   | **FinishTime**| 태스크 완료 시간              |
   | **TrackingUrl**| 추적 URL                     |
   | **LoadStatistic**| 데이터 적재 통계                |
   | **User**     | 사용자                               |

-  **`tasks("type"="mv")`** MV 유형 태스크의 반환 값

   | 필드 이름 | 설명 |
   |------------|-------------|
   | **TaskId** | 새로 고침 태스크의 고유 ID입니다. 구체화된 뷰를 새로 고칠 때마다 새로운 태스크 레코드가 생성됩니다. |
   | **JobId** | 이 태스크를 생성한 작업의 ID입니다. `jobs("type"="mv").Id`에 해당합니다. |
   | **JobName** | 이 태스크를 생성한 작업의 이름입니다. `mv_infos("database"="...").JobName` 및 `jobs("type"="mv").Name`에 해당합니다. |
   | **MvId** | 이 태스크가 새로 고친 구체화된 뷰의 ID입니다. |
   | **MvName** | 이 태스크가 새로 고친 구체화된 뷰의 이름입니다. |
   | **MvDatabaseId** | 구체화된 뷰가 속한 데이터베이스의 ID입니다. |
   | **MvDatabaseName** | 구체화된 뷰가 속한 데이터베이스의 이름입니다. |
   | **Status** | 태스크 상태입니다. 가능한 값: `PENDING`은 태스크가 실행을 기다리는 상태, `RUNNING`은 태스크가 실행 중인 상태, `SUCCESS`는 태스크가 성공적으로 완료된 상태, `FAILED`는 태스크가 실패한 상태, `CANCELED`는 태스크가 취소된 상태를 의미합니다. |
   | **ErrorMsg** | `Status`가 `FAILED` 또는 `CANCELED`일 때의 오류 메시지입니다. 태스크가 성공하면 비어 있습니다. |
   | **CreateTime** | 태스크 레코드가 생성된 시간입니다. |
   | **StartTime** | 태스크 실행이 시작된 시간입니다. 태스크가 아직 시작되지 않았다면 `\N`일 수 있습니다. |
   | **FinishTime** | 태스크가 완료된 시간입니다. 태스크가 아직 대기 중이거나 실행 중이면 `\N`일 수 있습니다. |
   | **DurationMs** | 밀리초 단위의 실행 시간으로, `FinishTime - StartTime`으로 계산됩니다. 태스크가 아직 완료되지 않았다면 `\N`일 수 있습니다. |
   | **TaskContext** | 태스크가 트리거된 방식과 사용자가 요청한 내용을 설명하는 JSON 문자열입니다. 주요 필드로는 `triggerMode`, `partitions`, `isComplete`가 있습니다. `triggerMode`의 값은 `MANUAL`, `COMMIT`, `SYSTEM`입니다. |
   | **RefreshMode** | 이 태스크가 결정한 실제 새로 고침 범위입니다. 가능한 값: `COMPLETE`는 구체화된 뷰의 모든 파티션을 새로 고쳤음을, `PARTIAL`은 일부 파티션만 새로 고쳤음을, `NOT_REFRESH`는 새로 고칠 파티션이 없었음을 의미합니다. |
   | **NeedRefreshPartitions** | 이 태스크에서 새로 고쳐야 했던 구체화된 뷰 파티션의 JSON 배열입니다. 빈 배열은 새로 고칠 파티션이 없었음을 의미합니다. |
   | **CompletedPartitions** | 새로 고침에 성공한 파티션의 JSON 배열입니다. `NeedRefreshPartitions`와 비교하여 필요한 모든 파티션의 새로 고침이 완료되었는지 확인할 수 있습니다. |
   | **Progress** | 새로 고침 진행률로, `percentage (completed/total)` 형식으로 표시됩니다. 예를 들어 `100.00% (1/1)`과 같습니다. 새로 고칠 파티션이 없으면 `\N`일 수 있습니다. |
   | **LastQueryId** | 새로 고침 태스크가 실행한 SQL 문의 쿼리 ID입니다. 태스크 실패 문제를 해결할 때 이 ID로 FE 또는 BE 로그를 검색할 수 있습니다. 새로 고침 SQL이 실행되지 않았다면 비어 있을 수 있습니다. 이 필드는 Doris 3.0.0부터 지원됩니다. |
   | **ComputeGroup** | 새로 고침 태스크가 사용한 Compute Group입니다. 지정되지 않았거나 컴퓨팅과 스토리지가 분리되지 않은 배포 환경에서는 비어 있을 수 있습니다. |
   | **IvmFallbackReason** | IVM을 실행할 수 없어 폴백하거나 엄격한 IVM 새로 고침이 실패했을 때 기록되는 고정된 사유입니다. IVM 폴백이 발생하지 않았다면 비어 있습니다. |
   | **IvmRebuiltPartitions** | 새로 고침 요청에서 재구축을 요구하지 않았지만, 구체화된 뷰를 처음 새로 고치거나 기준 상태가 무효화되어 이번 새로 고침에서 전체를 재구축한 IVM 구체화된 뷰 파티션의 수입니다. `COMPLETE` 새로 고침을 요청했거나 구체화된 뷰가 IVM이 아니면 0입니다. 이러한 상황이 발생하는 조건은 [최초 새로 고침 및 기준 상태 재구축](../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#first-refresh-and-baseline-rebuild)을 참조하세요. |

### MV 태스크 열거형 필드 {#mv-task-enum-fields}

구체화된 뷰의 새로 고침 태스크를 확인할 때 다음 열거형 필드를 자주 사용합니다.

- `Status`: 태스크의 수명 주기 상태입니다.
  - `PENDING`: 태스크가 생성되었지만 아직 실행되지 않았습니다. 스케줄링이나 리소스를 기다리고 있습니다.
  - `RUNNING`: 태스크가 현재 실행 중입니다.
  - `SUCCESS`: 태스크가 성공적으로 완료되었습니다.
  - `FAILED`: 태스크가 실패했습니다. 먼저 `ErrorMsg`를 확인하고, `LastQueryId`가 비어 있지 않으면 이 값으로 로그를 검색하세요.
  - `CANCELED`: 태스크가 완료되기 전에 취소되었습니다.
- `TaskContext.triggerMode`: 이 태스크가 생성된 이유입니다.
  - `MANUAL`: `REFRESH MATERIALIZED VIEW`와 같은 수동 새로 고침 명령으로 생성되었습니다.
  - `COMMIT`: 관련 기본 테이블의 데이터 변경으로 새로 고침이 트리거되어 생성되었습니다.
  - `SYSTEM`: 내부 시스템 동작으로 생성되었습니다. 예를 들어 즉시 빌드하도록 생성된 구체화된 뷰의 초기 빌드가 이에 해당합니다.
- `TaskContext.isComplete`: 새로 고침 요청이 전체 새로 고침을 요구하는지 나타냅니다.
  - `true`: 구체화된 뷰의 모든 파티션을 새로 고치도록 Doris에 요청합니다.
  - `false`: 전체 새로 고침을 강제하지 않습니다. Doris는 파티션의 최신 상태를 기준으로 실제 새로 고침 범위를 결정할 수 있습니다.
- `TaskContext.refreshMode`: 사용자가 요청한 새로 고침 방식으로, `AUTO`, `COMPLETE`, `PARTITIONS` 또는 `INCREMENTAL`입니다. 이전 태스크에는 이 필드가 없을 수 있습니다.
- `TaskContext.af`: 폴백 허용 여부를 나타내며, `FALLBACK`에 해당합니다. 이 필드는 호환성을 위해 `allowFallback`이라는 이름으로 표시될 수도 있습니다. 이전 태스크에는 이 필드가 없을 수 있습니다.
- `RefreshMode`: 파티션을 확인한 후 태스크가 선택한 실제 새로 고침 범위입니다.
  - `COMPLETE`: MV에 속한 모든 구체화된 뷰 파티션이 새로 고침 대상으로 선택되었습니다.
  - `PARTIAL`: 일부 구체화된 뷰 파티션만 새로 고침 대상으로 선택되었습니다.
  - `NOT_REFRESH`: 새로 고칠 파티션이 없었습니다. 이 경우 `NeedRefreshPartitions`는 일반적으로 비어 있으며, `Progress`는 `\N`일 수 있습니다.
- `IvmFallbackReason`: IVM 사전 실행이 폴백되거나 엄격한 증분 새로 고침이 실패한 이유입니다. 예를 들어 `STREAM_UNSUPPORTED`, `MIN_MAX_BOUNDARY_HIT`, `BITMAP_AGG_DELETE` 또는 `PLAN_SIGNATURE_MISMATCH`가 있습니다. 문제 해결 방법은 [Incremental View Maintenance (IVM)](../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#fallback-order)을 참조하세요.

:::info 버전

`LastQueryId`는 Doris 3.0.0부터 지원됩니다. Doris 2.1.x에서는 사용할 수 없습니다.

:::


## 예제 {#examples}

구체화된 뷰의 가장 최근 새로 고침 태스크를 조회합니다.

```sql
select *
from tasks("type"="mv")
where MvDatabaseName = "test" and MvName = "mv1"
order by CreateTime desc
limit 1\G
```
```text
*************************** 1. row ***************************
               TaskId: 437156301250803
                JobId: 19508
              JobName: inner_mtmv_19494
                 MvId: 19494
               MvName: mv1
         MvDatabaseId: 16016
       MvDatabaseName: test
               Status: SUCCESS
             ErrorMsg:
           CreateTime: 2025-01-07 22:13:48
            StartTime: 2025-01-07 22:13:48
           FinishTime: 2025-01-07 22:17:45
           DurationMs: 236985
          TaskContext: {"triggerMode":"MANUAL","partitions":[],"isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20210101_MAXVALUE","p_20200101_20210101"]
  CompletedPartitions: ["p_20210101_MAXVALUE","p_20200101_20210101"]
             Progress: 100.00% (2/2)
          LastQueryId: 7965b4ddce8a4480-8884e9701679c1c4
          ComputeGroup: \N
     IvmFallbackReason: \N
  IvmRebuiltPartitions: 0
```

이 결과에서 각 필드는 다음을 의미합니다.

- `TaskId`는 이번 새로 고침 실행을 식별합니다. 새로 고칠 때마다 값이 달라집니다.
- `JobId`와 `JobName`은 MV 새로 고침 작업을 식별합니다. 이 작업은 `select * from jobs("type"="mv") where Name = "inner_mtmv_19494";`로 조회할 수 있습니다.
- `MvId`, `MvName`, `MvDatabaseId`, `MvDatabaseName`은 태스크가 새로 고친 구체화된 뷰를 식별합니다.
- `Status`가 `SUCCESS`이므로 태스크가 성공적으로 완료되었습니다. `FAILED`이면 먼저 `ErrorMsg`를 확인하세요.
- `CreateTime`, `StartTime`, `FinishTime`, `DurationMs`는 태스크 생성 시간, 실행 시작 시간, 완료 시간, 실행 소요 시간을 나타냅니다.
- `TaskContext`는 이 태스크가 수동으로 트리거되었음을 나타냅니다. `partitions: []`는 사용자가 새로 고침 명령에 파티션 목록을 지정하지 않았음을 의미합니다.
- `RefreshMode`가 `COMPLETE`이므로 이 태스크는 구체화된 뷰에서 새로 고쳐야 하는 모든 파티션을 새로 고쳤습니다.
- `NeedRefreshPartitions`에는 새로 고쳐야 했던 두 파티션이 나열되어 있고, `CompletedPartitions`에도 동일한 두 파티션이 나열되어 있으므로 필요한 모든 파티션의 새로 고침이 완료되었습니다.
- `Progress`가 `100.00% (2/2)`이며, 이 역시 필요한 두 파티션 중 두 파티션의 새로 고침이 완료되었음을 의미합니다.
- `LastQueryId`는 새로 고침 SQL의 쿼리 ID입니다. 태스크가 실패하거나 느리게 실행될 때 이 값으로 Doris 로그를 검색할 수 있습니다.
- `ComputeGroup`이 비어 있으므로 이 예제에서는 전용 Compute Group이 기록되지 않았습니다.
- `IvmFallbackReason`이 비어 있으므로 이 태스크에서는 IVM 폴백이 발생하지 않았습니다.
- `IvmRebuiltPartitions`가 0이므로 이 태스크에서는 추가로 재구축한 파티션이 없습니다.

:::info 참고

저장되고 표시되는 태스크 레코드 수는 FE 설정 항목인 `max_persistence_task_count`로 제어합니다. 기본값은 100입니다. 태스크 레코드 수가 이 한도를 초과하면 오래된 태스크 레코드가 삭제됩니다. 값이 1보다 작으면 태스크 레코드가 영구 저장되지 않습니다. 이 설정을 변경한 후에는 FE를 다시 시작하세요.

:::

모든 insert 태스크를 조회합니다.

```sql
select * from tasks("type"="insert");
```
```text
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| TaskId         | JobId          | JobName        | Label                         | Status  | ErrorMsg | CreateTime          | StartTime           | FinishTime          | TrackingUrl | LoadStatistic | User |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| 79133848479750 | 78533940810334 | insert_tab_job | 78533940810334_79133848479750 | SUCCESS |          | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 |             |               | root |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
```
