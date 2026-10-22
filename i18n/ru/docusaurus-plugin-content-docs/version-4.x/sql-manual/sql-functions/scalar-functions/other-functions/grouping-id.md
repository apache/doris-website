---
{
    "title": "GROUPING_ID",
    "language": "ru",
    "description": "Вычисляет уровень группировки строк в запросе с GROUP BY."
}
---

## Описание {#description}

Вычисляет уровень группировки строк в запросе с GROUP BY. Функция GROUPING_ID возвращает целочисленную битовую маску, указывающую, какие столбцы из списка GROUP BY не агрегируются для данной строки результата. Её можно использовать в списке SELECT или в предложении HAVING, если указан GROUP BY.

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

### Пример A: фильтрация набора результатов с помощью GROUPING_ID {#example-a-filter-result-set-using-grouping_id}

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
