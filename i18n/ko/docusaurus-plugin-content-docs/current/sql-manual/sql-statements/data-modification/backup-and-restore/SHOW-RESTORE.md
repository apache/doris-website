---
{
    "title": "SHOW RESTORE",
    "language": "ko",
    "description": "이 문은 RESTORE 작업을 조회하는 데 사용됩니다"
}
---

## 설명 {#description}

이 문은 RESTORE 작업을 조회하는 데 사용됩니다

## 구문 {#syntax}

```SQL
SHOW [BRIEF] RESTORE [FROM <db_name>]
```

## 매개변수 {#parameters}

**1.`<db_name>`**

복원 작업이 속한 데이터베이스의 이름입니다.

## 반환 값 {#return-value}

- brief: RESTORE 작업의 주요 정보만 표시하며, RestoreObjs, Progress, TaskErrMsg 열은 표시하지 않습니다

| 열 | 설명 |
| -- | -- |
| JobId | 고유 작업 ID |
| Label | 복원할 백업의 이름 |
| Timestamp | 복원할 백업의 시간 버전 |
| DbName | 작업이 속한 데이터베이스 |
| State | 현재 단계: <ul><li>PENDING: 작업을 제출한 후의 초기 상태입니다.</li><li>SNAPSHOTING: 스냅샷을 생성 중입니다.</li><li>DOWNLOAD: 스냅샷 생성이 완료되어 리포지토리에 있는 스냅샷을 다운로드할 준비가 된 상태입니다.</li><li>DOWNLOADING: 스냅샷을 다운로드 중입니다.</li><li>COMMIT: 스냅샷 다운로드가 완료되어 적용할 준비가 된 상태입니다.</li><li>COMMITTING: 적용 중입니다.</li><li>FINISHED: 작업 완료 시간입니다.</li><li>CANCELLED: 작업이 실패했습니다.</li></ul> |
| AllowLoad | 복원 중 데이터 적재 허용 여부(현재 지원되지 않음)|
| ReplicationNum | 복원할 복제본 수 지정 |
| ReserveReplica | 복제본 유지 여부 |
| ReplicaAllocation | 동적 파티셔닝 활성화 유지 여부 |
| RestoreJobs | 복원할 테이블 및 파티션 |
| CreateTime | 작업 제출 시간 |
| MetaPreparedTime | 메타데이터 준비 완료 시간 |
| SnapshotFinishedTime | 스냅샷 생성 완료 시간 |
| DownloadFinishedTime | 스냅샷 다운로드 완료 시간 |
| FinishedTime | 작업 완료 시간 |
| UnfinishedTasks | SNAPSHOTING, DOWNLOADING 및 COMMITING 단계에서 미완료 하위 작업의 ID 표시 |
| Progress |  작업 진행 상황 |
| TaskErrMsg | 작업 오류 메시지 표시 |
| Status | 작업 실패 시 실패 메시지 표시 |
| Timeout | 작업 제한 시간(초) |

## 예제 {#example}

1. example_db의 최신 RESTORE 작업을 조회합니다.

```sql
SHOW RESTORE FROM example_db;
```
