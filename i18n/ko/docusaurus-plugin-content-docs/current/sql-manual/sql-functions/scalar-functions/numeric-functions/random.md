---
{
    "title": "RANDOM",
    "language": "ko",
    "description": "0과 1 사이의 난수를 반환하거나 매개변수에 따라 원하는 난수를 반환합니다."
}
---

## 설명 {#description}

0과 1 사이의 난수를 반환하거나 매개변수에 따라 원하는 난수를 반환합니다.

- 참고: 모든 매개변수는 상수여야 합니다.

## 별칭 {#alias}

- RAND

## 구문 {#syntax}

```sql
RANDOM() -- Generates a random number between 0 and 1

RANDOM(<seed>) -- Generates a fixed sequence of random numbers between 0 and 1 based on the seed value

RANDOM(<a> , <b>) -- Generates a random number between a and b
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-----------|------------|
| `<seed>` | 난수 생성기의 시드입니다. 0과 1 사이의 고정된 난수 시퀀스를 반환합니다. |
| `<a>` | 난수의 하한값입니다. |
| `<b>` | 난수의 상한값입니다. 하한값보다 커야 합니다. |

## 반환값 {#return-value}

- 매개변수를 전달하지 않은 경우: 0과 1 사이의 난수를 반환합니다.

- 매개변수 seed 하나를 전달한 경우: 0과 1 사이의 고정된 난수 시퀀스를 반환합니다.

- 매개변수 a와 b 두 개를 전달한 경우: a와 b 사이의 임의의 정수를 반환합니다.

## 예제 {#example}

```sql
select random();
```

```text
+--------------------+
| random()           |
+--------------------+
| 0.8047437125910604 |
+--------------------+
```

```sql
select rand(1.2);
```

```text
+---------------------+
| rand(1)             |
+---------------------+
| 0.13387664401253274 |
+---------------------+
```

```sql
select rand(-20, -10);
```

```text
+------------------+
| random(-20, -10) |
+------------------+
|              -10 |
+------------------+
```
