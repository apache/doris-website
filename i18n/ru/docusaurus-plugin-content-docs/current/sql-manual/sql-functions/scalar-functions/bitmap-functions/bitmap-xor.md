---
{
    "title": "BITMAP_XOR",
    "language": "ru",
    "description": "Вычисляет симметрическую разность (операция XOR) двух или более входных Bitmap и возвращает новый Bitmap."
}
---

## Описание {#description}

Вычисляет симметрическую разность (операция XOR) двух или более входных Bitmap и возвращает новый Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_XOR(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Параметры {#parameters}

| Параметр    | Описание          |
|-------------|-------------------|
| `<bitmap1>` | Первый Bitmap     |
| `<bitmap2>` | Второй Bitmap     |
| ...         | ...               |
| `<bitmapN>` | N-й Bitmap        |

## Возвращаемое значение {#return-value}

Bitmap, представляющий симметрическую разность нескольких Bitmap.
- Если параметр имеет значение NULL, возвращается NULL

## Примеры {#examples}

Вычисление симметрической разности двух Bitmap:

```sql
select bitmap_count(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) cnt;
```

Результат:

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

Преобразование симметрической разности двух Bitmap в строку:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) res;
```

Результат:

```text
+------+
| res  |
+------+
| 1,4  |
+------+
```

Вычисление симметрической разности трёх Bitmap:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) res;
```

Результат:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

Вычисление симметрической разности нескольких Bitmap, включая пустой Bitmap:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) res;
```

Результат:

```text
+-------+
| res   |
+-------+
| 1,3,5 |
+-------+
```

Вычисление симметрической разности нескольких Bitmap, включая значение `NULL`:

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) res;
```

Результат:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
