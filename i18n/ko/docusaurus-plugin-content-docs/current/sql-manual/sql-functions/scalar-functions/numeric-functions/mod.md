---
{
    "title": "MOD",
    "language": "ko",
    "description": "정수 타입에서 a를 b로 나눈 나머지를 구합니다. 부동소수점 타입에는 fmod 함수를 사용하세요."
}
---

## 설명 {#description}

정수 타입에서 a를 b로 나눈 나머지를 구합니다. 부동소수점 타입에는 fmod 함수를 사용하세요.

## 구문 {#syntax}

```sql
MOD(<col_a> , <col_b>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|------------|
| `<col_a>`   | 피제수 |
| `<col_b>`   | 제수이며, 0이 아니어야 합니다. |

## 반환 값 {#return-value}

정수 타입을 반환합니다. 특수한 경우:

col_a IS NULL 또는 col_b IS NULL이면 NULL을 반환합니다.

## 예제 {#example}

```sql
select mod(10, 3);
```

```text
+----------+
| (10 % 3) |
+----------+
|        1 |
+----------+
```

```sql
select mod(10, 0);
```

```text
+----------+
| (10 % 0) |
+----------+
|     NULL |
+----------+
```
