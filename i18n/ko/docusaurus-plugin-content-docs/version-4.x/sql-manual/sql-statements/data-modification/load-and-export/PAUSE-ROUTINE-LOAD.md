---
{
    "title": "PAUSE ROUTINE LOAD",
    "language": "ko",
    "description": "이 구문은 Routine Load 작업 하나 또는 전체를 일시 중지하는 데 사용됩니다. 일시 중지된 작업은 RESUME 명령으로 다시 시작할 수 있습니다."
}
---

## 설명 {#description}

이 구문은 Routine Load 작업 하나 또는 전체를 일시 중지하는 데 사용됩니다. 일시 중지된 작업은 RESUME 명령으로 다시 시작할 수 있습니다.

## 구문 {#syntax}

```sql
PAUSE [ALL] ROUTINE LOAD FOR <job_name>
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**

> 일시 중지할 작업의 이름을 지정합니다. ALL을 지정하면 job_name은 필요하지 않습니다.

## 선택 매개변수 {#optional-parameters}

**1. `[ALL]`**

> 선택 매개변수입니다. ALL을 지정하면 모든 Routine Load 작업을 일시 중지합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다:

| 권한 | 객체 | 참고 사항 |
| :-------- | :----- | :---- |
| LOAD_PRIV | 테이블 | PAUSE ROUTINE LOAD를 실행하려면 테이블에 대한 LOAD 권한이 필요합니다 |

## 참고 사항 {#notes}

- 일시 중지된 작업은 RESUME 명령으로 다시 시작할 수 있습니다
- 일시 중지 작업은 이미 BE로 전달된 태스크에 영향을 주지 않으며, 해당 태스크는 완료될 때까지 계속 실행됩니다

## 예제 {#examples}

- test1이라는 Routine Load 작업을 일시 중지합니다.

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```

- 모든 Routine Load 작업을 일시 중지합니다.

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```
