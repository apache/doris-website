---
{
    "title": "BOOL_AND",
    "language": "ru",
    "description": "Выполняет агрегацию с помощью логической операции AND по всем значениям выражения, отличным от NULL."
}
---

## Описание {#description}

Выполняет агрегацию с помощью логической операции AND по всем значениям выражения, отличным от NULL.

## Псевдоним {#alias}

- BOOLAND_AGG

## Синтаксис {#syntax}

```text
BOOL_AND(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение для агрегации с помощью логической операции AND. Поддерживает тип BOOLEAN и числовые типы, которые можно преобразовать в логический тип по правилу 0/не-0 (0 соответствует FALSE, а любое значение, отличное от 0, соответствует TRUE). |

## Возвращаемое значение {#return-value}

Возвращаемое значение имеет тип BOOLEAN. Функция возвращает TRUE, только если все значения, отличные от NULL, равны TRUE; в противном случае возвращает FALSE.

Если все значения выражения равны NULL или выражение не содержит значений, функция возвращает NULL.

## Примеры {#examples}

Подготовка:
```sql
CREATE TABLE IF NOT EXISTS test_boolean_agg (
     id INT,
     c1 BOOLEAN,
     c2 BOOLEAN,
     c3 BOOLEAN,
     c4 BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1"); 

INSERT INTO test_boolean_agg (id, c1, c2, c3, c4) values 
(1, true, true, true, false),
(2, true, false, false, false),
(3, true, true, false, false),
(4, true, false, false, false);
```

### Агрегатная функция: {#aggregate-function}
```sql
SELECT booland_agg(c1), booland_agg(c2), booland_agg(c3), booland_agg(c4)
FROM test_boolean_agg;
```
```text
+-----------------+-----------------+-----------------+-----------------+
| booland_agg(c1) | booland_agg(c2) | booland_agg(c3) | booland_agg(c4) |
+-----------------+-----------------+-----------------+-----------------+
|               1 |               0 |               0 |               0 |
+-----------------+-----------------+-----------------+-----------------+
```

bool_and также принимает параметры числовых типов: если число не равно 0, оно преобразуется в `TRUE`
```sql
CREATE TABLE test_numeric_and_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_and_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```

```sql
SELECT
    BOOL_AND(c_int) AS bool_and_int,
    BOOL_AND(c_float) AS bool_and_float,
    BOOL_AND(c_decimal) AS bool_and_decimal,
    BOOL_AND(c_bool) AS bool_and_bool
FROM test_numeric_and_null;
```
```text
+--------------+----------------+------------------+---------------+
| bool_and_int | bool_and_float | bool_and_decimal | bool_and_bool |
+--------------+----------------+------------------+---------------+
|            0 |              1 |                0 |          NULL |
+--------------+----------------+------------------+---------------+
```

### Оконная функция: {#window-function}
В следующем примере строки разбиваются на две группы по условию (id > 2),
после чего выводятся результаты оконной агрегации:
```sql
SELECT * FROM test_boolean_agg;
```
```text
+------+------+------+------+------+
| id   | c1   | c2   | c3   | c4   |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```
```sql
SELECT
    id,
    BOOLAND_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLAND_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLAND_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLAND_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    1 |    0 |    0 |    0 |
|    2 |    1 |    0 |    0 |    0 |
|    3 |    1 |    0 |    0 |    0 |
|    4 |    1 |    0 |    0 |    0 |
+------+------+------+------+------+
```

### Пример ошибки: {#error-example}
```sql
SELECT BOOL_AND('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_and requires a boolean or numeric argument
```
