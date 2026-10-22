---
{
    "title": "SUM",
    "language": "ru",
    "description": "Возвращает сумму всех значений выбранного поля"
}
---

## Описание {#description}

Возвращает сумму всех значений выбранного поля

## Синтаксис {#syntax}

```sql
SUM(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<expr>` | Поле, для которого вычисляется сумма. Поддерживаются типы Double, Float, Decimal, LargeInt, BigInt, Integer, SmallInt, TinyInt. |

## Возвращаемое значение {#return-value}

Возвращает сумму всех значений выбранного поля.
Если в группе нет допустимых данных, возвращает NULL.

## Примеры {#examples}
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
