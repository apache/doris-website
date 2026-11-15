---
{
    "title": "MIN_BY",
    "language": "ru",
    "description": "Функция MINBY возвращает связанное значение для минимального значения указанного столбца."
}
---

## Описание {#description}

Функция MIN_BY возвращает связанное значение для минимального значения указанного столбца.

Если `<expr2>` имеет тип Array, массивы сравниваются лексикографически, элемент за элементом; элемент NULL считается больше любого элемента, не равного NULL. Значение массива NULL игнорируется.

Различия между версиями: начиная с 4.1.5 в серии Doris 4.1, а также в Doris 4.2 и более поздних версиях элемент `NULL` внутри массива считается больше элемента, не равного `NULL`. В Doris 4.0 и версиях Doris 4.1 до 4.1.5 элемент массива `NULL` считается меньше. Значение массива `NULL` игнорируется во всех этих версиях.

Если в нескольких строках значение `<expr2>` одинаково и является минимальным, `MIN_BY` возвращает `<expr1>` из одной из этих строк. Выбор строки не гарантирован, поэтому результат не обязательно будет наименьшим из связанных значений. Для предсказуемого результата задайте правило разрешения совпадений: например, отберите строки с минимальным `<expr2>` и примените `MIN` к `<expr1>`.

## Синтаксис {#syntax}

```sql
MIN_BY(<expr1>, <expr2>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<expr1>` | Выражение для связанного значения. Поддерживаемые типы: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, TimestampNs, Array, Map, Struct. |
| `<expr2>` | Выражение для определения минимального значения. Поддерживаемые типы: Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, TimestampNs, Array. |

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

Ниже приведён один из возможных результатов; в этом примере допустимо возвращение как `3`, так и `4`.

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

### Предсказуемая обработка совпадающих минимальных значений {#deterministic-handling-of-tied-minimum-values}

Этот самостоятельный пример возвращает наименьшее значение `k1` среди строк с минимальным `k4`. Хотя минимальное значение `k4 = 1` встречается в двух строках, результат всегда равен `3`:

```sql
WITH data AS (
    SELECT 0 AS k1, 100 AS k4
    UNION ALL SELECT 1, 4
    UNION ALL SELECT 4, 1
    UNION ALL SELECT 3, 1
)
SELECT MIN(k1) AS min_k1
FROM data
WHERE k4 = (SELECT MIN(k4) FROM data);
```

```text
+--------+
| min_k1 |
+--------+
|      3 |
+--------+
```
