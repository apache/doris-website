---
{
    "title": "FROM_UNIXTIME",
    "language": "ru",
    "description": "Функция FROMUNIXTIME преобразует метку времени Unix (в секундах) в строку даты и времени или значение типа VARCHAR в заданном формате."
}
---

## Описание {#description}


Функция FROM_UNIXTIME преобразует метку времени Unix (в секундах) в строку даты и времени или значение типа VARCHAR в заданном формате. Отсчёт меток времени Unix начинается с 1970-01-01 00:00:00 UTC. Функция формирует соответствующее представление даты и времени на основе входной метки времени и строки формата. Если входная метка времени содержит дробную часть, результат включает доли секунды с точностью до микросекунд (6 знаков после запятой).

Поведение этой функции соответствует поведению [функции from_unixtime](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-unixtime) в MySQL.

## Синтаксис {#syntax}

```sql
FROM_UNIXTIME(<unix_timestamp> [, <string_format>])
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<unix_timestamp>` | Входная метка времени Unix типа BIGINT или DECIMAL, представляющая количество секунд (с необязательной дробной частью), прошедших с 1970-01-01 00:00:00 UTC |
| `<string_format>` | Строка формата; поддерживаются типы varchar и string. Формат по умолчанию: %Y-%m-%d %H:%i:%s. Подробнее о форматах см. в разделе [date-format](./date-format) |

## Возвращаемое значение {#return-value}

Возвращает дату в заданном формате в виде значения типа VARCHAR, преобразуя метку времени Unix из часового пояса UTC во время текущего часового пояса. Если входное значение содержит дробную часть, результат включает доли секунды (например, `2007-12-01 00:30:19.500000`).
- Поддерживаемый диапазон unix_timestamp: [0, 253402271999.999999], что соответствует датам от 1970-01-01 00:00:00 до 9999-12-31 23:59:59.999999. Если unix_timestamp выходит за пределы этого диапазона, возвращается ошибка
- Если string_format некорректен, возвращается строка, не соответствующая ожиданиям.
- Если любой из параметров равен NULL, возвращается NULL
- Если длина формата превышает 128 символов, возвращается ошибка

## Примеры {#examples}

```sql

----Since the current timezone is East 8th zone, the returned time is 8 hours ahead of UTC
select from_unixtime(0);
+---------------------+
| from_unixtime(0)    |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Default format %Y-%m-%d %H:%i:%s return
mysql> select from_unixtime(1196440219);
+---------------------------+
| from_unixtime(1196440219) |
+---------------------------+
| 2007-12-01 00:30:19       |
+---------------------------+

---Specify yyyy-MM-dd HH:mm:ss format return
mysql> select from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss');
+--------------------------------------------------+
| from_unixtime(1196440219, 'yyyy-MM-dd HH:mm:ss') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+


---Specify %Y-%m-%d date-only format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d');
+-----------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d') |
+-----------------------------------------+
| 2007-12-01                              |
+-----------------------------------------+

---Specify %Y-%m-%d %H:%i:%s format return
mysql> select from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s');
+--------------------------------------------------+
| from_unixtime(1196440219, '%Y-%m-%d %H:%i:%s') |
+--------------------------------------------------+
| 2007-12-01 00:30:19                              |
+--------------------------------------------------+

---Exceeds maximum range, returns error
select from_unixtime(253402281999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of 253402281999, yyyy-MM-dd HH:mm:ss is invalid

---result over max length
select from_unixtime(32536799,repeat('a',129));
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_unixtime_new of invalid or oversized format is invalid

---string-format does not reference any time values
mysql> select from_unixtime(32536799,"gdaskpdp");
+------------------------------------+
| from_unixtime(32536799,"gdaskpdp") |
+------------------------------------+
| gdaskpdp                           |
+------------------------------------+

---Fractional timestamp input, result includes sub-second precision
mysql> select from_unixtime(1196440219.5);
+-----------------------------+
| from_unixtime(1196440219.5) |
+-----------------------------+
| 2007-12-01 00:30:19.500000  |
+-----------------------------+

---Fractional timestamp with microsecond precision
mysql> select from_unixtime(1196440219.123456);
+----------------------------------+
| from_unixtime(1196440219.123456) |
+----------------------------------+
| 2007-12-01 00:30:19.123456       |
+----------------------------------+

---Use %f format specifier to display microseconds explicitly
mysql> select from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f');
+----------------------------------------------------------+
| from_unixtime(1196440219.123456, '%Y-%m-%d %H:%i:%s.%f') |
+----------------------------------------------------------+
| 2007-12-01 00:30:19.123456                               |
+----------------------------------------------------------+

---Input is NULL, returns NULL
mysql> select from_unixtime(NULL);
+---------------------+
| from_unixtime(NULL) |
+---------------------+
| NULL                |
+---------------------+

```
