---
{
    "title": "PERCENTILE",
    "language": "ru",
    "description": "Вычисляет точный процентиль, подходит для небольших наборов данных. Сначала сортирует указанный столбец по убыванию,"
}
---

## Описание {#description}

Вычисляет точный процентиль, подходит для небольших наборов данных. Сначала сортирует указанный столбец по убыванию, затем определяет точный p-й процентиль. Значение `p` находится в диапазоне от `0` до `1`. Если `p` не соответствует точной позиции, функция возвращает [линейную интерполяцию](https://en.wikipedia.org/wiki/Linear_interpolation) соседних значений в позиции `p`. Обратите внимание: это не среднее арифметическое двух чисел. Особые случаи:

## Синтаксис {#syntax}

```sql
PERCENTILE(<col>, <p>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<col>` | Столбец, для которого требуется вычислить точный процентиль. Поддерживаемые типы: Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt. |
| `<p>` | Точный процентиль, который требуется вычислить; постоянное значение. Поддерживаемый тип: Double. Диапазон: `[0.0, 1.0]`. Второй параметр должен быть константой. |

## Возвращаемое значение {#return-value}

Возвращает точный процентиль указанного столбца. Тип возвращаемого значения: Double.
Если в группе нет допустимых данных, возвращает NULL.

## Примеры {#examples}

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

Вычисляет цены продажи для разных процентилей.

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

В расчёте учитываются только входные значения, отличные от NULL.

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

Если все входные значения равны NULL, возвращает NULL.

```text
+------------------------------+
| percentile(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```
