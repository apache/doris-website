---
{
    "title": "PERCENTILE",
    "language": "ja",
    "description": "小規模なデータセットに適した、正確なパーセンタイルを計算します。指定した列を降順にソートします。"
}
---

## 説明

小規模なデータセットに適した、正確なパーセンタイルを計算します。まず指定した列を降順にソートし、正確な p 番目のパーセンタイルを取得します。`p` の値は `0` から `1` の間です。`p` が正確な位置を指さない場合は、隣接する値を[線形補間](https://en.wikipedia.org/wiki/Linear_interpolation)して `p` の位置の値を返します。これは二つの数値の平均ではないことに注意してください。特殊なケース:

## 構文

```sql
PERCENTILE(<col>, <p>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | 正確なパーセンタイルを計算する列。Double、Float、LargeInt、BigInt、Int、SmallInt、TinyInt 型をサポートします。 |
| `<p>` | 計算する正確なパーセンタイルを指定する定数。サポートされる型は Double、範囲は `[0.0, 1.0]` です。二番目の引数は定数である必要があります。 |

## 戻り値

指定した列の正確なパーセンタイルを Double 型で返します。
グループ内に有効なデータがない場合は NULL を返します。

## 使用例

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

販売価格の複数のパーセンタイルを計算します。

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

計算には NULL 以外の入力値のみを使用します。

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

すべての入力値が NULL の場合は NULL を返します。

```text
+------------------------------+
| percentile(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```
