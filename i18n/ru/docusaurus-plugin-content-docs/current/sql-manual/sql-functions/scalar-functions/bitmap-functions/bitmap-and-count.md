---
{
    "title": "BITMAP_AND_COUNT",
    "language": "ru",
    "description": "Вычисляет пересечение двух или более входных BITMAP и возвращает количество элементов в пересечении."
}
---

## Описание {#description}

Вычисляет пересечение двух или более входных BITMAP и возвращает количество элементов в пересечении.

## Синтаксис {#syntax}

```sql
BITMAP_AND_COUNT(<bitmap>, <bitmap>,[, <bitmap>...])
```

## Параметры {#parameters}

| Параметр   | Описание                                                       |
|------------|----------------------------------------------------------------|
| `<bitmap>` | Один из исходных BITMAP, для которых вычисляется пересечение |

## Возвращаемое значение {#return-value}

Возвращает целое число
- Если параметр имеет значение NULL, возвращает 0

## Примеры {#examples}

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    2 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty()) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```
