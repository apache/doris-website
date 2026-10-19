---
{
    "title": "RESUME JOB",
    "language": "ko",
    "description": "PAUSED 상태의 작업을 RUNNING 상태로 전환합니다. RUNNING 상태의 작업은 예약된 주기에 따라 실행됩니다."
}
---

## 설명 {#description}

PAUSED 상태의 작업을 RUNNING 상태로 전환합니다. RUNNING 상태의 작업은 예약된 주기에 따라 실행됩니다.

## 구문 {#syntax}

```sql
RESUME JOB where jobName = <job_name> ;
```
## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**
> 재개할 작업의 `<job_name>`입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 실행 유형 | 참고 사항 |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | 데이터베이스 | NO Streaming | 현재 이 작업은 **ADMIN** 권한으로만 수행할 수 있습니다 |
| LOAD_PRIV | 데이터베이스 | Streaming |**LOAD** 권한으로 이 작업을 수행할 수 있습니다 |

## 예제 {#example}

- example이라는 작업을 재개합니다.

   ```sql
   RESUME JOB where jobName= 'example';
   ```
