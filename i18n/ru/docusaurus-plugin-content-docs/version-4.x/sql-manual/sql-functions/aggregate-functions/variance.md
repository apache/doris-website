---
{
    "title": "VARIANCE,VAR_POP,VARIANCE_POP",
    "language": "ru",
    "description": "Функция VARIANCE вычисляет статистическую дисперсию заданного выражения."
}
---

## Описание {#description}

Функция VARIANCE вычисляет статистическую дисперсию заданного выражения. Она характеризует разброс значений в наборе чисел относительно их среднего арифметического.

## Псевдонимы {#alias}

- VAR_POP
- VARIANCE_POP

## Синтаксис {#syntax}

```sql
VARIANCE(<expr>)
```

## Параметры {#parameters}
| Параметр | Описание |
| -- | -- |
| `<expr>` | Столбец или выражение, для которого вычисляется дисперсия. Поддерживается тип Double. |

## Возвращаемое значение {#return-value}
Возвращает значение типа Double, представляющее вычисленную дисперсию.
Если в группе нет допустимых данных, возвращает NULL.

## Примеры {#examples}
```sql
-- Create sample table
CREATE TABLE student_scores (
    student_id INT,
    score DECIMAL(4,1)
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO student_scores VALUES
(1, 85.5),
(2, 92.0),
(3, 78.5),
(4, 88.0),
(5, 95.5),
(6, 82.0),
(7, 90.0),
(8, 87.5);
-- Calculate variance of student scores
SELECT VARIANCE(score) as score_variance
FROM student_scores;
```

```text
+-------------------+
| score_variance    |
+-------------------+
| 25.73437499999998 |
+-------------------+
```
