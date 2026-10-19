---
{
    "title": "DROP WORKLOAD POLICY",
    "language": "ko",
    "description": "Workload Policy 삭제"
}
---

## 설명 {#description}

Workload Policy를 삭제합니다.

## 구문 {#syntax}

```sql
DROP WORKLOAD POLICY [ IF EXISTS ] <workload_policy_name>
```
## 필수 매개변수 {#required-parameters}

**<workload_policy_name>**

Workload Policy의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

최소한 `ADMIN_PRIV` 권한이 있어야 합니다.

## 예제 {#examples}

1. cancel_big_query라는 이름의 Workload Policy를 삭제합니다.

  ```sql
  drop workload policy if exists cancel_big_query
  ```
