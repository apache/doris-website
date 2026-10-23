---
{
    "title": "BITMAP_UNION_COUNT",
    "language": "ru",
    "description": "Вычисляет объединение входных Bitmap и возвращает его мощность."
}
---

## Описание {#description}

Вычисляет объединение входных Bitmap и возвращает его мощность.

## Синтаксис {#syntax}

```sql
BITMAP_UNION_COUNT(<expr>)
```

## Аргументы {#arguments}

| Аргумент | Описание |
| -- | -- |
| `<expr>` | Тип данных с поддержкой Bitmap |

## Возвращаемое значение {#return-value}

Возвращает размер объединения Bitmap, то есть количество уникальных элементов. Если в группе нет допустимых данных, возвращает 0.

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
    (2, 200, to_bitmap(300));
```

```sql
select bitmap_union_count(user_id) from pv_bitmap;
```

Подсчитывает количество уникальных значений user_id.

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           3 |
+-----------------------------+
```

```sql
select bitmap_union_count(user_id) from pv_bitmap where user_id is null;
```

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           0 |
+-----------------------------+
```
