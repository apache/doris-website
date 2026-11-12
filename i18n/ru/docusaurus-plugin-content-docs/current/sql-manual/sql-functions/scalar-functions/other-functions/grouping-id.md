---
{
    "title": "GROUPING_ID",
    "language": "ru",
    "description": "Вычисляет уровень группировки строк в запросе с GROUP BY."
}
---

## Описание {#description}

Вычисляет уровень группировки строк в запросе с GROUP BY. Функция GROUPING_ID возвращает целочисленную битовую маску, указывающую, какие столбцы из списка GROUP BY не агрегируются для данной строки результата. При наличии GROUP BY функцию можно использовать в списке SELECT, а также в предложениях HAVING или ORDER BY.

## Синтаксис {#syntax}

```sql
GROUPING_ID(<column_expression> [, ...])
```

## Параметры {#parameters}

| Параметры                | Описание                                          |
|-------------------------|---------------------------------------------------|
| `<column_expression>`   | Выражение столбца из предложения GROUP BY.         |

## Возвращаемое значение {#return-value}

Возвращает значение типа BIGINT, представляющее битовую маску группировки для заданных столбцов.

## Примеры {#examples}

### Пример A: определение уровней группировки {#example-a-identify-grouping-levels}

```sql
SELECT
  department,
  CASE 
    WHEN GROUPING_ID(department, level) = 0 THEN level
    WHEN GROUPING_ID(department, level) = 1 THEN CONCAT('Total: ', department)
    WHEN GROUPING_ID(department, level) = 3 THEN 'Total: Company'
    ELSE 'Unknown'
  END AS `Job Title`,
  COUNT(uid) AS `Employee Count`
FROM employee 
GROUP BY ROLLUP(department, level)
ORDER BY GROUPING_ID(department, level) ASC;
```

*Ожидаемый результат:*

```text
+--------------------+---------------------------+----------------+
| department         | Job Title                 | Employee Count |
+--------------------+---------------------------+----------------+
| Board of Directors | Senior                    |              2 |
| Technology         | Senior                    |              3 |
| Sales              | Senior                    |              1 |
| Sales              | Assistant                 |              2 |
| Sales              | Trainee                   |              1 |
| Marketing          | Senior                    |              1 |
| Marketing          | Trainee                   |              2 |
| Marketing          | Assistant                 |              1 |
| Board of Directors | Total: Board of Directors |              2 |
| Technology         | Total: Technology         |              3 |
| Sales              | Total: Sales              |              4 |
| Marketing          | Total: Marketing          |              4 |
| NULL               | Total: Company            |             13 |
+--------------------+---------------------------+----------------+
```

### Пример B: фильтрация набора результатов с помощью GROUPING_ID {#example-b-filter-result-set-using-grouping_id}

```sql
SELECT
  department,
  CASE 
    WHEN GROUPING_ID(department, level) = 0 THEN level
    WHEN GROUPING_ID(department, level) = 1 THEN CONCAT('Total: ', department)
    WHEN GROUPING_ID(department, level) = 3 THEN 'Total: Company'
    ELSE 'Unknown'
  END AS `Job Title`,
  COUNT(uid) AS `Count`
FROM employee 
GROUP BY ROLLUP(department, level)
HAVING `Job Title` = 'Senior';
```

*Ожидаемый результат:*

```text
+--------------------+-----------+-------+
| department         | Job Title | Count |
+--------------------+-----------+-------+
| Board of Directors | Senior    |     2 |
| Technology         | Senior    |     3 |
| Sales              | Senior    |     1 |
| Marketing          | Senior    |     1 |
+--------------------+-----------+-------+
```
