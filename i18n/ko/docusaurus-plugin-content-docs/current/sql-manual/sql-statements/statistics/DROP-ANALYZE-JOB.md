---
{
    "title": "DROP ANALYZE JOB",
    "language": "ko",
    "description": "지정한 통계 수집 작업의 이력을 삭제합니다."
}
---

## 설명 {#description}

지정한 통계 수집 작업의 이력을 삭제합니다.

## 구문 {#syntax}

```sql
DROP ANALYZE JOB <job_id>
```

# 필수 매개변수 {#required-parameters}

**<job_id>**

> 작업 ID를 지정합니다. SHOW ANALYZE를 실행하여 job_id를 확인할 수 있습니다. 자세한 사용법은 "SHOW ANALYZE" 섹션을 참조하세요.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한 | 객체 | 비고 |
| ----------- | ------ | ----- |
| SELECT_PRIV | 테이블  |       |

## 예제 {#examples}

ID가 10036인 통계 정보 작업 기록을 삭제합니다.

```sql
DROP ANALYZE JOB 10036
```
