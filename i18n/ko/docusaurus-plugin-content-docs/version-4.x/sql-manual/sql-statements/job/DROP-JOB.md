---
{
    "title": "DROP JOB",
    "language": "ko",
    "description": "사용자가 JOB 작업을 삭제합니다. 작업은 즉시 중지되고 삭제됩니다."
}
---

## 설명 {#description}

사용자가 JOB 작업을 삭제합니다. 작업은 즉시 중지되고 삭제됩니다.

## 구문 {#syntax}

```sql
DROP JOB where jobName = <job_name> ;
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**
> 삭제할 작업의 `<job_name>`입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한 | 객체 | 실행 유형 | 비고 |
|:--------------|:-----------|:------------------------|:------------------------|
| ADMIN_PRIV | 데이터베이스 | NO Streaming | 현재 이 작업은 **ADMIN** 권한으로만 수행할 수 있습니다 |
| LOAD_PRIV | 데이터베이스 | Streaming |이 작업은 **LOAD** 권한으로 수행할 수 있습니다 |


## 예시 {#examples}

- 이름이 example인 작업을 삭제합니다.

    ```sql
    DROP JOB where jobName='example';
    ```
