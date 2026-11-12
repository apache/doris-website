---
{
    "title": "MONTHS_DIFF",
    "language": "ru",
    "description": "Функция MONTHSDIFF вычисляет целочисленную разность в месяцах между двумя значениями даты и времени,"
}
---

## Описание {#description}

Функция MONTHS_DIFF вычисляет целочисленную разность в месяцах между двумя значениями даты и времени, возвращая количество месяцев, полученное при вычитании `<startdate>` из `<enddate>`. Функция поддерживает типы DATE и DATETIME, выполняя вычисления только на основе даты (года, месяца, дня) и игнорируя время (часы, минуты, секунды).

## Синтаксис {#syntax}

```sql
MONTHS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr1>` | Конечная дата. Поддерживаются типы date/datetime. Подробнее о форматах datetime и date см. в разделах [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<date_or_time_expr2>` | Начальная дата. Поддерживаются типы date/datetime. |

## Возвращаемое значение {#return-value}

Возвращает количество месяцев, полученное при вычитании `<date_or_time_expr2>` из `<date_or_time_expr1>`, в виде значения типа BIGINT.

Базовая разность = (год конечной даты - год начальной даты) × 12 + (месяц конечной даты - месяц начальной даты);
Если день месяца конечной даты меньше дня месяца начальной даты, то итоговый результат = базовая разность - 1;
В противном случае итоговый результат = базовая разность.

- Если `<date_or_time_expr1>` предшествует `<date_or_time_expr2>`, возвращается отрицательное значение (логика вычисления та же, меняется только знак);
- Если любой из параметров равен NULL, возвращается NULL;
- Учитывается, составляет ли фактическая разница полный месяц (с учётом дней, часов и т. д.).

## Примеры {#examples}

```sql
--- Year-month difference is 1, and end day < start day (result minus 1)
SELECT MONTHS_DIFF('2020-03-28', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Year-month difference is 1, and end day = start day
SELECT MONTHS_DIFF('2020-03-29', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Year-month difference is 1, and end day > start day
SELECT MONTHS_DIFF('2020-03-30', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- End date is earlier than start date (negative value logic is the same)
SELECT MONTHS_DIFF('2020-02-29', '2020-03-28') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

SELECT MONTHS_DIFF('2020-02-29', '2020-03-29') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

--- Same month (result is 0)
SELECT MONTHS_DIFF('2023-07-15', '2023-07-30') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--Takes into account whether there is an actual full month difference (including days, hours, etc.)
mysql> SELECT MONTHS_DIFF('2020-03-28', '2020-01-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

mysql> SELECT MONTHS_DIFF('2020-03-28 22:22:22', '2020-02-29 23:12:12') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Input is NULL (returns NULL)
SELECT MONTHS_DIFF(NULL, '2023-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
