---
{
    "title": "SUM0",
    "language": "ru",
    "description": "Возвращает сумму всех значений выбранного поля. В отличие от функции SUM, если все входные значения равны NULL, SUM0 возвращает 0 вместо NULL."
}
---

## Описание {#description}

Возвращает сумму всех значений выбранного поля. В отличие от функции SUM, если все входные значения равны NULL, SUM0 возвращает 0 вместо NULL.

## Синтаксис {#syntax}

```sql
SUM0(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Поле, для которого вычисляется сумма. Поддерживаются типы Double, Float, Decimal, LargeInt, BigInt, Integer, SmallInt, TinyInt. |

## Возвращаемое значение {#return-value}

Возвращает сумму всех значений выбранного поля. Если все значения равны NULL, возвращает 0.

## Примеры {#examples}

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
