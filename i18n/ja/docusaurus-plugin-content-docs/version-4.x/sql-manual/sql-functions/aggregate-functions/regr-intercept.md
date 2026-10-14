---
{
    "title": "REGR_INTERCEPT",
    "language": "ja",
    "description": "グループ内の NULL 以外のペアから求めた線形回帰直線の切片を返します。"
}
---

## 説明

グループ内の NULL 以外の `(y, x)` ペアから計算した線形回帰直線の切片を返します。`x` は独立変数、`y` は従属変数です。`AVG(y) - REGR_SLOPE(y, x) * AVG(x)` と同等です。

## 構文

```sql
REGR_INTERCEPT(<y>, <x>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<y>` | 従属変数。Double 型をサポートします。 |
| `<x>` | 独立変数。Double 型をサポートします。 |

## 戻り値

線形回帰直線の切片を表す Double 型の値を返します。
グループ内に行がない場合、またはすべての行で式が NULL の場合、関数は `NULL` を返します。

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
(2, 5, NULL);
```

```sql
SELECT id, REGR_INTERCEPT(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+------------------------+
| id   | REGR_INTERCEPT(y, x)   |
+------+------------------------+
|    1 |                   NULL |
|    2 |                    1.0 |
+------+------------------------+
```
