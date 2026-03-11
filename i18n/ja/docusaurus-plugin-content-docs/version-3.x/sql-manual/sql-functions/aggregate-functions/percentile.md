---
{
  "title": "PERCENTILE",
  "description": "小さなデータセットに適した正確なパーセンタイルを計算します。まず指定された列を降順でソートし、",
  "language": "ja"
}
---
## 説明

小さなデータセットに適した正確なパーセンタイルを計算します。まず指定されたカラムを降順でソートし、次に正確なp番目のパーセンタイルを取得します。`p`の値は`0`と`1`の間です。`p`が正確な位置を指していない場合、位置`p`の隣接する値の[線形補間](https://en.wikipedia.org/wiki/Linear_interpolation)を返します。これは2つの数値の平均ではないことに注意してください。特殊なケース：
- 入力カラムが`NULL`の場合、`NULL`を返します

## 構文

```sql
PERCENTILE(<col>, <p>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | 正確なパーセンタイルとして計算される列で、整数列である必要があります。 |
| `<p>` | 計算される正確なパーセンタイルで、定数値であり、値の範囲は `[0.0, 1.0]` です。 |

## Return Value

指定された列の正確なパーセンタイルを返し、戻り値の型は `DOUBLE` です。

## Examples

```sql
-- Create sample table
CREATE TABLE sales_data
(
    product_id INT,
    sale_price DECIMAL(10, 2)
) DUPLICATE KEY(`product_id`)
DISTRIBUTED BY HASH(`product_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
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

-- Calculate different percentiles of sales prices
SELECT 
    percentile(sale_price, 0.5)  as median_price,     -- Median
    percentile(sale_price, 0.75) as p75_price,        -- 75th percentile
    percentile(sale_price, 0.90) as p90_price,        -- 90th percentile
    percentile(sale_price, 0.95) as p95_price,        -- 95th percentile
    percentile(null, 0.99)       as p99_null          -- Null value at 99th percentile
FROM sales_data;
```
```text
+--------------+-----------+-------------------+-------------------+----------+
| median_price | p75_price | p90_price         | p95_price         | p99_null |
+--------------+-----------+-------------------+-------------------+----------+
|         32.5 |     43.75 | 54.99999999999998 | 77.49999999999994 |     NULL |
+--------------+-----------+-------------------+-------------------+----------+
```
