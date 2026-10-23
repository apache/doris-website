---
{
    "title": "MAX_BY",
    "language": "ru",
    "description": "Функция MAXBY возвращает связанное значение, соответствующее максимальному значению указанного столбца."
}
---

## Описание {#description}

Функция MAX_BY возвращает связанное значение, соответствующее максимальному значению указанного столбца.

Когда `<expr2>` имеет тип Array, массивы сравниваются лексикографически, поэлементно; элемент NULL считается больше любого элемента, отличного от NULL. Массив со значением NULL игнорируется.

Различия между версиями: в серии Doris 4.1 начиная с 4.1.5, а также в Doris 4.2 и более поздних версиях элемент `NULL` внутри массива считается больше элемента, отличного от `NULL`. В Doris 4.0 и в версиях Doris 4.1 до 4.1.5 элемент массива со значением `NULL` считается меньше. Массив со значением `NULL` игнорируется во всех этих версиях.

## Синтаксис {#syntax}

```sql
MAX_BY(<expr1>, <expr2>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<expr1>` | Выражение для связанного значения. Поддерживаемые типы: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, TimestampNs, Array, Map, Struct. |
| `<expr2>` | Выражение для максимального значения. Поддерживаемые типы: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, TimestampNs, Array. |

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
select max_by(k1, k2) from tbl;
```

```text
+----------------+
| max_by(k1, k2) |
+----------------+
|              0 |
+----------------+
```

```sql
select max_by(arr, k1), max_by(mp, k1), max_by(st, k1) from tbl;
```

```text
+-----------------+----------------+------------------+
| max_by(arr, k1) | max_by(mp, k1) | max_by(st, k1)   |
+-----------------+----------------+------------------+
| [7]             | {"x":3, "y":2} | {"a":3, "b":"z"} |
+-----------------+----------------+------------------+
```

```sql
select max_by(k1, arr), max_by(mp, arr), max_by(st, arr), max_by(arr, arr) from tbl;
```

```text
+-----------------+-----------------+------------------+------------------+
| max_by(k1, arr) | max_by(mp, arr) | max_by(st, arr)  | max_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               3 | {"x":4, "y":1}  | {"a":4, "b":"r"} | [8]              |
+-----------------+-----------------+------------------+------------------+
```

```sql
select max_by(k1, k2) from tbl where k1 is null;
```

```text
+----------------+
| max_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```

Следующий пример сравнения массивов применим к серии Doris 4.1 начиная с 4.1.5, а также к Doris 4.2 и более поздним версиям.

```sql
SELECT max_by(label, sort_key) AS result
FROM (
    SELECT 'null element' AS label, [1, NULL] AS sort_key
    UNION ALL SELECT 'non-null element', [1, 2]
    UNION ALL SELECT 'null array', CAST(NULL AS ARRAY<INT>)
) t;
```

```text
null element
```

```sql
SELECT max_by(1, CAST(NULL AS ARRAY<INT>)) AS result;
```

```text
NULL
```
