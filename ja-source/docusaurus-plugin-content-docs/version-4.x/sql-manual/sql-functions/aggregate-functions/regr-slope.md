---
{
  "title": "REGR_SLOPE",
  "description": "グループ内の非null ペアに対する線形回帰直線の傾きを返します。",
  "language": "ja"
}
---
## デスクリプション

グループ内の非null値のペアに対する線形回帰直線の傾きを返します。


## Syntax

```sql
REGR_SLOPE(<y>, <x>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<y>` | 従属変数。サポートされる型：Double。 |
| `<x>` | 独立変数。サポートされる型：Double。 |

## Return Value

線形回帰直線の傾きを表すDouble値を返します。
グループに行がない場合、または式のすべての行にNULLが含まれている場合、関数は`NULL`を返します。

## Examples

```sql
-- setup
CREATE TABLE test_regr_slope (
  `id` int,
  `x` int,
  `y` int
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- Insert example data
INSERT INTO test_regr_slope VALUES
(1, 18, 13),
(2, 14, 27),
(3, 12, 2),
(4, 5, 6),
(5, 10, 20);
```
```sql
SELECT REGR_SLOPE(y, x) FROM test_regr_slope;
```
xとyの線形回帰の傾きを計算します。

```text
+--------------------+
| REGR_SLOPE(y, x)   |
+--------------------+
| 0.6853448275862069 |
+--------------------+
```
```sql
SELECT REGR_SLOPE(y, x) FROM test_regr_slope where x>100;
```
グループに行がない場合、この関数は`NULL`を返します。

```text
+------------------+
| REGR_SLOPE(y, x) |
+------------------+
|             NULL |
+------------------+
```
