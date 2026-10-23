---
{
    "title": "CENTURY",
    "language": "ru",
    "description": "Возвращает век, к которому относится указанная дата. Если входное значение некорректно или выходит за пределы поддерживаемого диапазона, возвращает NULL."
}
---

## Описание {#description}
Возвращает век, к которому относится указанная дата.
Если входное значение некорректно или выходит за пределы поддерживаемого диапазона, возвращает NULL.

## Синтаксис {#syntax}
```sql
CENTURY(`<date_or_time_expr>`)
```

## Параметры {#parameters}
| Параметр     | Описание                                                   |
| ------------- | ------------------------------------------------------------- |
| `<date_or_time_expr>` | Выражение типа `DATE`, `DATETIME` или `TIMESTAMP_NS`. |

## Возвращаемое значение {#return-value}
Возвращает целое число (INT), обозначающее век, к которому относится входная дата. Например, годы с 1901 по 2000 относятся к 20-му веку. Возвращает NULL, если входное значение равно NULL или содержит некорректную дату.

## Примеры {#examples}
```sql
-- Extract the century from a DATE type
SELECT CENTURY('2024-01-01') AS century_date;
+-----------------+
| century_date    |
+-----------------+
| 21              |
+-----------------+

-- Extract the century from a DATETIME type (ignoring hours, minutes, and seconds)
SELECT CENTURY('2024-05-20 14:30:25') AS century_datetime;
+----------------------+ 
| century_datetime     |
+----------------------+
| 21                   |
+----------------------+

-- Input is NULL (returns NULL)
SELECT CENTURY(NULL) AS null_input;
+----------------+
| null_input     |
+----------------+
| NULL           |
+----------------+

-- Invalid date input (returns NULL)
SELECT CENTURY('10000-01-01') AS invalid_date;
+-------------------+
| invalid_date      |
+-------------------+
| NULL              |
+-------------------+


```
