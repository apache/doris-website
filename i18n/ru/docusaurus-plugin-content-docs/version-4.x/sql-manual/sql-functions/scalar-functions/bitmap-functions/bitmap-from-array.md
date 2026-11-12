---
{
    "title": "BITMAP_FROM_ARRAY",
    "language": "ru",
    "description": "Преобразует массив элементов типа TINYINT/SMALLINT/INT/BIGINT в BITMAP. Если входное поле содержит недопустимое значение, возвращается NULL."
}
---

## Описание {#description}

Преобразует массив элементов типа TINYINT/SMALLINT/INT/BIGINT в BITMAP. Если входное поле содержит недопустимое значение, возвращается NULL.

## Синтаксис {#syntax}

```sql
BITMAP_FROM_ARRAY(<arr>)
```

## Параметры {#parameters}

| Параметр | Описание   |
|-----------|---------------|
| `<arr>`   | массив целых чисел |

## Возвращаемое значение {#return-value}

Возвращает BITMAP
- Если входное поле содержит недопустимое значение, возвращается NULL

## Примеры {#examples}

```sql
SELECT bitmap_to_string(bitmap_from_array(array(1, 0, 1, 1, 0, 1, 0))) AS bs;
```

```text
+------+
| bs   |
+------+
| 0,1  |
+------+
```


```sql
SELECT bitmap_to_string(bitmap_from_array(NULL)) AS bs;
```

```text
+------+
| bs   |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_array([1,2,3,-1]));
```

```text
+-------------------------------------------------+
| bitmap_to_string(bitmap_from_array([1,2,3,-1])) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```
