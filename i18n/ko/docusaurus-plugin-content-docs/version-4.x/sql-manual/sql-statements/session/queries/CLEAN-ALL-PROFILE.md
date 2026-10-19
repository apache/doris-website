---
{
    "title": "CLEAN ALL PROFILE",
    "language": "ko",
    "description": "이 명령은 과거의 모든 쿼리 또는 데이터 적재 프로파일을 수동으로 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 명령은 과거의 모든 쿼리 또는 데이터 적재 프로파일을 수동으로 삭제하는 데 사용됩니다.

## 구문 {#syntax}

```sql
CLEAN ALL PROFILE
```

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한    | 객체    | 비고                                                |
|:--------------|:-----------|:-----------------------------------------------------|
| ADMIN_PRIV   | 전역    | 모든 프로파일을 삭제하려면 ADMIN 권한이 필요합니다      |

## 예제 {#examples}

```sql
CLEAN ALL PROFILE
```
