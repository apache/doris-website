---
{
    "title": "Ручное партиционирование",
    "language": "ru",
    "description": "Руководство по ручному партиционированию в Doris: подробный синтаксис и сценарии использования партиционирования Range, List и NULL, включая примеры четырёх форм партиционирования Range (FIXED RANGE, LESS THAN, BATCH RANGE, MULTI RANGE)."
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Table design / Data partitioning planning -->

Ручное партиционирование представляет собой метод партиционирования, при котором пользователь явно задаёт правила разбиения при создании таблицы. В этой статье описано, как использовать ручное партиционирование в Doris, включая синтаксис, сценарии использования и рекомендации по партиционированию Range, List и NULL.

## Правила для столбцов партиционирования {#partition-column-rules}

Прежде чем использовать ручное партиционирование, необходимо ознакомиться с общими правилами для столбцов партиционирования:

-   Для партиционирования можно использовать один или несколько столбцов, и все они должны быть столбцами KEY.
-   Независимо от типа столбца партиционирования значения партиций при указании необходимо заключать в двойные кавычки.
-   Теоретического верхнего предела количества партиций нет. Однако по умолчанию действует ограничение в 4096 партиций на таблицу. Чтобы превысить это ограничение, измените параметры конфигурации FE `max_multi_partition_num` и `max_dynamic_partition_num`.
-   При создании таблицы без партиционирования система автоматически создаёт единственную партицию с тем же именем, что и у таблицы, которая охватывает весь диапазон значений. Эта партиция не видна пользователям, её нельзя изменить или удалить.
-   Создавать партиции с пересекающимися диапазонами нельзя.

## Партиционирование Range {#range-partitioning}

Партиционирование Range разделяет данные на партиции по диапазонам значений столбца партиционирования. Обычно для партиционирования используется столбец с датой или временем, что упрощает управление старыми и новыми данными.

**Поддерживаемые типы столбцов:** `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`.

Партиционирование Range поддерживает следующие четыре формы для разных сценариев:

| Форма | Сценарий использования |
|------|----------|
| FIXED RANGE | Когда требуется точно управлять верхней и нижней границами каждой партиции |
| LESS THAN | Когда важна только верхняя граница партиции, а партиции добавляются в хронологическом порядке |
| BATCH RANGE | Пакетное создание партиций для числовых значений или значений даты и времени с одинаковым шагом |
| MULTI RANGE | Пакетное создание партиций с разными шагами для разных временных диапазонов |

### 1. FIXED RANGE {#1-fixed-range}

Задаёт для партиции интервал, замкнутый слева и открытый справа.

**Синтаксис:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))
)
```

**Пример:**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"), ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```

### 2. LESS THAN {#2-less-than}

Задаёт только верхнюю границу партиции; нижняя граница определяется верхней границей предыдущей партиции.

**Синтаксис:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)
)
```

**Пример:**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01"),
    PARTITION `p2018` VALUES [("2018-01-01"), ("2019-01-01")),
    PARTITION `other` VALUES LESS THAN (MAXVALUE)
)
```

### 3. BATCH RANGE {#3-batch-range}

Пакетно создаёт партиции RANGE для числовых типов и типов даты и времени, задавая для каждой партиции интервал, замкнутый слева и открытый справа, с указанным шагом.

**Синтаксис:**

```sql
PARTITION BY RANGE(int_col)
(
    FROM (start_num) TO (end_num) INTERVAL interval_value
)

PARTITION BY RANGE(date_col)
(
    FROM ("start_date") TO ("end_date") INTERVAL num YEAR | num MONTH | num WEEK | num DAY | 1 HOUR
)
```

**Пример:**

```sql
PARTITION BY RANGE(age)
(
    FROM (1) TO (100) INTERVAL 10
)

PARTITION BY RANGE(`date`)
(
    FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 2 YEAR
)
```

### 4. MULTI RANGE {#4-multi-range}

Пакетно создаёт партиции RANGE с интервалами, замкнутыми слева и открытыми справа, позволяя использовать разные шаги в одном операторе.

**Пример:**

```sql
PARTITION BY RANGE(col)
(
    FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 1 YEAR,
    FROM ("2021-11-14") TO ("2022-11-14") INTERVAL 1 MONTH,
    FROM ("2022-11-14") TO ("2023-01-03") INTERVAL 1 WEEK,
    FROM ("2023-01-03") TO ("2023-01-14") INTERVAL 1 DAY,
    PARTITION p_20230114 VALUES [('2023-01-14'), ('2023-01-15'))
)
```

## Партиционирование List {#list-partitioning}

Партиционирование List разделяет данные на партиции по явно перечисленным значениям столбца партиционирования. Строка направляется в партицию только в том случае, если её значение совпадает с одним из значений, перечисленных для этой партиции.

**Поддерживаемые типы столбцов:** `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `TIMESTAMP_NS`, `TIMESTAMPTZ`, `CHAR`, `VARCHAR`.

**Ключевые слова синтаксиса:** используйте `VALUES IN (...)`, чтобы перечислить значения, входящие в каждую партицию.

### Партиционирование List по одному столбцу {#single-column-list-partitioning}

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```

### Партиционирование List по нескольким столбцам {#multi-column-list-partitioning}

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```

## Партиционирование NULL {#null-partitioning}

По умолчанию столбцы партиционирования должны иметь ограничение NOT NULL. Чтобы использовать для партиционирования столбец, допускающий NULL, задайте следующую переменную сеанса:

```sql
SET allow_partition_column_nullable = true;
```

Разные типы партиционирования обрабатывают значения NULL следующим образом:

| Тип партиции | Обработка значений NULL |
|----------|-------------|
| Партиция LIST | Поддерживает партицию с настоящим значением NULL |
| Партиция RANGE (с LESS THAN) | Значения NULL помещаются в наименьшую партицию LESS THAN |
| Партиция RANGE (без LESS THAN) | Вставка значений NULL невозможна |

### Сценарий 1: партиция LIST поддерживает NULL {#scenario-1-list-partition-supports-null}

```sql
mysql> create table null_list(
    -> k0 varchar null
    -> )
    -> partition by list (k0)
    -> (
    -> PARTITION pX values in ((NULL))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.11 sec)

mysql> insert into null_list values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_list;
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```

### Сценарий 2: партиция RANGE направляет NULL в наименьшую партицию LESS THAN {#scenario-2-range-partition-routes-null-to-the-smallest-less-than-partition}

```sql
mysql> create table null_range(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p10 values less than (10),
    -> PARTITION p100 values less than (100),
    -> PARTITION pMAX values less than (maxvalue)
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.12 sec)

mysql> insert into null_range values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_range partition(p10);
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```

### Сценарий 3: партиция RANGE без LESS THAN не принимает NULL {#scenario-3-range-partition-without-less-than-cannot-accept-null}

```sql
mysql> create table null_range2(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p200 values [("100"), ("200"))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.13 sec)

mysql> insert into null_range2 values (null);
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=......
```
