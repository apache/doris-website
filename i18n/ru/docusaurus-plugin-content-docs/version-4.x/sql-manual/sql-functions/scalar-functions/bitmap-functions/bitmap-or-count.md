---
{
    "title": "BITMAP_OR_COUNT",
    "language": "ru",
    "description": "Вычисляет объединение двух или более входных Bitmap и возвращает количество элементов в объединении."
}
---

## Описание {#description}

Вычисляет объединение двух или более входных Bitmap и возвращает количество элементов в объединении.

## Синтаксис {#syntax}

```sql
BITMAP_OR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Параметры {#parameters}

| Параметр    | Описание       |
|-------------|----------------|
| `<bitmap1>` | Первый Bitmap  |
| `<bitmap2>` | Второй Bitmap  |
| ...         | ...            |
| `<bitmapN>` | N-й Bitmap     |

## Возвращаемое значение {#return-value}

Количество элементов в объединении нескольких Bitmap.

## Примеры {#examples}

Чтобы вычислить количество элементов в объединении непустого Bitmap и пустого Bitmap:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) res;
```

Результат:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

Чтобы вычислить количество элементов в объединении двух одинаковых Bitmap:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

Результат:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

Чтобы вычислить количество элементов в объединении двух разных Bitmap:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

Результат:

```text
+------+
| res  |
+------+
|    5 |
+------+
```

Чтобы вычислить количество элементов в объединении нескольких Bitmap, включая пустой Bitmap:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) res;
```

Результат:

```text
+------+
| res  |
+------+
|    6 |
+------+
```

Чтобы вычислить количество элементов в объединении нескольких Bitmap, включая значение `NULL`:

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) res;
```

Результат:

```text
+------+
| res  |
+------+
|    6 |
+------+
```
