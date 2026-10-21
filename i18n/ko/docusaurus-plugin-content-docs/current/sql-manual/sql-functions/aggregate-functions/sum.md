---
{
    "title": "SUM",
    "language": "ko",
    "description": "선택한 필드의 모든 값의 합계를 반환합니다"
}
---

## 설명 {#description}

선택한 필드의 모든 값의 합계를 반환합니다.

## 구문 {#syntax}

```sql
SUM(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<expr>` | 합계를 계산할 필드입니다. Double, Float, Decimal, LargeInt, BigInt, Integer, SmallInt, TinyInt 타입을 지원합니다. |

## 반환 값 {#return-value}

선택한 필드의 모든 값의 합계를 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#examples}
```sql
-- Create sample tables
CREATE TABLE sales_table (
    product_id INT,
    price DECIMAL(10,2),
    quantity INT
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO sales_table VALUES
(1, 99.99, 2),
(2, 159.99, 1),
(3, 49.99, 5),
(4, 299.99, 1),
(5, 79.99, 3);

-- Calculate the total sales amount
SELECT SUM(price * quantity) as total_sales
FROM sales_table;
```

```text
+-------------+
| total_sales |
+-------------+
|     1149.88 |
+-------------+
```
