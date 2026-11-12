---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
    "language": "ru",
    "description": "Возвращает подмножество Bitmap в указанном диапазоне (исключая его правую границу)."
}
---

## Описание {#description}

Возвращает подмножество Bitmap в указанном диапазоне (исключая его правую границу).

## Синтаксис {#syntax}

```sql
BITMAP_SUBSET_IN_RANGE(<bitmap>, <range_start_include>, <range_end_exclude>)
```

## Параметры {#parameters}

| Параметр             | Описание                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | Значение Bitmap              |
| `<range_start_include>` | Начало диапазона (включительно) |
| `<range_end_exclude>`   | Конец диапазона (не включается)   |

## Возвращаемое значение {#return-value}

Подмножество Bitmap в указанном диапазоне.
- Если параметр имеет значение NULL или указан недопустимый диапазон, возвращается NULL

## Примеры {#examples}

Чтобы получить подмножество Bitmap в диапазоне от 0 до 9:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```

Результат:

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```

Чтобы получить подмножество Bitmap в диапазоне от 2 до 3:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```

Результат:

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, NULL)) value;
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
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, -10000)) value;
```

Результат:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```
