---
{
    "title": "REGR_R2",
    "language": "ja",
    "description": "グループ内の NULL 以外のペアから求めた線形回帰の決定係数を返します。"
}
---

## 説明

グループ内の NULL 以外の `(y, x)` ペアから計算した線形回帰の決定係数を返します。`x` は独立変数、`y` は従属変数です。

## 構文

```sql
REGR_R2(<y>, <x>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<y>` | 従属変数。Double 型をサポートします。 |
| `<x>` | 独立変数。Double 型をサポートします。 |

## 戻り値

決定係数 (R の二乗) を表す Double 型の値を返します。
- `REGR_COUNT(y, x) < 1` の場合、関数は `NULL` を返します。
- `VAR_POP(x) = 0` の場合、関数は `NULL` を返します。
- `VAR_POP(y) = 0` の場合、関数は `1` を返します。
- それ以外の場合、関数は `POWER(CORR(y, x), 2)` を返します。

## 使用例

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

グループ 3 は `VAR_POP(x) = 0` のケースで、結果は `NULL` です。グループ 4 は `VAR_POP(y) = 0` のケースで、結果は `1.0` です。
