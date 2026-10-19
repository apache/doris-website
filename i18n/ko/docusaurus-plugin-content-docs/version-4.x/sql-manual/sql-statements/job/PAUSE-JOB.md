---
{
    "title": "PAUSE JOB",
    "language": "ko",
    "description": "사용자가 RUNNING 상태의 작업을 일시 중지하면 실행 중인 태스크가 중단되고 작업 상태가 PAUSED로 변경됩니다."
}
---

## 설명 {#description}

사용자가 RUNNING 상태의 작업을 일시 중지하면 실행 중인 태스크가 중단되고 작업 상태가 PAUSED로 변경됩니다. 중지된 작업은 RESUME 연산으로 재개할 수 있습니다.

## 구문 {#syntax}

```sql
PAUSE JOB WHERE jobname = <job_name> ;
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**
> 일시 중지할 작업의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 실행 유형 | 참고 사항 |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | 데이터베이스 | NO Streaming | 현재 이 작업은 **ADMIN** 권한으로만 수행할 수 있습니다 |
| LOAD_PRIV | 데이터베이스 | Streaming |**LOAD** 권한으로 이 작업을 수행할 수 있습니다 |

## 예제 {#examples}

- example이라는 이름의 작업을 일시 중지합니다.

   ```sql 
   PAUSE JOB where jobname='example'; 
   ```
