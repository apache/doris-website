---
{
    "title": "MINUTES_DIFF",
    "language": "ru",
    "description": "Функция MINUTESDIFF вычисляет разницу в минутах между двумя значениями даты и времени."
}
---

## Описание {#description}

Функция MINUTES_DIFF вычисляет разницу в минутах между двумя значениями даты и времени. Результат — количество минут, полученное при вычитании времени начала из времени окончания. Функция поддерживает типы DATE и DATETIME (в том числе с точностью до микросекунд).

## Синтаксис {#syntax}

```sql
MINUTES_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| --------- | ----------- |
| `<date_or_time_expr1>` | Время окончания типа DATE или DATETIME. Сведения о конкретных форматах даты и времени см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Время начала типа DATE или DATETIME. Сведения о конкретных форматах даты и времени см. в разделах [Преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) и [Преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Возвращаемое значение {#return-value}

Возвращает целое число типа INT, представляющее разницу в минутах между `<date_or_time_expr1>` и `<date_or_time_expr2>` (1 час = 60 минут).

- Если `<date_or_time_expr1>` позже, чем `<date_or_time_expr2>`, возвращается положительное число.
- Если `<date_or_time_expr1>` раньше, чем `<date_or_time_expr2>`, возвращается отрицательное число.
- При вычислении учитывается фактическая разница, включая секунды и микросекунды.
- Если входное значение имеет тип DATE (содержит только год, месяц и день), его временная часть по умолчанию равна 00:00:00.
- Если во входном значении даты и времени дробная часть, секунды или микросекунды отличны от нуля, они учитываются при вычислении.
- Если любой из параметров равен NULL, возвращается NULL.

## Примеры {#examples}

```sql
-- Minute difference when end time is greater than start time
SELECT MINUTES_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

-- Includes scale, calculation does not ignore it
SELECT MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923');
+--------------------------------------------------------------------+
| MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923') |
+--------------------------------------------------------------------+
|                                                                -59 |
+--------------------------------------------------------------------+

-- End time is earlier than start time, returns negative number
SELECT MINUTES_DIFF('2023-07-13 21:50:00', '2023-07-13 22:00:00') AS result;
+--------+
| result |
+--------+
|    -10 |
+--------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_DIFF('2023-07-14', '2023-07-13') AS result;
+--------+
| result |
+--------+
|   1440 |
+--------+

-- Two times have different seconds, seconds are also calculated
SELECT MINUTES_DIFF('2023-07-13 22:30:59', '2023-07-13 22:31:01') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_DIFF(NULL, '2023-07-13 22:00:00'), MINUTES_DIFF('2023-07-13 22:00:00', NULL) AS result;
+-------------------------------------------+--------+
| MINUTES_DIFF(NULL, '2023-07-13 22:00:00') | result |
+-------------------------------------------+--------+
|                                      NULL |   NULL |
+-------------------------------------------+--------+
```
