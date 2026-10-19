---
{
    "title": "KILL ANALYZE JOB",
    "language": "ko",
    "description": "백그라운드에서 실행 중인 통계 정보 수집 작업을 중지합니다."
}
---

## 설명 {#description}

백그라운드에서 실행 중인 통계 정보 수집 작업을 중지합니다.

## 구문 {#syntax}

```sql
KILL ANALYZE <job_id>
```
## 필수 매개변수 {#required-parameters}

**<job_id>**

> 작업의 ID를 지정합니다. SHOW ANALYZE를 사용하여 작업의 job_id를 확인할 수 있습니다. 자세한 사용법은 "SHOW ANALYZE" 장을 참조하세요.

## 선택적 매개변수 {#optional-parameters}

없음

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다:

| 권한 (권한) | 객체 (객체) | 참고 사항 (참고 사항) |
| --------------------- | --------------- | ------------- |
| SELECT_PRIV           | 테이블           |               |

## 사용 시 참고 사항 {#usage-notes}

이미 실행이 완료된 작업은 중지할 수 없습니다.

## 예제 {#examples}

ID가 10036인 통계 정보 작업 레코드를 중지합니다.

```sql
kill analyze 10036
```
