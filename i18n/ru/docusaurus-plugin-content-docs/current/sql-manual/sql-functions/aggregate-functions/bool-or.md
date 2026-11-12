---
{
    "title": "BOOL_OR",
    "language": "ru",
    "description": "Выполняет агрегацию с логическим OR по всем значениям выражения, отличным от NULL."
}
---

## Описание {#description}

Выполняет агрегацию с логическим OR по всем значениям выражения, отличным от NULL.

## Псевдоним {#alias}

- BOOLOR_AGG

## Синтаксис {#syntax}

```text
BOOL_OR(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение для агрегации с логическим OR. Поддерживаются тип BOOLEAN и числовые типы, которые можно преобразовать в логический тип по правилу «0/не 0» (0 означает FALSE, любое значение, отличное от 0, означает TRUE). |

## Возвращаемое значение {#return-value}

Возвращаемое значение имеет тип BOOLEAN. Функция возвращает TRUE, если хотя бы одно значение, отличное от NULL, равно TRUE, в противном случае возвращает FALSE.

Если все значения выражения равны NULL или выражение пустое, функция возвращает NULL.

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
SELECT BOOLOR_AGG(c1), BOOLOR_AGG(c2), BOOLOR_AGG(c3), BOOLOR_AGG(c4)
FROM test_boolean_agg;
```
```text
+----------------+----------------+----------------+----------------+
| BOOLOR_AGG(c1) | BOOLOR_AGG(c2) | BOOLOR_AGG(c3) | BOOLOR_AGG(c4) |
+----------------+----------------+----------------+----------------+
|              1 |              1 |              1 |              0 |
+----------------+----------------+----------------+----------------+
```


BOOL_OR также принимает числовые типы; ненулевые значения интерпретируются как `TRUE`:
```sql
CREATE TABLE test_numeric_or_null (
    id INT,
    c_int INT,
    c_float FLOAT,
    c_decimal DECIMAL(10,2),
    c_bool BOOLEAN
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test_numeric_or_null (id, c_int, c_float, c_decimal, c_bool) VALUES
(1, 1, 1.0, NULL, NULL),
(2, 0, NULL, 0.00, NULL),
(3, 1, 3.14, 1.00, NULL),
(4, 0, 1.0, 0.00, NULL),
(5, NULL, NULL, NULL, NULL);
```

```sql
SELECT
    BOOL_OR(c_int) AS bool_or_int,
    BOOL_OR(c_float) AS bool_or_float,
    BOOL_OR(c_decimal) AS bool_or_decimal,
    BOOL_OR(c_bool) AS bool_or_bool
FROM test_numeric_or_null;
```
```text
+-------------+---------------+-----------------+--------------+
| bool_or_int | bool_or_float | bool_or_decimal | bool_or_bool |
+-------------+---------------+-----------------+--------------+
|           1 |             1 |               1 |         NULL |
+-------------+---------------+-----------------+--------------+
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
    BOOLOR_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLOR_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLOR_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLOR_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    1 |    1 |    1 |    0 |
|    2 |    1 |    1 |    1 |    0 |
|    3 |    1 |    1 |    0 |    0 |
|    4 |    1 |    1 |    0 |    0 |
+------+------+------+------+------+
```

### Пример ошибки: {#error-example}
```sql
SELECT BOOL_OR('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_or requires a boolean or numeric argument
```
