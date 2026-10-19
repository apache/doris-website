---
{
    "title": "REGR_COUNT",
    "language": "ko",
    "description": "그룹에서 NULL이 아닌 (y, x) 쌍의 개수를 반환합니다."
}
---

## 설명 {#description}

그룹에서 NULL이 아닌 `(y, x)` 쌍의 개수를 반환합니다. 여기서 `x`는 독립 변수이고 `y`는 종속 변수입니다. NULL이 아닌 유효한 쌍이 없으면 함수는 `0`을 반환합니다.

## 구문 {#syntax}

```sql
REGR_COUNT(<y>, <x>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<y>` | 종속 변수입니다. 지원되는 타입: Double. |
| `<x>` | 독립 변수입니다. 지원되는 타입: Double. |

## 반환 값 {#return-value}

NULL이 아닌 `(y, x)` 쌍의 개수를 나타내는 BIGINT 값을 반환합니다.
그룹에 행이 없거나 NULL이 아닌 유효한 `(y, x)` 쌍이 없으면 함수는 `0`을 반환합니다.

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
SELECT id, REGR_COUNT(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+-------------------+
| id   | REGR_COUNT(y, x)  |
+------+-------------------+
|    1 |                 0 |
|    2 |                 4 |
+------+-------------------+
```

REGR_COUNT는 NULL이 아닌 `(y, x)` 쌍만 집계하므로 그룹 1은 `0`을 반환합니다.
