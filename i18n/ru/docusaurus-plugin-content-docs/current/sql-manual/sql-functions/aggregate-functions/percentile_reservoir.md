---
{
    "title": "PERCENTILE_RESERVOIR",
    "language": "ru",
    "description": "Эта функция использует резервуарную выборку с размером резервуара до 8192 и генератор случайных чисел для отбора элементов."
}
---

## Описание {#description}

Эта функция использует [резервуарную выборку](https://en.wikipedia.org/wiki/Reservoir_sampling) с размером резервуара до 8192 и генератор случайных чисел для отбора элементов. Она применяется для вычисления приближённых процентилей в позиции `p`.
Значение `p` находится в диапазоне от `0` до `1`.
Обратите внимание, что результат не является средним арифметическим двух чисел.

## Синтаксис {#syntax}

```sql
PERCENTILE_RESERVOIR(<col>, <p>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<col>` | Столбец, для которого вычисляется приближённый процентиль. Поддерживаемый тип: Double |
| `<p>` | Вычисляемый приближённый процентиль, постоянное значение. Поддерживаемый тип: Double с диапазоном значений `[0.0, 1.0]`. |

## Возвращаемое значение {#return-value}

Возвращает приближённый процентиль указанного столбца. Тип возвращаемого значения: `DOUBLE`.
- Возвращает `NULL`, если входной столбец содержит `NULL`

## Примеры {#examples}

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

Если все входные значения равны NULL, возвращается NULL.

```text
+------------------------------+
| percentile_reservoir(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```
