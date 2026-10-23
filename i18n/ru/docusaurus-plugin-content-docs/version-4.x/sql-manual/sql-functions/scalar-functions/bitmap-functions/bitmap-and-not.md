---
{
    "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
    "language": "ru",
    "description": "Выполняет операцию NOT над двумя BITMAP и возвращает результат. Первый входной параметр называется base BITMAP, а второй называется exclude BITMAP."
}
---

## Описание {#description}

Выполняет операцию NOT над двумя BITMAP и возвращает результат. Первый входной параметр называется `base BITMAP`, а второй называется `exclude BITMAP`.

## Псевдоним {#alias}

- BITMAP_ANDNOT

## Синтаксис {#syntax}

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```

## Параметры {#parameters}

| Параметр    | Описание                         |
|-------------|----------------------------------|
| `<bitmap1>` | `Base BITMAP`, к которому применяется отрицание |
| `<bitmap2>` | `Exclusion BITMAP`, к которому применяется отрицание |

## Возвращаемое значение {#return-value}

Возвращает BITMAP.
- Если параметр имеет значение NULL, возвращает NULL

## Примеры {#examples}

```sql
select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
```

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) as cnt;
```

```text
+------+
| cnt  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty())) cnt;
```

```text
+-------+
| cnt   |
+-------+
| 1,2,3 |
+-------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
