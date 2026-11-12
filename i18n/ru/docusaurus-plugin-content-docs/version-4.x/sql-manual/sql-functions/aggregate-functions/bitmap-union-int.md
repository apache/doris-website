---
{
    "title": "BITMAP-UNION-INT",
    "language": "ru",
    "description": "Подсчитывает количество уникальных значений входного выражения. Возвращаемое значение совпадает с результатом COUNT(DISTINCT expr)."
}
---

## Описание {#description}

Подсчитывает количество уникальных значений входного выражения. Возвращаемое значение совпадает с результатом COUNT(DISTINCT expr).

## Синтаксис {#syntax}

```sql
BITMAP_UNION_INT(<expr>)
```

## Аргументы {#arguments}

| Аргумент | Описание |
| -- | -- |
| `<expr>` | Входное выражение. Поддерживаемые типы: TinyInt, SmallInt, Integer. |

## Возвращаемое значение {#return-value}

Возвращает количество уникальных значений в столбце. Если в группе нет допустимых данных, возвращает 0.

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
