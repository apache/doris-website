---
{
  "title": "PERCENTILE",
  "description": "指定された列を降順でソートした後、小さなデータセットに適した正確なパーセンタイルを計算します。",
  "language": "ja"
}
---
## 概要

小さなデータセットに適した正確なパーセンタイルを計算します。最初に指定された列を降順でソートし、その後正確なp番目のパーセンタイルを取得します。`p`の値は`0`から`1`の間です。`p`が正確な位置を指していない場合、位置`p`における隣接する値の[線形補間](https://en.wikipedia.org/wiki/Linear_interpolation)を返します。これは2つの数値の平均ではないことに注意してください。特殊なケース：

## 構文

```sql
PERCENTILE(<col>, <p>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | 正確なパーセンタイルを計算する列。サポートされる型：Double、Float、LargeInt、BigInt、Int、SmallInt、TinyInt。 |
| `<p>` | 計算する正確なパーセンタイル、定数値。サポートされる型：Double。範囲：`[0.0, 1.0]`。2番目のパラメータは定数である必要があります。 |

## Return Value

指定された列の正確なパーセンタイルを返します。戻り値の型はDoubleです。
グループ内に有効なデータがない場合、NULLを返します。

## Examples

```sql
-- Setup
CREATE TABLE sales_data
(
    product_id INT,
    sale_price DECIMAL(10, 2)
) DUPLICATE KEY(`product_id`)
DISTRIBUTED BY HASH(`product_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO sales_data VALUES
(1, 10.00),
(1, 15.00),
(1, 20.00),
(1, 25.00),
(1, 30.00),
(1, 35.00),
(1, 40.00),
(1, 45.00),
(1, 50.00),
(1, 100.00);
```
```sql
SELECT 
    percentile(sale_price, 0.5)  as median_price,     -- Median
    percentile(sale_price, 0.75) as p75_price,        -- 75th percentile
    percentile(sale_price, 0.90) as p90_price,        -- 90th percentile
    percentile(sale_price, 0.95) as p95_price,        -- 95th percentile
    percentile(null, 0.99)       as p99_null          -- Null value at 99th percentile
FROM sales_data;
```
異なるパーセンタイルでの販売価格を計算します。

```text
+--------------+-----------+-------------------+-------------------+----------+
| median_price | p75_price | p90_price         | p95_price         | p99_null |
+--------------+-----------+-------------------+-------------------+----------+
|         32.5 |     43.75 | 54.99999999999998 | 77.49999999999994 |     NULL |
+--------------+-----------+-------------------+-------------------+----------+
```
```sql
select percentile(if(sale_price>90,sale_price,NULL), 0.5) from sales_data;
```
NULL以外の入力値のみが計算で考慮されます。

```text
+----------------------------------------------------+
| percentile(if(sale_price>90,sale_price,NULL), 0.5) |
+----------------------------------------------------+
|                                                100 |
+----------------------------------------------------+
```
```sql
select percentile(sale_price, NULL) from sales_data;
```
すべての入力値がNULLの場合、NULLを返します。

```text
+------------------------------+
| percentile(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```
