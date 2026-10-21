---
{
    "title": "SHOW ALTER",
    "language": "ko",
    "description": "이 문은 진행 중인 다양한 변경 작업의 실행 상태를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 진행 중인 다양한 변경 작업의 실행 상태를 표시하는 데 사용됩니다.

```sql
SHOW ALTER [TABLE [COLUMN | ROLLUP] [FROM db_name]];
```

참고:

1. TABLE COLUMN: 열을 변경하는 ALTER 작업을 표시합니다.
2. 지원되는 구문: [WHERE TableName|CreateTime|FinishTime|State] [ORDER BY] [LIMIT].
3. TABLE ROLLUP: ROLLUP을 생성하거나 삭제하는 작업을 표시합니다.
4. db_name을 지정하지 않으면 현재 기본 데이터베이스를 사용합니다.

## 결과 {#result}

*SHOW ALTER TABLE COLUMN*

| 필드 이름            | 설명                                                         |
|-----------------------|------------------------------------------------------------------|
| JobId                 | 각 Schema Change 작업의 고유 ID입니다.                          |
| TableName             | Schema Change에 해당하는 기본 테이블의 이름입니다. |
| CreateTime            | 작업 생성 시간입니다.                                              |
| FinishedTime          | 작업 완료 시간입니다. 완료되지 않은 경우 "N/A"를 표시합니다.      |
| IndexName             | 이번 변경에 포함된 기본 테이블/동기식 구체화된 뷰의 이름입니다.        |
| IndexId               | 새 기본 테이블/동기식 구체화된 뷰의 ID입니다.                                      |
| OriginIndexId         | 이번 변경에 포함된 기본 테이블/동기식 구체화된 뷰의 ID입니다.                                      |
| SchemaVersion         | M:N 형식으로 표시합니다. M은 Schema Change의 버전을, N은 해당 해시 값을 나타냅니다. Schema Change가 수행될 때마다 버전이 증가합니다. |
| TransactionId         | 과거 데이터를 변환하기 위한 트랜잭션 ID입니다.                  |
| State                 | 작업의 진행 단계입니다.                                               |
|                       | - PENDING: 작업이 큐에서 스케줄링을 기다리고 있습니다.        |
|                       | - WAITING_TXN: 경계 트랜잭션 ID 이전의 데이터 적재 작업이 완료되기를 기다리고 있습니다. |
|                       | - RUNNING: 현재 과거 데이터 변환을 수행하고 있습니다.                |
|                       | - FINISHED: 작업이 성공적으로 완료되었습니다.                            |
|                       | - CANCELLED: 작업이 실패했습니다.                                          |
| Msg                   | 작업이 실패하면 실패 메시지를 표시합니다.                        |
| Progress              | 작업 진행률입니다. RUNNING 상태에서만 표시됩니다. 진행률은 M/N 형식으로 표시됩니다. N은 Schema Change에 포함된 전체 복제본 수입니다. M은 과거 데이터 변환이 완료된 복제본 수입니다. |
| Timeout                | 작업 제한 시간이며, 단위는 초입니다.                                       |


## 예시 {#examples}

1. 기본 데이터베이스의 모든 열 변경 작업에 대한 실행 상태를 표시합니다.

   ```sql
   SHOW ALTER TABLE COLUMN;
   ```

2. 특정 테이블의 가장 최근 열 변경 작업에 대한 실행 상태를 표시합니다.

   ```sql
   SHOW ALTER TABLE COLUMN WHERE TableName = "table1" ORDER BY CreateTime DESC LIMIT 1;
   ```

3. 지정된 데이터베이스에서 ROLLUP을 생성하거나 삭제하는 작업의 실행 상태를 표시합니다.

   ```sql
   SHOW ALTER TABLE ROLLUP FROM example_db;
   ```

## 키워드 {#keywords}

    SHOW, ALTER

## 모범 사례 {#best-practices}
