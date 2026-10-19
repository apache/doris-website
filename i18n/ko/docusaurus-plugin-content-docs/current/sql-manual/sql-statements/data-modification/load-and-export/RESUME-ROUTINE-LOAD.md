---
{
    "title": "RESUME ROUTINE LOAD",
    "language": "ko",
    "description": "이 구문은 일시 중지된 Routine Load 작업 하나 또는 전체를 재개하는 데 사용합니다. 재개된 작업은 이전에 소비한 오프셋부터 계속 데이터를 소비합니다."
}
---

## 설명 {#description}

이 구문은 일시 중지된 Routine Load 작업 하나 또는 전체를 재개하는 데 사용합니다. 재개된 작업은 이전에 소비한 오프셋부터 계속 데이터를 소비합니다.

## 구문 {#syntax}

```sql
RESUME [ALL] ROUTINE LOAD FOR <job_name>
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**

> 재개할 작업의 이름을 지정합니다. ALL을 지정하면 job_name은 필요하지 않습니다.

## 선택적 매개변수 {#optional-parameters}

**1. `[ALL]`**

> 선택적 매개변수입니다. ALL을 지정하면 일시 중지된 모든 Routine Load 작업을 재개합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 설명 |
| :-------- | :----- | :---- |
| LOAD_PRIV | 테이블 | RESUME ROUTINE LOAD를 실행하려면 테이블에 대한 LOAD 권한이 필요합니다 |

## 참고 사항 {#notes}

- PAUSED 상태인 작업만 재개할 수 있습니다
- 재개된 작업은 마지막으로 소비한 위치부터 계속 데이터를 소비합니다
- 작업이 너무 오랫동안 일시 중지된 경우 Kafka 데이터의 만료로 인해 재개에 실패할 수 있습니다

## 예제 {#examples}

- test1이라는 이름의 Routine Load 작업을 재개합니다.

   ```sql
   RESUME ROUTINE LOAD FOR test1;
   ```

- 모든 Routine Load 작업을 재개합니다.

   ```sql
   RESUME ALL ROUTINE LOAD;
   ```
