---
{
    "title": "NEXT_DAY",
    "language": "ru",
    "description": "Функция NEXTDAY возвращает первую дату после указанной даты, которая приходится на заданный день недели. Например, NEXTDAY('2020-01-31',"
}
---

## Описание {#description}

Функция NEXT_DAY возвращает первую дату после указанной даты, которая приходится на заданный день недели. Например, NEXT_DAY('2020-01-31', 'MONDAY') возвращает первый понедельник после 2020-01-31. Эта функция поддерживает типы DATE, DATETIME и TIMESTAMP_NS и игнорирует время во входном значении (вычисление выполняется только на основе даты).

Поведение этой функции соответствует поведению [функции next_day](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NEXT_DAY.html) в Oracle.

## Синтаксис {#syntax}

```sql
NEXT_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr>` | Поддерживаются типы DATE/DATETIME/TIMESTAMP_NS. Подробнее о форматах даты и времени см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<day_of_week>` | Выражение строкового типа, задающее день недели. |

`<day_of_week>` должен принимать одно из следующих значений (без учёта регистра):
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## Возвращаемое значение {#return-value}

Возвращает значение типа DATE, представляющее первую дату после исходной даты, которая приходится на день недели, заданный в `<day_of_week>`.

Особые случаи:
- Если исходная дата уже приходится на заданный день недели, возвращается следующая дата, приходящаяся на этот день недели (а не исходная дата);
- Если значение `<date_or_time_expr>` равно NULL, возвращается NULL;
- Если `<day_of_week>` имеет недопустимое значение (например, 'ABC'), возникает исключение;
- Если на вход подана дата 9999-12-31 (с временем или без него), возвращается эта же дата (поскольку это максимально допустимая дата и более поздних дат не существует);

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
