---
{
    "title": "PERCENTILE_RESERVOIR",
    "language": "zh-CN"
}
---

## 描述

计算近似的第 `p` 位百分数。
该函数采用[reservoir sampling](https://en.wikipedia.org/wiki/Reservoir_sampling)算法，reservoir最大容量为8192，并使用随机数生成器进行抽样，结果是非确定性的。适用于大数据量下。
`p` 的值介于 `0` 到 `1` 之间，并注意这不是两数字的平均数。特殊情况：
- 当输入的列为 `NULL` 时，返回 `NULL`

## 语法

```sql
PERCENTILE_RESERVOIR(<col>, <p>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要被计算近似的百分位数的列，必须是整数类型的列。 |
| `<p>` | 需要近似的百分位数，常量，取值为 `[0.0, 1.0]`。 |

## 返回值

返回指定列的近似的百分位数，类型为 `DOUBLE`。

## 举例

```sql
-- 创建示例表
CREATE TABLE sales_data
(
    product_id INT,
    sale_price DECIMAL(10, 2)
) DUPLICATE KEY(`product_id`)
DISTRIBUTED BY HASH(`product_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- 插入示例数据
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

-- 计算不同百分位的销售价格
SELECT 
    percentile_reservoir(sale_price, 0.5)  as median_price,     -- 中位数
    percentile_reservoir(sale_price, 0.75) as p75_price,        -- 75 分位数
    percentile_reservoir(sale_price, 0.90) as p90_price,        -- 90 分位数
    percentile_reservoir(sale_price, 0.95) as p95_price,        -- 95 分位数
    percentile_reservoir(null, 0.99)       as p99_null          -- null 的 99 分位数
FROM sales_data;
```

```text
+--------------+-----------+-------------------+-------------------+----------+
| median_price | p75_price | p90_price         | p95_price         | p99_null |
+--------------+-----------+-------------------+-------------------+----------+
|         32.5 |     43.75 | 54.99999999999998 | 77.49999999999994 |     NULL |
+--------------+-----------+-------------------+-------------------+----------+
```


