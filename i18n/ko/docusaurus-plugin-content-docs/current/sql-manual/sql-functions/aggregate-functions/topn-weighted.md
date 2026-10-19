---
{
    "title": "TOPN_WEIGHTED",
    "language": "ko",
    "description": "TOPNWEIGHTED 함수는 가중치를 적용해 집계한 빈도를 기준으로 지정된 열에서 가장 자주 나타나는 N개의 값을 반환합니다. 일반 TOPN 함수와 달리,"
}
---

## 설명 {#description}

TOPN_WEIGHTED 함수는 가중치를 적용해 집계한 빈도를 기준으로 지정된 열에서 가장 자주 나타나는 N개의 값을 반환합니다. 일반 TOPN 함수와 달리 TOPN_WEIGHTED는 가중치를 통해 값의 중요도를 조정할 수 있습니다.

## 구문 {#syntax}

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 집계할 열 또는 표현식입니다. 지원되는 타입: Boolean (Doris 4.1 시리즈에서는 4.1.5부터 지원), TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, IPV4, IPV6, UUID, String. |
| `<weight>` | 가중치를 조정하는 데 사용할 열 또는 표현식입니다. 타입: BIGINT.|
| `<top_num>` | 반환할 최빈값의 개수입니다. 양의 INT 상수여야 합니다. |
| `<space_expand_rate>` | 선택적 INT 상수이며 기본값은 50입니다. 양수이면 중간 상태를 직렬화할 때 후보를 최대 `top_num * space_expand_rate`개 유지합니다. 일반적으로 값이 클수록 정확도가 높아집니다. 이 값은 로컬 집계 메모리의 엄격한 상한이 아닙니다. Doris 4.1 시리즈에서는 4.1.5부터 값이 0 이하이면 모든 중간 후보를 유지하지만, 최종 결과에는 여전히 최대 `top_num`개의 값만 포함됩니다. 이 모드에서는 메모리를 더 많이 사용할 수 있으며 쿼리 메모리 제한이 계속 적용됩니다. |

## 반환값 {#return-value}

가중치를 적용한 집계값이 가장 높은 N개의 값을 담은 배열을 반환합니다.
그룹에 유효한 데이터가 없으면 NULL을 반환합니다.

## 예제 {#example}
```sql
-- setup
CREATE TABLE product_sales (
    product_id INT,
    sale_amount DECIMAL(10,2),
    sale_date DATE
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO product_sales VALUES
(1, 100.00, '2024-01-01'),
(2, 50.00, '2024-01-01'),
(1, 150.00, '2024-01-01'),
(3, 75.00, '2024-01-01'),
(1, 200.00, '2024-01-01'),
(2, 80.00, '2024-01-01'),
(1, 120.00, '2024-01-01'),
(4, 90.00, '2024-01-01');
```

```sql
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales;
```

판매 금액을 가중치로 사용하여 상위 3개 제품을 구합니다.

```text
+--------------+
| top_products |
+--------------+
| [1, 2, 4]    |
+--------------+
```

```sql
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales where product_id is null;
```

판매 금액을 가중치로 사용하여 상위 3개 제품을 구합니다.

```text
+--------------+
| top_products |
+--------------+
| NULL         |
+--------------+
```

BOOLEAN 입력(Doris 4.1 시리즈에서는 4.1.5부터 지원):

```sql
SELECT TOPN_WEIGHTED(TRUE, 1, 2), TOPN_WEIGHTED(CAST(NULL AS BOOLEAN), 1, 2);
```

```text
[1]    NULL
```
