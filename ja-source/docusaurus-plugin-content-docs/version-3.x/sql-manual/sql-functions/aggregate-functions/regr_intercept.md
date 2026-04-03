---
{
  "title": "REGR_INTERCEPT",
  "description": "REGRINTERCEPT は、数値ペアのセットに対する最小二乗法による線形方程式のy切片を計算するために使用されます。",
  "language": "ja"
}
---
## 説明
REGR_INTERCEPTは、数値ペアのセットに対する最小二乗法による線形方程式のy切片を計算するために使用されます。

## 構文

```
REGR_INTERCEPT(y, x)
```
## パラメータ
- `y` (Numeric): 従属変数。
- `x` (Numeric): 独立変数。

`x`と`y`の両方とも基本的な数値型をサポートします。

## Returned values
返されるデータ型: FLOAT64

この関数は線形回帰直線のy切片を返します。

行が存在しない場合、またはnull値のみの行しか存在しない場合、この関数はNULLを返します。

## Examples

```sql
-- Example 1: Basic Usage
SELECT regr_intercept(y, x) FROM test;

-- Example 2: Usage in a query with sample data
SELECT * FROM test;
+------+------+------+
| id   | x    | y    |
+------+------+------+
|    1 |   18 |   13 |
|    3 |   12 |    2 |
|    5 |   10 |   20 |
|    2 |   14 |   27 |
|    4 |    5 |    6 |
+------+------+------+

SELECT regr_intercept(y, x) FROM test;
+----------------------+
| regr_intercept(y, x) |
+----------------------+
|    5.512931034482759 |
+----------------------+
```
## 使用上の注意
- この関数は、いずれかの値がnullであるペアを無視します。
- 計算結果がゼロ除算になる場合、関数はNULLを返します。

## 関連関数
REGR_SLOPE, REGR_R2, REGR_COUNT, REGR_AVGX, REGR_AVGY

## 参考資料
線形回帰関数の詳細については、集約関数に関するSQL標準ドキュメントを参照してください。
