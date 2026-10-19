---
{
    "title": "NEGATIVE",
    "language": "ko",
    "description": "매개변수 x의 부호를 반전한 값을 반환합니다."
}
---

## 설명 {#description}

매개변수 x의 부호를 반전한 값을 반환합니다.

## 구문 {#syntax}

```sql
NEGATIVE(<x>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|------------|
| `<x>` | 독립 변수로, `BIGINT, DOUBLE, and DECIMAL` 타입을 지원합니다. |

## 반환값 {#return-value}

정수 또는 부동소수점 수를 반환합니다. 특수한 경우는 다음과 같습니다.

- 매개변수가 NULL이면 NULL을 반환합니다.
- 매개변수가 0이면 0을 반환합니다.

## 예제 {#example}

```sql
SELECT negative(-10);
```

```text
+---------------+
| negative(-10) |
+---------------+
|            10 |
+---------------+
```

```sql
SELECT negative(12);
```

```text
+--------------+
| negative(12) |
+--------------+
|          -12 |
+--------------+
```

```sql
SELECT negative(0);
```

```text
+-------------+
| negative(0) |
+-------------+
|           0 |
+-------------+
```

```sql
SELECT negative(null);
```

```text
+----------------+
| negative(NULL) |
+----------------+
|           NULL |
+----------------+
```
