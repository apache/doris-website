---
{
    "title": "BITMAP-UNION-INT",
    "language": "ru",
    "description": "Подсчитывает количество различных неотрицательных целых чисел во входном выражении, игнорируя отрицательные значения и NULL."
}
---

## Описание {#description}

Подсчитывает количество различных неотрицательных целых чисел во входном выражении, игнорируя отрицательные значения и NULL.

Для поддерживаемых целочисленных входных данных эта функция эквивалентна `COUNT(DISTINCT CASE WHEN expr >= 0 THEN expr END)` и `BITMAP_COUNT(BITMAP_AGG(expr))`. Она эквивалентна `COUNT(DISTINCT expr)` только в том случае, если входные данные не содержат отрицательных значений.

## Примечания по использованию {#usage-notes}

В версии, находящейся в разработке, отрицательные значения игнорируются. В более ранних выпусках отрицательные значения могут учитываться; поэтому запросы с отрицательными входными значениями после обновления могут возвращать другие результаты.

## Синтаксис {#syntax}

```sql
BITMAP_UNION_INT(<expr>)
```

## Параметры {#parameters}

| Параметр | Описание |
| --- | --- |
| `<expr>` | Входное выражение. Поддерживаемые типы: TinyInt, SmallInt, Integer. |

## Возвращаемое значение {#return-value}

Возвращает значение типа BIGINT, содержащее количество различных неотрицательных целых чисел. Значения NULL и отрицательные значения игнорируются. Для пустого набора входных данных или группы, содержащей только NULL и отрицательные значения, возвращает 0; результат никогда не равен NULL.

## Пример {#example}

```sql
-- setup
CREATE TABLE pv_bitmap (
    dt INT,
    page INT,
    user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
    (1, 100, to_bitmap(100)),
    (1, 100, to_bitmap(200)),
    (1, 100, to_bitmap(300)),
    (1, 300, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```

```text
Query OK, 0 rows affected
Query OK, 5 rows affected
```

```sql
select bitmap_union_int(dt) from pv_bitmap;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```

```sql
select bitmap_union_int(dt) from pv_bitmap where dt is null;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    0 |
+----------------------+
```

Отрицательные целые числа исключаются, а ноль учитывается:

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (
    SELECT -1 AS x UNION ALL SELECT 0 UNION ALL SELECT 1
    UNION ALL SELECT 1 UNION ALL SELECT NULL
) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 2 |
+-------------------+
```

Для группы, содержащей только отрицательные значения и NULL, функция возвращает ноль:

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (SELECT -1 AS x UNION ALL SELECT -2 UNION ALL SELECT NULL) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 0 |
+-------------------+
```
