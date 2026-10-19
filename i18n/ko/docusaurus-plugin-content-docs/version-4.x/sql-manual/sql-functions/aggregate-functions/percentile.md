---
{
    "title": "PERCENTILE",
    "language": "ko",
    "description": "정확한 백분위수를 계산하며, 작은 데이터 세트에 적합합니다. 먼저 지정된 열을 내림차순으로 정렬한 다음,"
}
---

## 설명 {#description}

정확한 백분위수를 계산하며, 작은 데이터 세트에 적합합니다. 먼저 지정된 열을 내림차순으로 정렬한 다음, 정확한 p번째 백분위수를 구합니다. `p`의 값은 `0`과 `1` 사이입니다. `p`가 정확한 위치를 가리키지 않으면, 인접한 값 사이의 [선형 보간](https://en.wikipedia.org/wiki/Linear_interpolation)을 통해 `p` 위치의 값을 반환합니다. 이 값은 두 수의 평균이 아니라는 점에 유의하세요. 특수한 경우:

## 구문 {#syntax}

```sql
PERCENTILE(<col>, <p>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 정확한 백분위수를 계산할 열입니다. 지원 타입: Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt. |
| `<p>` | 계산할 정확한 백분위수로, 상수 값입니다. 지원 타입: Double. 범위: `[0.0, 1.0]`. 두 번째 매개변수는 상수여야 합니다. |

## 반환 값 {#return-value}

지정된 열의 정확한 백분위수를 반환하며, 반환 타입은 Double입니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#examples}

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

다양한 백분위수에 해당하는 판매 가격을 계산합니다.

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

NULL이 아닌 입력 값만 계산에 사용합니다.

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

모든 입력 값이 NULL이면 NULL을 반환합니다.

```text
+------------------------------+
| percentile(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```
