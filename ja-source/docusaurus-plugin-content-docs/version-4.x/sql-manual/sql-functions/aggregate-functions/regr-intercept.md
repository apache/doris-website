---
{
  "title": "REGR_INTERCEPT",
  "description": "グループ内の非null値のペアに対する単変量線形回帰直線の切片を返します。",
  "language": "ja"
}
---
## 説明

グループ内の非null値のペアに対する単変量線形回帰線の切片を返します。これは以下の式を使用して非null値のペアに対して計算されます：

`AVG(y) - REGR_SLOPE(y, x) * AVG(x)`

ここで、`x`は独立変数、yは従属変数です。

## 構文

```sql
REGR_INTERCEPT(<y>, <x>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<y>` | 従属変数。サポートされる型：Double。 |
| `<x>` | 独立変数。サポートされる型：Double。 |

## Return Value

グループ内の非null ペアに対する単変量線形回帰直線の切片を表すDouble値を返します。行が存在しない場合、またはnullのみを含む行のみが存在する場合、関数はNULLを返します。

## Examples

```sql
-- Create sample table
CREATE TABLE test_regr_intercept (
  `id` int,
  `x` int,
  `y` int
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
INSERT INTO test_regr_intercept VALUES
(1, 18, 13),
(2, 14, 27),
(3, 12, 2),
(4, 5, 6),
(5, 10, 20);

-- Calculate the linear regression intercept of x and y
SELECT REGR_INTERCEPT(y, x) FROM test_regr_intercept;
```
```text
+----------------------+
| REGR_INTERCEPT(y, x) |
+----------------------+
|    5.512931034482759 |
+----------------------+
```
```sql
SELECT REGR_INTERCEPT(y, x) FROM test_regr_intercept where x>100;
```
グループに行がない場合、この関数は`NULL`を返します。

```text
+----------------------+
| REGR_INTERCEPT(y, x) |
+----------------------+
|                 NULL |
+----------------------+
```
