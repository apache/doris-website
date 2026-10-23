---
{
    "title": "MIN_BY",
    "language": "ru",
    "description": "Функция MINBY возвращает значение, связанное с минимальным значением указанного столбца."
}
---

## Описание {#description}

Функция MIN_BY возвращает значение, связанное с минимальным значением указанного столбца.

Если `<expr2>` имеет тип Array, массивы сравниваются лексикографически, поэлементно; элемент NULL считается больше любого элемента, отличного от NULL. Если значение самого массива равно NULL, оно игнорируется.

Различия между версиями: в серии Doris 4.1 начиная с 4.1.5, а также в Doris 4.2 и более поздних версиях элемент `NULL` внутри массива считается больше элемента, отличного от `NULL`. В Doris 4.0 и Doris 4.1 до 4.1.5 элемент `NULL` в массиве считается меньшим. Значение `NULL` для самого массива игнорируется во всех этих версиях.

## Синтаксис {#syntax}

```sql
MIN_BY(<expr1>, <expr2>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<expr1>` | Выражение для связанного значения. Поддерживаемые типы: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array, Map, Struct. |
| `<expr2>` | Выражение для минимального значения. Поддерживаемые типы: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array. |

## Возвращаемое значение {#return-value}

Возвращает значение того же типа данных, что и <expr1>.
Возвращает NULL, если в группе нет допустимых данных.

## Пример {#example}

```sql
-- setup
create table tbl(
    k1 int,
    k2 int,
    arr ARRAY<INT>,
    mp MAP<STRING, INT>,
    st STRUCT<a: INT, b: STRING>,
) distributed by hash(k1) buckets 1
properties ("replication_num"="1");
insert into tbl values
    (0, 100, [1,2,3], {"x": 1, "y": 4}, NAMED_STRUCT("a", 1, "b", "x")),
    (1, 4,   [5, 6],  {"x": 2, "y": 3}, NAMED_STRUCT("a", 2, "b", "y")),
    (4, 1,   [7],     {"x": 3, "y": 2}, NAMED_STRUCT("a", 3, "b", "z")),
    (3, 1,   [8],     {"x": 4, "y": 1}, NAMED_STRUCT("a", 4, "b", "r"));
```

```text
Table created and data inserted successfully.
```

```sql
select min_by(k1, k2) from tbl;
```

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|              3 |
+----------------+
```

```sql
select min_by(arr, k1), min_by(mp, k1), min_by(st, k1) from tbl;
```

```text
+-----------------+----------------+------------------+
| min_by(arr, k1) | min_by(mp, k1) | min_by(st, k1)   |
+-----------------+----------------+------------------+
| [1, 2, 3]       | {"x":1, "y":4} | {"a":1, "b":"x"} |
+-----------------+----------------+------------------+
```

```sql
select min_by(k1, arr), min_by(mp, arr), min_by(st, arr), min_by(arr, arr) from tbl;
```

```text
+-----------------+-----------------+------------------+------------------+
| min_by(k1, arr) | min_by(mp, arr) | min_by(st, arr)  | min_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               0 | {"x":1, "y":4}  | {"a":1, "b":"x"} | [1, 2, 3]        |
+-----------------+-----------------+------------------+------------------+
```

```sql
select min_by(k1, k2) from tbl where k1 is null;
```

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```

Следующий пример сравнения массивов применим к серии Doris 4.1 начиная с 4.1.5, а также к Doris 4.2 и более поздним версиям.

```sql
SELECT min_by(label, sort_key) AS result
FROM (
    SELECT 'null element' AS label, [1, NULL] AS sort_key
    UNION ALL SELECT 'non-null element', [1, 2]
    UNION ALL SELECT 'null array', CAST(NULL AS ARRAY<INT>)
) t;
```

```text
non-null element
```

```sql
SELECT min_by(1, CAST(NULL AS ARRAY<INT>)) AS result;
```

```text
NULL
```
