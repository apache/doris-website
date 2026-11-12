---
{
    "title": "BITMAP_UNION",
    "language": "ru",
    "description": "Вычисляет объединение входных Bitmap и возвращает новый Bitmap."
}
---

## Описание {#description}

Вычисляет объединение входных Bitmap и возвращает новый Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_UNION(<expr>)
```

## Аргументы {#arguments}

| Аргумент | Описание |
| -- | -- |
| `<expr>` | Тип данных, поддерживающий Bitmap |

## Возвращаемое значение {#return-value}

Возвращает значение типа Bitmap. Если в группе нет допустимых данных, возвращает пустой Bitmap.

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
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
| 100,200,300                             |
+-----------------------------------------+
```

```sql
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap where user_id is null;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
|                                         |
+-----------------------------------------+
```
