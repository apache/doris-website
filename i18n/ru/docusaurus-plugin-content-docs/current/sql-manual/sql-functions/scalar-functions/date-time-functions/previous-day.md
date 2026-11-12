---
{
    "title": "PREVIOUS_DAY",
    "language": "ru",
    "description": "Возвращает ближайшую дату, предшествующую указанной дате и соответствующую заданному дню недели."
}
---

## Описание {#description}

Функция PREVIOUS_DAY возвращает ближайшую дату, предшествующую указанной дате и соответствующую заданному дню недели. Например, `PREVIOUS_DAY('2020-01-31', 'MONDAY')` возвращает дату ближайшего понедельника до 2020-01-31. Функция принимает значения типов DATE, DATETIME и TIMESTAMP_NS, игнорируя время (вычисления выполняются только на основе даты).

## Синтаксис {#syntax}

```sql
PREVIOUS_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## Параметры {#parameters}

| Параметр             | Описание                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<date_or_time_expr>` | Поддерживает типы DATE/DATETIME/TIMESTAMP_NS. Подробнее о форматах см. в разделах [Преобразование DATETIME](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование DATE](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<day_of_week>`       | Строковое выражение, задающее день недели.                                                                                                                                                                                                                                                      |

`<day_of_week>` должен принимать одно из следующих значений (без учёта регистра):

- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## Возвращаемое значение {#return-value}

Возвращает значение типа DATE, представляющее ближайшую дату до базовой даты, которая соответствует `<day_of_week>`.

Особые случаи:

- Если сама базовая дата приходится на заданный день недели, возвращается дата этого дня недели на предыдущей неделе (а не текущая дата).
- Если `<date_or_time_expr>` равен NULL, возвращается NULL.
- Если `<day_of_week>` содержит недопустимое значение (например, 'ABC'), возникает исключение.
- Если входное значение — 0000-01-01 (независимо от наличия времени), возвращается сама входная дата (поскольку это минимальная допустимая дата и более ранней даты не существует).

## Примеры {#examples}

```sql
--- The first Monday before the base date
SELECT PREVIOUS_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- Including time part (time is ignored, calculation based on date only)
SELECT PREVIOUS_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- The base date itself is the target weekday (returns the previous one)
SELECT PREVIOUS_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

--- Target weekday is an abbreviation (case-insensitive)
SELECT PREVIOUS_DAY('2023-07-13', 'WE') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-12 |
+------------+

--- Input is NULL (returns NULL)
SELECT PREVIOUS_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws an exception)
mysql> SELECT PREVIOUS_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function previous_day failed to parse weekday: ABC

--- Minimum date (returns itself)
SELECT PREVIOUS_DAY('0000-01-01 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 0000-01-01 |
+------------+
```
