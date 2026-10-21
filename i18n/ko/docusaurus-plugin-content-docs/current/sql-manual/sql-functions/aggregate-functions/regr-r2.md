---
{
    "title": "REGR_R2",
    "language": "ko",
    "description": "그룹 내 NULL이 아닌 쌍에 대한 선형 회귀의 결정계수를 반환합니다."
}
---

## 설명 {#description}

그룹 내 NULL이 아닌 `(y, x)` 쌍에 대해 계산한 선형 회귀의 결정계수를 반환합니다. 여기서 `x`는 독립 변수이고 `y`는 종속 변수입니다.

## 구문 {#syntax}

```sql
REGR_R2(<y>, <x>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<y>` | 종속 변수입니다. 지원하는 타입: Double. |
| `<x>` | 독립 변수입니다. 지원하는 타입: Double. |

## 반환값 {#return-value}

결정계수(R-squared)를 나타내는 Double 값을 반환합니다.
- `REGR_COUNT(y, x) < 1`이면 함수는 `NULL`을 반환합니다.
- `VAR_POP(x) = 0`이면 함수는 `NULL`을 반환합니다.
- `VAR_POP(y) = 0`이면 함수는 `1`을 반환합니다.
- 그 외의 경우 함수는 `POWER(CORR(y, x), 2)`를 반환합니다.

## 예제 {#example}

```sql
CREATE TABLE test_regr (
  `id` int,
  `x` double,
  `y` double
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_regr VALUES
(1, 0, NULL),
(2, 1, 3),
(2, 2, 5),
(2, 3, 7),
(2, 4, 9),
(2, 5, NULL),
(3, 1, 5),
(3, 1, 7),
(4, 1, 5),
(4, 2, 5);
```

```sql
SELECT id, REGR_R2(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+---------------------+
| id   | REGR_R2(y, x)       |
+------+---------------------+
|    1 |                NULL |
|    2 |                 1.0 |
|    3 |                NULL |
|    4 |                 1.0 |
+------+---------------------+
```

그룹 3은 `VAR_POP(x) = 0`인 경우이므로 결과가 `NULL`이며, 그룹 4는 `VAR_POP(y) = 0`인 경우이므로 결과가 `1.0`입니다.
