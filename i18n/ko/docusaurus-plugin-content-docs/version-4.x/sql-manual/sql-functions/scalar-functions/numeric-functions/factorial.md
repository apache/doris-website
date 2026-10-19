---
{
    "title": "FACTORIAL",
    "language": "ko",
    "description": "x의 팩토리얼을 반환하며, x가 0부터 20까지의 범위(0과 20 포함)를 벗어나면 NULL을 반환합니다."
}
---

## 설명 {#description}

`x`의 팩토리얼을 반환하며, `NULL`은 `x`가 `0`부터 `20`까지의 범위(`0`과 `20` 포함)를 벗어날 때 반환됩니다.

## 구문 {#syntax}

```sql
FACTORIAL(<x>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |  
| -- | -- |  
| `<x>` | 팩토리얼을 계산할 값 |  

## 반환값 {#return-value}

매개변수 `x`의 팩토리얼 값입니다.

## 특수한 경우 {#special-cases}

- `x`가 0이면 1을 반환합니다
- `x`가 [0, 20] 범위를 벗어나면 `NULL`을 반환합니다
- `x`가 NULL이면 NULL을 반환합니다

## 예제 {#examples}

```sql
select factorial(0);
```

```text
+--------------+
| factorial(0) |
+--------------+
|            1 |
+--------------+
```

```sql
select factorial(-1);
```

```text
+---------------+
| factorial(-1) |
+---------------+
|          NULL |
+---------------+
```

```sql
select factorial(21);
```

```text
+---------------+
| factorial(21) |
+---------------+
|          NULL |
+---------------+
```

```sql
select factorial(20);
```

```text
+---------------------+
| factorial(20)       |
+---------------------+
| 2432902008176640000 |
+---------------------+
```

```sql
select factorial(NULL);
```

```text
+-----------------+
| factorial(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
