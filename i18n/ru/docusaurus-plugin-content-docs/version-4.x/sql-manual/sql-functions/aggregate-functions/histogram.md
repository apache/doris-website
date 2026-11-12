---
{
    "title": "HISTOGRAM",
    "language": "ru",
    "description": "Функция histogram используется для описания распределения данных. Она использует стратегию разбиения на интервалы «равной высоты»,"
}
---

## Описание {#description}

Функция histogram используется для описания распределения данных. Она использует стратегию разбиения на интервалы «равной высоты» и распределяет данные по интервалам в соответствии с их значениями. Каждый интервал описывается с помощью нескольких простых показателей, например количества попавших в него значений. Учитываются только данные, отличные от NULL.

## Псевдоним {#alias}

HIST

## Синтаксис {#syntax}

```sql
HISTOGRAM(<expr>[, <num_buckets>])
HIST(<expr>[, <num_buckets>])
```

## Параметры {#parameters}

| Параметры | Описание |
| -- | -- |
| `expr` | Выражение для вычисления. Поддерживаемые типы: TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, String. |
| `num_buckets` | Необязательный параметр. Ограничивает количество интервалов гистограммы. Значение по умолчанию: 128. Поддерживаемый тип: Integer.|


## Возвращаемое значение {#return-value}

Возвращает значение типа JSON, полученное в результате оценки гистограммы. Если все данные в группе имеют значение NULL, возвращает NULL. Если допустимых данных нет, возвращает результат с num_buckets = 0.

## Пример {#example}

```sql
-- setup
CREATE TABLE histogram_test (
    c_int INT,
    c_float FLOAT,
    c_string VARCHAR(20)
) DISTRIBUTED BY HASH(c_int) BUCKETS 1
PROPERTIES ("replication_num"="1");

INSERT INTO histogram_test VALUES
    (1, 0.1, 'str1'),
    (2, 0.2, 'str2'),
    (3, 0.8, 'str3'),
    (4, 0.9, 'str4'),
    (5, 1.0, 'str5'),
    (6, 1.0, 'str6'),
    (NULL, NULL, 'str7');
```

```sql
SELECT histogram(c_float) FROM histogram_test;
```

```text
+-------------------------------------------------------------------------------------------------------------------------------------+
| histogram(c_float)                                                                                                                  |
+-------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":5,"buckets":[{"lower":"0.1","upper":"0.1","ndv":1,"count":1,"pre_sum":0},{"lower":"0.2","upper":"0.2","ndv":1,"count":1,"pre_sum":1},{"lower":"0.8","upper":"0.8","ndv":1,"count":1,"pre_sum":2},{"lower":"0.9","upper":"0.9","ndv":1,"count":1,"pre_sum":3},{"lower":"1","upper":"1","ndv":1,"count":2,"pre_sum":4}]} |
+-------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
SELECT histogram(c_string, 2) FROM histogram_test;
```

```text
+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
| histogram(c_string, 2)                                                                                                                                    |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":2,"buckets":[{"lower":"str1","upper":"str4","ndv":4,"count":4,"pre_sum":0},{"lower":"str5","upper":"str7","ndv":3,"count":3,"pre_sum":4}]} |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
-- NULL case
SELECT histogram(c_float) FROM histogram_test WHERE c_float IS NULL;
```

```text
+--------------------------------+
| histogram(c_float)             |
+--------------------------------+
| {"num_buckets":0,"buckets":[]} |
+--------------------------------+
```

Описание результата запроса:

```json
{
    "num_buckets": 3, 
    "buckets": [
        {
            "lower": "0.1", 
            "upper": "0.2", 
            "count": 2, 
            "pre_sum": 0, 
            "ndv": 2
        }, 
        {
            "lower": "0.8", 
            "upper": "0.9", 
            "count": 2, 
            "pre_sum": 2, 
            "ndv": 2
        }, 
        {
            "lower": "1.0", 
            "upper": "1.0", 
            "count": 2, 
            "pre_sum": 4, 
            "ndv": 1
        }
    ]
}
```

```text
Field description:
- num_buckets: The number of buckets
- buckets: All buckets
    - lower: Lower bound of the bucket
    - upper: Upper bound of the bucket
    - count: The number of elements contained in the bucket
    - pre_sum: The total number of elements in the front bucket
    - ndv: The number of different values in the bucket

> Total number of elements in the histogram = count of the last bucket + pre_sum of the last bucket.
```
