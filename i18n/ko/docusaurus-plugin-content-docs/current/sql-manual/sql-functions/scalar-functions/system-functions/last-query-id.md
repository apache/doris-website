---
{
    "title": "LAST_QUERY_ID",
    "language": "ko",
    "description": "현재 사용자가 마지막으로 실행한 쿼리의 ID를 가져옵니다."
}
---

## 설명 {#description}

현재 사용자가 마지막으로 실행한 쿼리의 ID를 가져옵니다.

## 구문 {#syntax}

```sql
LAST_QUERY_ID()
```

## 반환 값 {#return-value}

현재 사용자가 마지막으로 실행한 쿼리의 ID를 반환합니다.

## 예제 {#examples}

```sql
select last_query_id();
```

```text
+-----------------------------------+
| last_query_id()                   |
+-----------------------------------+
| 128f913c3ec84a1e-b834bd0262cc090a |
+-----------------------------------+
```
