---
{
    "title": "BITMAP_HAS_ANY",
    "language": "ru",
    "description": "Определяет, есть ли у двух Bitmap общие элементы."
}
---

## Описание {#description}

Определяет, есть ли у двух Bitmap общие элементы.

## Синтаксис {#syntax}

```sql
BITMAP_HAS_ANY(<bitmap1>, <bitmap2>)
```

## Параметры {#parameters}

| Параметр    | Описание             |
|-------------|----------------------|
| `<bitmap1>` | Первый Bitmap        |
| `<bitmap2>` | Второй Bitmap        |

## Возвращаемое значение {#return-value}

Возвращает true, если у двух Bitmap есть общие элементы;
Возвращает false, если у двух Bitmap нет общих элементов.
- Если значение параметра равно NULL, возвращает NULL

## Примеры {#examples}

```sql
select bitmap_has_any(to_bitmap(1), to_bitmap(2)) res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), to_bitmap(1)) res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), NULL) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
