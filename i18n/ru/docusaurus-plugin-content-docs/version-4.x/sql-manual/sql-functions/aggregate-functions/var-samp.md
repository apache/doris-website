---
{
    "title": "VAR_SAMP,VARIANCE_SAMP",
    "language": "ru",
    "description": "Функция VARSAMP вычисляет выборочную дисперсию заданного выражения. В отличие от VARIANCE (дисперсии генеральной совокупности), VARSAMP использует n-1 в качестве делителя,"
}
---

## Описание {#description}

Функция VAR_SAMP вычисляет выборочную дисперсию заданного выражения. В отличие от VARIANCE (дисперсии генеральной совокупности), VAR_SAMP использует в качестве делителя n-1, что в статистике позволяет получить несмещённую оценку дисперсии генеральной совокупности.

## Псевдоним {#alias}

- VARIANCE_SAMP

## Синтаксис {#syntax}

```sql
VAR_SAMP(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Столбец или выражение, для которого вычисляется выборочная дисперсия. Поддерживается тип Double. |

## Возвращаемое значение {#return-value}
Возвращает значение типа Double, представляющее вычисленную выборочную дисперсию.
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

-- Calculate sample variance of student scores
SELECT 
    VAR_SAMP(score) as sample_variance,
    VARIANCE(score) as population_variance
FROM student_scores;
```

```text
+------------------+---------------------+
| sample_variance  | population_variance |
+------------------+---------------------+
| 29.4107142857143 |   25.73437500000001 |
+------------------+---------------------+
```
