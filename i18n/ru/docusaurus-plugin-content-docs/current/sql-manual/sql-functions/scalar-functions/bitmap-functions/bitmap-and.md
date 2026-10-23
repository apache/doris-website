---
{
    "title": "BITMAP_AND",
    "language": "ru",
    "description": "Вычисляет пересечение двух или более входных BITMAP и возвращает новый BITMAP."
}
---

## Описание {#description}

Вычисляет пересечение двух или более входных BITMAP и возвращает новый BITMAP.

## Синтаксис {#syntax}

```sql
BITMAP_AND(<bitmap>, <bitmap>,[, <bitmap>...])
```

## Параметры {#parameters}

| Параметр   | Описание                                                       |
|------------|----------------------------------------------------------------|
| `<bitmap>` | Один из исходных BITMAP, пересечение которых требуется найти |

## Возвращаемое значение {#return-value}

Возвращает BITMAP
- Если параметр имеет значение NULL, возвращает NULL

## Примеры {#examples}

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) as res;
```

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty())) as res;
```

```text
+------+
| res  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
