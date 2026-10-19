---
{
    "title": "CANCEL TASK",
    "language": "ko",
    "description": "CREATE JOB 문으로 생성한 실행 중인 작업을 취소합니다."
}
---

## 설명 {#description}

CREATE JOB 문으로 생성한 실행 중인 작업을 취소합니다.

- CREATE JOB 문으로 생성한 작업이어야 합니다.
- 실행 중인 작업이어야 합니다.
- 이 기능은 2.1.0 버전부터 지원됩니다.

## 구문 {#syntax}

```sql
CANCEL TASK WHERE jobName = '<job_name>' AND taskId = '<task_id>';
```
## 필수 매개변수 {#required-parameters}

**<job_name>**

> 작업의 이름으로, 문자열형입니다.

**<task_id>**

> 작업 ID로, 정수형입니다. tasks 테이블 반환 함수를 통해 쿼리할 수 있습니다. 예: SELECT * FROM tasks('type'='insert'). 자세한 내용은 "task 테이블 반환 함수"를 참조하세요.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 ADMIN_PRIV 권한이 있어야 합니다.

## 예제 {#examples}

jobName이 'example'이고 taskId가 378912인 백그라운드 작업을 취소합니다.


```sql
CANCEL TASK WHERE jobName='example' AND taskId=378912
```
