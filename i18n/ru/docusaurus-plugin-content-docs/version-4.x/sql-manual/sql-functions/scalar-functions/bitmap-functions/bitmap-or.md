---
{
    "title": "BITMAP_OR",
    "language": "ru",
    "description": "Вычисляет объединение двух или более объектов Bitmap и возвращает новый объект Bitmap."
}
---

## Описание {#description}

Вычисляет объединение двух или более объектов Bitmap и возвращает новый объект Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_OR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Параметры {#parameters}

| Параметр   | Описание    |
|-------------|----------------|
| `<bitmap1>` | Первый объект Bitmap   |
| `<bitmap2>` | Второй объект Bitmap  |
| ...         | ...            |
| `<bitmapN>` | N-й объект Bitmap   |

## Возвращаемое значение {#return-value}

Объект Bitmap, представляющий объединение нескольких объектов Bitmap.

## Примеры {#examples}

Вычисление объединения двух одинаковых объектов Bitmap:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
```

Результат будет следующим:

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

Преобразование объединения двух одинаковых объектов Bitmap в строку:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) as res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
| 1    |
+------+
```

Вычисление объединения двух разных объектов Bitmap:

```sql
select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
```

Результат будет следующим:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

Преобразование объединения двух разных объектов Bitmap в строку:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

Вычисление объединения нескольких объектов Bitmap, включая значение `NULL`:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) res;
```

Результат будет следующим:

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

Вычисление объединения нескольких объектов Bitmap, включая пустой объект Bitmap:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) res;
```

Результат будет следующим:

```text
+----------+
| res      |
+----------+
| 0,1,2,10 |
+----------+
```

Вычисление объединения объектов Bitmap, созданных из строк и отдельных значений:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) res;
```

Результат будет следующим:

```text
+--------------+
| res          |
+--------------+
| 1,2,3,4,5,10 |
+--------------+
```
