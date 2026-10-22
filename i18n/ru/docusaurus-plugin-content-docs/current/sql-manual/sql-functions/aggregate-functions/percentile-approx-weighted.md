---
{
    "title": "PERCENTILE_APPROX_WEIGHTED",
    "language": "ru",
    "description": "Функция PERCENTILEAPPROXWEIGHTED вычисляет взвешенные приближённые процентили,"
}
---

## Описание {#description}

Функция `PERCENTILE_APPROX_WEIGHTED` вычисляет взвешенные приближённые процентили и применяется преимущественно в случаях, когда необходимо учитывать значимость значений. Это взвешенная версия функции `PERCENTILE_APPROX`, позволяющая задать вес для каждого значения.

Основные особенности:
1. Поддержка весов: каждому значению можно назначить вес, влияющий на итоговый расчёт процентиля
2. Эффективное использование памяти: использует фиксированный объём памяти, сохраняя низкое потребление памяти даже при обработке столбцов с низкой кардинальностью (большой объём данных при небольшом количестве различных элементов)
3. Настраиваемая точность: параметр сжатия позволяет найти баланс между точностью и производительностью

## Синтаксис {#syntax}

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<col>` | Столбец, для которого вычисляется процентиль. Поддерживаемый тип: Double |
| `<weight>` | Столбец весов; значения должны быть положительными числами. Поддерживаемый тип: Double |
| `<p>` | Значение процентиля в диапазоне `[0.0, 1.0]`, например, `0.99` соответствует `99`-му процентилю |
| `<compression>` | Необязательный параметр, поддерживаемый тип: Double. Коэффициент сжатия в диапазоне `[2048, 10000]`. Чем выше значение, тем выше точность, но тем больше потребление памяти. Если параметр не указан или выходит за пределы диапазона, используется `10000`. |

## Возвращаемое значение {#return-value}

Возвращает значение типа `DOUBLE`, представляющее вычисленный взвешенный приближённый процентиль.
Если в группе нет допустимых данных, возвращает `NULL`.

## Примеры {#examples}

```sql
-- Create sample table
CREATE TABLE weighted_scores (
    student_id INT,
    score DECIMAL(10, 2),
    weight INT
) DUPLICATE KEY(student_id)
DISTRIBUTED BY HASH(student_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert example data
INSERT INTO weighted_scores VALUES
(1, 85.5, 1),   -- Normal homework score, weight 1
(2, 90.0, 2),   -- Important homework score, weight 2
(3, 75.5, 1),
(4, 95.5, 3),   -- Very important homework, weight 3
(5, 88.0, 2),
(6, 92.5, 2),
(7, 78.0, 1),
(8, 89.5, 2),
(9, 94.0, 3),
(10, 83.5, 1);

-- Calculate weighted scores distribution
SELECT 
    -- Calculate 90th percentile for different compression ratios
    percentile_approx_weighted(score, weight, 0.9) as p90_default,          -- Default compression ratio
    percentile_approx_weighted(score, weight, 0.9, 2048) as p90_fast,       -- Lower compression ratio, faster
    percentile_approx_weighted(score, weight, 0.9, 10000) as p90_accurate   -- Higher compression ratio, more accurate
FROM weighted_scores;
```

```text
+------------------+------------------+------------------+
| p90_default      | p90_fast         | p90_accurate     |
+------------------+------------------+------------------+
| 95.3499984741211 | 95.3499984741211 | 95.3499984741211 |
+------------------+------------------+------------------+
```


```sql
select percentile_approx_weighted(if(score>95,score,null), weight, 0.9) from weighted_scores;
```

При расчёте учитываются только входные значения, отличные от NULL.

```text
+------------------------------------------------------------------+
| percentile_approx_weighted(if(score>95,score,null), weight, 0.9) |
+------------------------------------------------------------------+
|                                                             95.5 |
+------------------------------------------------------------------+
```

```sql
select percentile_approx_weighted(score, weight, 0.9, null) from weighted_scores;
```

Если все входные значения равны NULL, функция возвращает NULL.

```text
+------------------------------------------------------+
| percentile_approx_weighted(score, weight, 0.9, null) |
+------------------------------------------------------+
|                                                 NULL |
+------------------------------------------------------+
```
