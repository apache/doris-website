---
{
    "title": "POSITIVE",
    "language": "ko",
    "description": "입력값 자체를 반환합니다."
}
---

## 설명 {#description}

입력값 자체를 반환합니다.

## 구문 {#syntax}

```sql
POSITIVE(<x>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|------------|
| `<x>`   | 반환할 값입니다. |

## 반환 값 {#return-value}

정수 또는 부동 소수점 수를 반환합니다. 특수한 경우는 다음과 같습니다.

- 매개변수가 NULL이면 NULL을 반환합니다.

## 예제 {#example}

```sql
SELECT positive(-10);
```

```text
+---------------+
| positive(-10) |
+---------------+
|           -10 |
+---------------+
```

```sql
SELECT positive(10.111);
```

```text
+------------------+
| positive(10.111) |
+------------------+
|           10.111 |
+------------------+
```

```sql
SELECT positive(12);
```

```text
+--------------+
| positive(12) |
+--------------+
|           12 |
+--------------+
```

```sql
SELECT positive(null);
```

```text
+----------------+
| positive(NULL) |
+----------------+
|           NULL |
+----------------+
```
