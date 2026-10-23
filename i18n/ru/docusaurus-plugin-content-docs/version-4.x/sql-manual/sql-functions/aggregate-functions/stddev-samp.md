---
{
    "title": "STDDEV_SAMP",
    "language": "ru",
    "description": "Возвращает выборочное стандартное отклонение выражения expr"
}
---

## Описание {#description}

Возвращает выборочное стандартное отклонение выражения expr

## Синтаксис {#syntax}

```sql
STDDEV_SAMP(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Значение, для которого вычисляется стандартное отклонение. Поддерживается тип Double. |

## Возвращаемое значение {#return-value}

Возвращает выборочное стандартное отклонение выражения expr в виде значения типа Double.
Если в группе нет допустимых данных, возвращает NULL.

### Примеры {#examples}
```sql
-- Create sample tables
CREATE TABLE score_table (
    student_id INT,
    score DOUBLE
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO score_table VALUES
(1, 85),
(2, 90),
(3, 82),
(4, 88),
(5, 95);

-- Calculate the sample standard deviation of all students' scores
SELECT STDDEV_SAMP(score) as score_stddev
FROM score_table;
```

```text
+-------------------+
| score_stddev      |
+-------------------+
| 4.949747468305831 |
+-------------------+
```
