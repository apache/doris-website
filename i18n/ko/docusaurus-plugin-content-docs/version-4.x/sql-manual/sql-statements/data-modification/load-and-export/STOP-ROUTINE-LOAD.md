---
{
    "title": "STOP ROUTINE LOAD",
    "language": "ko",
    "description": "이 구문은 Routine Load 작업을 중지하는 데 사용됩니다. PAUSE 명령과 달리, 이 명령으로 중지한 작업은 다시 시작할 수 없습니다. 데이터를 다시 가져오려면,"
}
---

## 설명 {#description}

이 구문은 Routine Load 작업을 중지하는 데 사용됩니다. PAUSE 명령과 달리, 이 명령으로 중지한 작업은 다시 시작할 수 없습니다. 데이터를 다시 가져오려면 새 데이터 가져오기 작업을 생성해야 합니다.

## 구문 {#syntax}

```sql
STOP ROUTINE LOAD FOR <job_name>;
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**

> 중지할 작업의 이름을 지정합니다. 다음 형식을 사용할 수 있습니다.
>
> - `<job_name>`: 현재 데이터베이스에서 지정한 이름의 작업을 중지합니다.
> - `<db_name>.<job_name>`: 지정한 데이터베이스에서 지정한 이름의 작업을 중지합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한  | 객체 | 참고 사항                                                    |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV  | 테이블  | STOP ROUTINE LOAD를 실행하려면 테이블에 대한 LOAD 권한이 필요합니다. |

## 참고 사항 {#notes}

- 중지 작업은 되돌릴 수 없으며, 중지된 작업은 RESUME 명령으로 다시 시작할 수 없습니다.
- 중지 작업은 즉시 적용되며, 실행 중인 태스크는 중단됩니다.
- 작업을 중지하기 전에 SHOW ROUTINE LOAD 명령으로 작업 상태를 확인하는 것이 좋습니다.
- 작업을 일시적으로 중지하려면 PAUSE 명령을 사용하세요.

## 예시 {#examples}

- test1이라는 이름의 Routine Load 작업 중지

   ```sql
   STOP ROUTINE LOAD FOR test1;
   ```

- 지정한 데이터베이스의 Routine Load 작업 중지

   ```sql
   STOP ROUTINE LOAD FOR example_db.test1;
   ```
