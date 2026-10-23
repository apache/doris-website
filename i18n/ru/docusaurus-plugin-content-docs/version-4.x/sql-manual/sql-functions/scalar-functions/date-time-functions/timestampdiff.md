---
{
    "title": "TIMESTAMPDIFF",
    "language": "ru",
    "description": "Та же функциональность, что и у функции date-diff. Функция TIMESTAMPDIFF вычисляет разницу между двумя значениями даты и времени и возвращает результат "
}
---

## Описание {#description}

Та же функциональность, что и у [функции date-diff](./datediff).
Функция TIMESTAMPDIFF вычисляет разницу между двумя значениями даты и времени и возвращает результат в указанных единицах времени. Функция поддерживает различные единицы времени: секунды, минуты, часы, дни, недели, месяцы и годы.

Поведение этой функции соответствует поведению [функции timestampdiff](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampdiff) в MySQL.

## Синтаксис {#syntax}

```sql
TIMESTAMPDIFF(<unit>, <date_or_time_expr1>, <date_or_time_expr2>)
```

## Параметры {#parameters}

| Параметр                 | Описание                                                                                                                                                                                                                                                                                                                                                    |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<unit>`                 | Единица времени, в которой возвращается разница. Распространённые значения: SECOND, MINUTE, HOUR, DAY, MONTH, QUARTER, YEAR и т. д.                                                                                                                                                                                                                              |
| `<date_or_time_expr1>`   | Первое значение даты и времени, начало интервала. Поддерживаются входные значения типов date/datetime. Сведения о форматах даты и времени и даты см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>`   | Второе значение даты и времени, конец интервала. Поддерживаются входные значения типов date/datetime                                                                                                                                                                                                                                                         |

## Возвращаемое значение {#return-value}

Возвращает разницу между двумя значениями даты и времени в виде значения типа BIGINT.

- Если `<date_or_time_expr2>` позже, чем `<date_or_time_expr1>`, возвращает положительное число
- Если `<date_or_time_expr2>` раньше, чем `<date_or_time_expr1>`, возвращает отрицательное число
- Если какой-либо параметр равен NULL, возвращает NULL
- Если `<unit>` задаёт неподдерживаемую единицу времени, возвращает ошибку
- При вычислении разницы в заданных единицах учитывается и следующая, более мелкая единица; например, проверяется, достигает ли фактическая разница одного дня, и если нет, возвращается 0
- Особый случай при вычислении разницы в месяцах: например, разница между 1-31 и 2-28 составляет один месяц
- При вводе значения типа date время по умолчанию равно 00:00:00

## Примеры {#examples}

```sql
-- Calculate month difference between two dates
SELECT TIMESTAMPDIFF(MONTH, '2003-02-01', '2003-05-01') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- Calculate year difference (end date earlier than start date, returns negative value)
SELECT TIMESTAMPDIFF(YEAR, '2002-05-01', '2001-01-01') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

-- Calculate minute difference
SELECT TIMESTAMPDIFF(MINUTE, '2003-02-01', '2003-05-01 12:05:55') AS result;
+--------+
| result |
+--------+
| 128885 |
+--------+

-- Real difference insufficient for one day
SELECT TIMESTAMPDIFF(DAY, '2023-12-31 23:59:50', '2024-01-01 00:00:05') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Invalid unit QUARTER, returns error
SELECT TIMESTAMPDIFF(QUAR, '2023-01-01', '2023-07-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: QUAR, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- Special case for month calculation (end of month crossing months)
SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-28') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-27') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL (returns NULL)
SELECT TIMESTAMPDIFF(DAY, NULL, '2023-01-01'), TIMESTAMPDIFF(DAY, '2023-01-01', NULL) AS result;
+---------------------------------------+--------+
| timestampdiff(DAY, NULL, '2023-01-01') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+

-- Week difference calculation
SELECT TIMESTAMPDIFF(WEEK, '2023-01-01', '2023-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

```
