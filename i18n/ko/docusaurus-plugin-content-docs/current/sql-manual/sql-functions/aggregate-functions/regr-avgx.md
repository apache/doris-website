---
{
    "title": "REGR_AVGX",
    "language": "ko",
    "description": "그룹에서 NULL이 아닌 쌍에 대한 독립 변수(x)의 평균을 반환합니다."
}
---

## 설명 {#description}

그룹 내 독립 변수 `x`의 평균을 반환하며, NULL이 아닌 `(y, x)` 쌍만 계산에 포함합니다. 여기서 `x`는 독립 변수이고 `y`는 종속 변수입니다.

## 구문 {#syntax}

```sql
REGR_AVGX(<y>, <x>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<y>` | 종속 변수입니다. 지원 타입: Double. |
| `<x>` | 독립 변수입니다. 지원 타입: Double. |

## 반환값 {#return-value}

`x`의 평균을 나타내는 Double 값을 반환하며, NULL이 아닌 `(y, x)` 쌍만 계산에 포함합니다.
그룹에 행이 없거나 모든 행에서 표현식의 값이 NULL이면 함수는 `NULL`을 반환합니다.

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
(2, 5, NULL);
```

```sql
SELECT id, REGR_AVGX(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+--------------------+
| id   | REGR_AVGX(y, x)    |
+------+--------------------+
|    1 |               NULL |
|    2 |                2.5 |
+------+--------------------+
```
