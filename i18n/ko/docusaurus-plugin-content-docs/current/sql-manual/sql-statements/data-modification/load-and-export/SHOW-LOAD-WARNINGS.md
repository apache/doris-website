---
{
    "title": "SHOW LOAD WARNINGS",
    "language": "ko",
    "description": "데이터 적재 작업이 실패하고 오류 메시지가 ETLQUALITYUNSATISFIED인 경우, 데이터 적재 품질에 문제가 있음을 의미합니다."
}
---

## 설명 {#description}

데이터 적재 작업이 실패하고 오류 메시지가 `ETL_QUALITY_UNSATISFIED`인 경우, 데이터 적재 품질에 문제가 있음을 의미합니다. 이 문은 품질 문제가 있는 데이터 적재 작업을 조회하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW LOAD WARNINGS
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" ]]
   [LOAD_JOB_ID = ["<job_id>"]]
]
```

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**

> `db_name`을 지정하지 않으면 현재 기본 데이터베이스를 사용합니다.

**2. `<your_label>`**

> `LABEL = <your_label>`을 사용하면 지정한 레이블과 정확히 일치하는 작업을 찾습니다.

**3. `<job_id>`**

> `LOAD_JOB_ID = <job_id>`를 지정하면 지정한 JOB_ID와 정확히 일치하는 작업을 찾습니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 설명 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | 데이터베이스 | 데이터베이스 테이블에 대한 데이터 적재 권한이 필요합니다. |

## 반환값 {#return-value}

지정한 데이터베이스의 데이터 적재 작업에서 품질 문제가 있는 데이터를 반환합니다.

## 예제 {#examples}

- 지정한 데이터베이스에서 레이블이 "load_demo_20210112"인 데이터 적재 작업의 품질 문제가 있는 데이터를 표시합니다.

```sql
SHOW LOAD WARNINGS FROM demo WHERE LABEL = "load_demo_20210112" 
```
