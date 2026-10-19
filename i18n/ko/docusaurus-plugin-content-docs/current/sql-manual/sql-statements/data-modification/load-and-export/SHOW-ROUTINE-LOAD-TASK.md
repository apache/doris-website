---
{
    "title": "SHOW ROUTINE LOAD TASK",
    "language": "ko",
    "description": "이 구문은 지정한 Routine Load 작업에서 현재 실행 중인 하위 작업을 조회하는 데 사용합니다."
}
---

## 설명 {#description}

이 구문은 지정한 Routine Load 작업에서 현재 실행 중인 하위 작업을 조회하는 데 사용합니다.

## 구문 {#syntax}

```sql
SHOW ROUTINE LOAD TASK WHERE JobName = <job_name>;

SHOW ROUTINE LOAD TASK FOR [<db>.]<job_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**

> 조회할 Routine Load 작업의 이름입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db>`**

> Routine Load 작업이 속한 데이터베이스입니다. 생략하면 현재 데이터베이스에서 Routine Load 작업을 검색합니다.

## 반환 결과 {#return-results}

반환 결과에는 다음 필드가 포함됩니다.

| 필드 이름            | 설명                                                         |
| :------------------- | :---------------------------------------------------------- |
| TaskId               | 하위 작업의 고유 ID                                          |
| TxnId                | 하위 작업에 해당하는 데이터 적재 트랜잭션 ID                   |
| TxnStatus            | 하위 작업의 데이터 적재 트랜잭션 상태입니다. Null이면 하위 작업이 아직 스케줄링되지 않았음을 나타냅니다 |
| JobId                | 하위 작업에 해당하는 작업 ID                                 |
| CreateTime           | 하위 작업의 생성 시각                                        |
| ExecuteStartTime     | 하위 작업의 실행이 스케줄링된 시각으로, 일반적으로 생성 시각보다 늦습니다 |
| Timeout              | 하위 작업의 시간 제한으로, 일반적으로 작업에 설정된 `max_batch_interval`의 두 배입니다 |
| BeId                 | 이 하위 작업을 실행하는 BE 노드의 ID                          |
| DataSourceProperties | 하위 작업이 소비하려는 Kafka Partition의 시작 오프셋입니다. JSON 형식의 문자열이며, Key는 Partition Id이고 Value는 소비를 시작할 오프셋입니다 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한 | 객체 | 참고 사항 |
| :-------- | :----- | :---- |
| LOAD_PRIV | 테이블 | SHOW ROUTINE LOAD TASK를 실행하려면 해당 테이블에 대한 LOAD 권한이 필요합니다 |

## 참고 사항 {#notes}

- TxnStatus가 null이라고 해서 작업에 오류가 있다는 뜻은 아니며, 아직 스케줄링되지 않았을 수 있습니다.
- DataSourceProperties의 오프셋 정보를 사용하여 데이터 소비 진행 상황을 추적할 수 있습니다.
- Timeout에 도달하면 데이터 소비가 완료되었는지와 관계없이 작업이 자동으로 종료됩니다.

## 예제 {#examples}

- test1이라는 Routine Load 작업의 하위 작업 정보를 표시합니다.

    ```sql
    SHOW ROUTINE LOAD TASK WHERE JobName = "test1";
    ```

- 현재 데이터베이스에 있는 Routine Load 작업 `test1`의 하위 작업 정보를 표시합니다.

    ```sql
    SHOW ROUTINE LOAD TASK FOR test1;
    ```

- Routine Load 작업 `test1`이 데이터베이스 `example_db`에 있을 때 해당 작업의 하위 작업 정보를 표시합니다.

    ```sql
    SHOW ROUTINE LOAD TASK FOR example_db.test1;
    ```
