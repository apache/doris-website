---
{
    "title": "MICROSECONDS_SUB",
    "language": "ru",
    "description": "Вычитает микросекунды из значения DATETIME, TIMESTAMP_NS или TIMESTAMPTZ и возвращает значение того же типа."
}
---

## Описание {#description}

Функция `MICROSECONDS_SUB` вычитает указанное количество микросекунд из входного значения даты и времени и возвращает полученное значение даты и времени. Функция поддерживает типы `DATETIME`, `TIMESTAMP_NS` и `TIMESTAMPTZ`.

Эта функция ведёт себя так же, как [функция date_sub](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) в MySQL при использовании MICROSECOND в качестве единицы измерения.

## Синтаксис {#syntax}

```sql
MICROSECONDS_SUB(`<datetime_like_type>`, `<delta>`)
```

## Параметры {#parameters}

| Параметр    | Описание                                                                                     |
|--------------|-------------------------------------------------------------------------------------------------|
| `<datetime_like_type>` | Входное значение даты и времени типа `DATETIME`, `TIMESTAMP_NS` или `TIMESTAMPTZ`. О форматах см. [преобразование datetime](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [преобразование timestamp_ns](../../../basic-element/sql-data-types/conversion/timestamp-ns-conversion.md) и [преобразование timestamptz](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion). |
| `<delta>`    | Количество микросекунд для вычитания, тип — `BIGINT`. 1 секунда = 1,000,000 микросекунд.       |

## Возвращаемое значение {#return-value}

Возвращает результат вычитания указанного количества микросекунд `<delta>` из базового времени `<datetime_like_type>`. Тип возвращаемого значения совпадает с типом первого параметра.

- Для входного значения типа TIMESTAMP_NS функция возвращает TIMESTAMP_NS, сохраняя наносекундную часть.

- Если `<delta>` имеет отрицательное значение, функция ведёт себя так же, как при добавлении соответствующего количества микросекунд к базовому времени (то есть `MICROSECONDS_SUB(basetime, -n)` эквивалентно `MICROSECONDS_ADD(basetime, n)`).
- Если результат вычисления выходит за допустимый диапазон типа `DATETIME` (от `0000-01-01 00:00:00` до `9999-12-31 23:59:59.999999`), возникает исключение.
- Для TIMESTAMP_NS результат должен находиться в диапазоне от `1677-09-21 00:12:43.145224192` до `2262-04-11 23:47:16.854775807`.
- Если какой-либо параметр равен `NULL`, функция возвращает `NULL`.

## Примеры {#examples}

```sql
-- Subtract microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;

+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+

-- Negative delta (equivalent to addition)
mysql> SELECT MICROSECONDS_SUB('2023-10-01 12:00:00.200000', -300000) AS after_sub;
+----------------------------+
| after_sub                  |
+----------------------------+
| 2023-10-01 12:00:00.500000 |
+----------------------------+

-- TIMESTAMP_NS preserves the nanosecond part
SELECT MICROSECONDS_SUB(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1);
+-----------------------------------------------------------------------------------+
| MICROSECONDS_SUB(CAST('2025-01-02 03:04:05.123456789' AS TIMESTAMP_NS), 1) |
+-----------------------------------------------------------------------------------+
| 2025-01-02 03:04:05.123455789                                                     |
+-----------------------------------------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MICROSECONDS_SUB(NULL, 1000), MICROSECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| microseconds_sub(NULL, 1000) | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECONDS_SUB('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_SUB('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-10-01 00:00:00.300000              |
+-----------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_SUB('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:55.357200+08:00                            |
+-------------------------------------------------------------+

-- Exceeds datetime range, throws an error
mysql> SELECT MICROSECONDS_SUB('0000-01-01 00:00:00.000000', 1000000) AS after_sub;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 0000-01-01 00:00:00, -1000000 
out of range

```
