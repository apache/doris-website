---
{
    "title": "BITMAP_SUBSET_LIMIT",
    "language": "ru",
    "description": "Извлекает подмножество элементов Bitmap, начиная с указанной позиции, с учётом заданного ограничения на количество элементов,"
}
---

## Описание {#description}

Извлекает подмножество элементов Bitmap, начиная с указанной позиции, с учётом заданного ограничения на количество элементов и возвращает подмножество в виде нового Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_SUBSET_LIMIT(<bitmap>, <position>, <cardinality_limit>)
```

## Параметры {#parameters}

| Параметр              | Описание                      |
|-----------------------|-------------------------------|
| `<bitmap>`            | Значение Bitmap               |
| `<position>`          | Начальная позиция (включительно) |
| `<cardinality_limit>` | Максимальное количество элементов |

## Возвращаемое значение {#return-value}

Подмножество Bitmap, соответствующее заданному диапазону и ограничению.
- Если параметр имеет значение NULL или недопустимое значение, возвращается NULL

## Примеры {#examples}

Чтобы получить подмножество Bitmap, начиная с позиции 0, с ограничением количества элементов 3:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```

Результат:

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```

Чтобы получить подмножество Bitmap, начиная с позиции 4, с ограничением количества элементов 3:

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```

Результат:

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, NULL)) value;
```

Результат:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), -4, 3)) value;
```

Результат:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, -3)) value;
```

Результат:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
