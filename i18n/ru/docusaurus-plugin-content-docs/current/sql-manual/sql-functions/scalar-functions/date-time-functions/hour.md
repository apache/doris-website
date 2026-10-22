---
{
    "title": "HOUR",
    "language": "ru",
    "description": "Функция HOUR извлекает компонент часов из выражения даты и времени или времени. Эта функция поддерживает входные значения нескольких временных типов,"
}
---

## Описание {#description}

Функция HOUR извлекает компонент часов из выражения даты и времени или времени. Эта функция поддерживает входные значения нескольких временных типов, включая DATE/DATETIME/TIMESTAMP_NS и TIME, и возвращает соответствующее значение часов.

Для DATETIME (например, '2023-10-01 14:30:00') возвращаемое значение находится в диапазоне 0-23 (24-часовой формат).
Для типа TIME (например, '456:26:32') возвращаемое значение может превышать 24 и находится в диапазоне [0,838].

Поведение этой функции соответствует поведению [функции hour](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_hour) в MySQL.

## Синтаксис {#syntax}

```sql
HOUR(`<date_or_time_expr>`)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<date_or_time_expr>` | Допустимое выражение даты или времени. Поддерживаются `DATE`, `DATETIME`, `TIMESTAMP_NS` и `TIME`. Входное значение типа `DATE` интерпретируется как 00:00:00. Подробные сведения о форматах см. в разделах [преобразование даты и времени](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [преобразование даты](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) и [преобразование времени](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion). |

## Возвращаемое значение {#return-value}

Возвращает значение целочисленного типа (INT), представляющее компонент часов входного выражения.
- Для DATETIME возвращает целое число в диапазоне 0-23.
- Для TIMESTAMP_NS возвращает целое число в диапазоне 0-23.
- Для типа DATE возвращает 0.
- Для типа TIME возвращает целое число от 0 до 838 (в соответствии с диапазоном типа TIME); возвращается абсолютное значение.
- Если входной параметр равен NULL, возвращает NULL.

## Примеры {#examples}

```sql
-- Extract hour from datetime (24-hour format)
select 
    hour('2018-12-31 23:59:59') as last_hour,
    hour('2023-01-01 00:00:00') as midnight,   
    hour('2023-10-01 12:30:45') as noon;     

+-----------+----------+------+
| last_hour | midnight | noon |
+-----------+----------+------+
|        23 |        0 |   12 |
+-----------+----------+------+

-- Extract hour from TIME type (supports over 24 or negative values)
select 
    hour(cast('14:30:00' as time)) as normal_hour,     
    hour(cast('25:00:00' as time)) as over_24,
    hour(cast('456:26:32' as time)) as large_hour,     
    hour(cast('-12:30:00' as time)) as negative_hour, 
    hour(cast('838:59:59' as time)) as max_hour,    
    hour(cast('-838:59:59' as time)) as min_hour;    

+-------------+---------+------------+---------------+----------+----------+
| normal_hour | over_24 | large_hour | negative_hour | max_hour | min_hour |
+-------------+---------+------------+---------------+----------+----------+
|          14 |      25 |        456 |            12 |      838 |      838 |
+-------------+---------+------------+---------------+----------+----------+

-- Extract hour from date type, returns 0
select hour("2022-12-12");
+--------------------+
| hour("2022-12-12") |
+--------------------+
|                  0 |
+--------------------+

select hour('14:30:00') as normal_hour;
+-------------+
| normal_hour |
+-------------+
|          14 |
+-------------+

-- Input parameter is NULL, returns NULL
mysql> select hour(NULL);
+------------+
| hour(NULL) |
+------------+
|       NULL |
+------------+
```
