---
{
    "title": "PERCENTILE_RESERVOIR",
    "language": "ja",
    "description": "この関数は、最大 8192 件のリザーバーと乱数生成器を使ってリザーバーサンプリングを行います。"
}
---

## 説明

この関数は、最大 8192 件のリザーバーと乱数生成器を使って[リザーバーサンプリング](https://en.wikipedia.org/wiki/Reservoir_sampling)を行います。これを使用して位置 `p` の近似パーセンタイルを計算します。
`p` の値は `0` から `1` の間です。
これは二つの数値の平均ではないことに注意してください。

## 構文

```sql
PERCENTILE_RESERVOIR(<col>, <p>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | 近似パーセンタイルを計算する列。Double 型をサポートします。 |
| `<p>` | 計算する近似パーセンタイルを指定する定数。Double 型をサポートし、範囲は `[0.0, 1.0]` です。 |

## 戻り値

指定した列の近似パーセンタイルを `DOUBLE` 型で返します。
- 入力列が `NULL` の場合は `NULL` を返します

## 使用例

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
select percentile_reservoir(sale_price, NULL) from sales_data;
```

すべての入力値が NULL の場合は NULL を返します。

```text
+------------------------------+
| percentile_reservoir(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```