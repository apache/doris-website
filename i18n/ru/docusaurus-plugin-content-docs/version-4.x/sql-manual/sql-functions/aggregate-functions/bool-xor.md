---
{
    "title": "BOOL_XOR",
    "language": "ru",
    "description": "Выполняет агрегирование с помощью логической операции XOR по всем значениям выражения, отличным от NULL."
}
---

## Описание {#description}

Выполняет агрегирование с помощью логической операции XOR по всем значениям выражения, отличным от NULL.

## Псевдоним {#alias}

- BOOLXOR_AGG

## Синтаксис {#syntax}

```text
BOOL_XOR(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| -- | -- |
| `<expr>` | Выражение для агрегирования с помощью логической операции XOR. Поддерживаются тип BOOLEAN и числовые типы, которые можно преобразовать в логическое значение по правилу «0/не 0» (0 соответствует FALSE, значения, отличные от 0, соответствуют TRUE). |

## Возвращаемое значение {#return-value}

Возвращаемое значение имеет тип BOOLEAN. Функция возвращает TRUE, если среди всех значений, отличных от NULL, есть только одно значение TRUE, в противном случае возвращает FALSE.

Если все значения выражения равны NULL или выражение пустое, функция возвращает NULL.

## Примеры {#examples}

Инициализация таблицы:
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

### Агрегатная функция {#aggregate-function}

```sql
SELECT BOOLXOR_AGG(c1), BOOLXOR_AGG(c2), BOOLXOR_AGG(c3), BOOLXOR_AGG(c4)
FROM test_boolean_agg;
```
```text
+-----------------+-----------------+-----------------+-----------------+
| BOOLXOR_AGG(c1) | BOOLXOR_AGG(c2) | BOOLXOR_AGG(c3) | BOOLXOR_AGG(c4) |
+-----------------+-----------------+-----------------+-----------------+
|               0 |               0 |               1 |               0 |
+-----------------+-----------------+-----------------+-----------------+
```

BOOL_XOR также принимает числовые типы; ненулевые значения интерпретируются как TRUE:
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
    BOOL_XOR(c_int) AS bool_xor_int,
    BOOL_XOR(c_float) AS bool_xor_float,
    BOOL_XOR(c_decimal) AS bool_xor_decimal,
    BOOL_XOR(c_bool) AS bool_xor_bool
FROM test_numeric_and_null;
```
```text
+--------------+----------------+------------------+---------------+
| bool_xor_int | bool_xor_float | bool_xor_decimal | bool_xor_bool |
+--------------+----------------+------------------+---------------+
|            0 |              0 |                1 |          NULL |
+--------------+----------------+------------------+---------------+
```

### Оконная функция {#window-function}
В следующем примере строки разделяются по условию (id > 2)
на две группы, после чего выводятся результаты оконного агрегирования:
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
    BOOLXOR_AGG(c1) OVER (PARTITION BY (id > 2)) AS a,
    BOOLXOR_AGG(c2) OVER (PARTITION BY (id > 2)) AS b,
    BOOLXOR_AGG(c3) OVER (PARTITION BY (id > 2)) AS c,
    BOOLXOR_AGG(c4) OVER (PARTITION BY (id > 2)) AS d
FROM test_boolean_agg
ORDER BY id;
```
```text
+------+------+------+------+------+
| id   | a    | b    | c    | d    |
+------+------+------+------+------+
|    1 |    0 |    1 |    1 |    0 |
|    2 |    0 |    1 |    1 |    0 |
|    3 |    0 |    1 |    0 |    0 |
|    4 |    0 |    1 |    0 |    0 |
+------+------+------+------+------+
```

### Пример ошибки: {#error-example}
```sql
SELECT BOOL_XOR('invalid type');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = bool_xor requires a boolean or numeric argument
``` 
