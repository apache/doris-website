---
{
    "title": "NEXT_DAY",
    "language": "ru",
    "description": "Функция NEXTDAY возвращает дату первого наступления заданного дня недели после указанной даты. Например, NEXTDAY('2020-01-31',"
}
---

## Описание {#description}

Функция NEXT_DAY возвращает дату первого наступления заданного дня недели после указанной даты. Например, NEXT_DAY('2020-01-31', 'MONDAY') возвращает первый понедельник после 2020-01-31. Функция поддерживает обработку типов DATE и DATETIME и игнорирует время во входном значении (расчёт выполняется только по дате).

Эта функция работает так же, как [функция next_day](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NEXT_DAY.html) в Oracle.

## Синтаксис {#syntax}

```sql
NEXT_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Поддерживает типы date/datetime. Сведения о конкретных форматах даты и времени см. в разделах [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование date](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<day_of_week>` | Выражение строкового типа, обозначающее день недели. |

`<day_of_week>` должен принимать одно из следующих значений (без учёта регистра):
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## Возвращаемое значение {#return-value}

Возвращает значение типа DATE, представляющее первую дату после исходной даты, которая соответствует `<day_of_week>`.

Особые случаи:
- Если исходная дата приходится на заданный день недели, возвращает дату следующего наступления этого дня недели (а не текущую дату);
- Если `<date_or_time_expr>` равен NULL, возвращает NULL;
- Если `<day_of_week>` содержит недопустимое значение (например, 'ABC'), вызывает исключение;
- Если на вход передано 9999-12-31 (независимо от наличия времени), возвращает ту же дату (поскольку это максимально допустимая дата и последующих дат не существует);

## Примеры {#examples}

```sql
-- First Monday after base date
SELECT NEXT_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

-- Including time component (ignores time, uses only date for calculation)
SELECT NEXT_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

-- Base date itself is target day of week (returns next occurrence)
SELECT NEXT_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-24 |
+------------+

-- Target day of week as abbreviation (case insensitive)
SELECT NEXT_DAY('2023-07-13', 'FR') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-14 |
+------------+

-- Input is NULL (returns NULL)
SELECT NEXT_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws exception)
mysql> SELECT NEXT_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function next_day failed to parse weekday: ABC

--- Maximum date (returns itself)
SELECT NEXT_DAY('9999-12-31 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 9999-12-31 |
+------------+
``` 
