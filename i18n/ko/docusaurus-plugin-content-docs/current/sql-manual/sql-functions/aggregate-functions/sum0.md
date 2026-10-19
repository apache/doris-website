---
{
    "title": "SUM0",
    "language": "ko",
    "description": "선택한 필드의 모든 값에 대한 합계를 반환합니다. SUM 함수와 달리 모든 입력값이 NULL이면 SUM0 함수는 NULL 대신 0을 반환합니다."
}
---

## 설명 {#description}

선택한 필드의 모든 값에 대한 합계를 반환합니다. SUM 함수와 달리 모든 입력값이 NULL이면 SUM0 함수는 NULL 대신 0을 반환합니다.

## 구문 {#syntax}

```sql
SUM0(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 합계를 계산할 필드입니다. Double, Float, Decimal, LargeInt, BigInt, Integer, SmallInt, TinyInt 타입을 지원합니다. |

## 반환값 {#return-value}

선택한 필드의 모든 값에 대한 합계를 반환합니다. 모든 값이 NULL이면 0을 반환합니다.

## 예제 {#examples}

```sql
-- Create example table
CREATE TABLE sales_table (
    product_id INT,
    price DECIMAL(10,2),
    quantity INT,
    discount DECIMAL(10,2)
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO sales_table VALUES
(1, 99.99, 2, NULL),
(2, 159.99, 1, NULL),
(3, 49.99, 5, NULL),
(4, 299.99, 1, NULL),
(5, 79.99, 3, NULL);

-- Compare SUM and SUM0
SELECT 
    SUM(discount) as sum_discount,    -- Returns NULL
    SUM0(discount) as sum0_discount   -- Returns 0
FROM sales_table;
```

```text
+--------------+---------------+
| sum_discount | sum0_discount |
+--------------+---------------+
|         NULL |          0.00 |
+--------------+---------------+
```
