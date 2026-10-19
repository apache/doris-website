---
{
    "title": "PERCENTILE_RESERVOIR",
    "language": "ko",
    "description": "이 함수는 리저버 크기가 최대 8192인 reservoir sampling을 적용하며, 샘플링에 난수 생성기를 사용합니다."
}
---

## 설명 {#description}

이 함수는 리저버 크기가 최대 8192인 [reservoir sampling](https://en.wikipedia.org/wiki/Reservoir_sampling)을 적용하며, 샘플링에 난수 생성기를 사용합니다. 위치 `p`에서의 근사 백분위수를 계산하는 데 사용됩니다.
`p`의 값은 `0`과 `1` 사이입니다.
두 수의 평균을 구하는 것은 아니라는 점에 유의하세요.

## 구문 {#syntax}

```sql
PERCENTILE_RESERVOIR(<col>, <p>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 근사 백분위수를 계산할 컬럼입니다. 지원 타입: Double |
| `<p>` | 계산할 근사 백분위수로, 상수 값입니다. 지원 타입: Double, 값 범위: `[0.0, 1.0]`. |

## 반환값 {#return-value}

지정된 컬럼의 근사 백분위수를 반환하며, 반환 타입은 `DOUBLE`입니다.
- `NULL`을 반환합니다(입력 컬럼이 `NULL`인 경우).

## 예제 {#examples}

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

모든 입력값이 NULL이면 NULL을 반환합니다.

```text
+------------------------------+
| percentile_reservoir(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```
