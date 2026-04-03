---
{
  "title": "PERCENTILE_RESERVOIR",
  "description": "この関数は、最大8192のリザーバーサイズとサンプリング用の乱数ジェネレーターを使用してreservoir samplingを適用します。",
  "language": "ja"
}
---
## 説明

この関数は、最大8192のリザーバーサイズと、サンプリング用の乱数生成器を使用して[reservoir sampling](https://en.wikipedia.org/wiki/Reservoir_sampling)を適用します。これは位置`p`における近似パーセンタイルの計算に使用されます。
`p`の値は`0`と`1`の間です。
これは2つの数値の平均ではないことに注意してください。

## 構文

```sql
PERCENTILE_RESERVOIR(<col>, <p>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | 近似パーセンタイルとして計算される列、サポートされる型: Double |
| `<p>` | 計算される近似パーセンタイル、定数値、サポートされる型: `[0.0, 1.0]`の値範囲を持つDouble |

## Return Value

指定された列の近似パーセンタイルを返します。戻り値の型は`DOUBLE`です。
- 入力列が`NULL`の場合、`NULL`を返します

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
    percentile_reservoir(sale_price, 0.5)  as median_price,     -- Median
    percentile_reservoir(sale_price, 0.75) as p75_price,        -- 75th percentile
    percentile_reservoir(sale_price, 0.90) as p90_price,        -- 90th percentile
    percentile_reservoir(sale_price, 0.95) as p95_price,        -- 95th percentile
    percentile_reservoir(null, 0.99)       as p99_null          -- Null value at 99th percentile
FROM sales_data;
```
```text
+--------------+-----------+-------------------+-------------------+----------+
| median_price | p75_price | p90_price         | p95_price         | p99_null |
+--------------+-----------+-------------------+-------------------+----------+
|         32.5 |     43.75 | 54.99999999999998 | 77.49999999999994 |     NULL |
+--------------+-----------+-------------------+-------------------+----------+
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
