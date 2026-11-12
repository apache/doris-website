---
{
    "title": "BITMAP_REMOVE",
    "language": "ru",
    "description": "Удаляет указанное значение из столбца Bitmap."
}
---

## Описание {#description}

Удаляет указанное значение из столбца Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_REMOVE(<bitmap>, <value>)
```

## Параметры {#parameters}

| Параметр    | Описание       |
|-------------|----------------|
| `<bitmap>`  | Значение Bitmap |
| `<value>`   | Значение для удаления |

## Возвращаемое значение {#return-value}

Возвращает Bitmap после удаления указанного значения.

Возвращает исходный Bitmap, если удаляемое значение отсутствует;  
Возвращает `NULL`, если удаляемое значение равно `NULL`.

## Примеры {#examples}

Удаление значения из Bitmap:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```

Результат:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

Удаление значения `NULL` из Bitmap:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```

Результат:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
