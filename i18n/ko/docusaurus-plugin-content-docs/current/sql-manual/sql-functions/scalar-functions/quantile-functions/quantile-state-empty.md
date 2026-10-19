---
{
    "title": "QUANTILE_STATE_EMPTY",
    "language": "ko",
    "description": "빈 quantilestate 타입의 컬럼을 반환합니다."
}
---

## 설명 {#description}

빈 `quantile_state` 타입의 컬럼을 반환합니다.

## 구문 {#syntax}

```sql
QUANTILE_STATE_EMPTY()
```

## 반환 값 {#return-value}

빈 `quantile_state` 타입의 컬럼입니다.

## 예제 {#example}

```sql
select quantile_percent(quantile_union(quantile_state_empty()), 0)
```

결과는 다음과 같습니다.

```text
+-------------------------------------------------------------+
| quantile_percent(quantile_union(quantile_state_empty()), 0) |
+-------------------------------------------------------------+
|                                                        NULL |
+-------------------------------------------------------------+
```
