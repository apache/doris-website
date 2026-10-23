---
{
    "title": "BITMAP_XOR_COUNT",
    "language": "ru",
    "description": "Вычисляет симметрическую разность (операция XOR) двух или более множеств Bitmap и возвращает количество элементов в результирующем множестве."
}
---

## Описание {#description}

Вычисляет симметрическую разность (операция XOR) двух или более множеств Bitmap и возвращает количество элементов в результирующем множестве.

## Синтаксис {#syntax}

```sql
BITMAP_XOR_COUNT(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## Параметры {#parameters}

| Параметр    | Описание          |
|-------------|-------------------|
| `<bitmap1>` | Первый Bitmap     |
| `<bitmap2>` | Второй Bitmap     |
| ...         | ...               |
| `<bitmapN>` | N-й Bitmap        |

## Возвращаемое значение {#return-value}

Количество элементов в Bitmap, полученном в результате операции XOR над несколькими Bitmap.  
Возвращает 0, если хотя бы один из входных параметров Bitmap равен `NULL`.

## Примеры {#examples}

Чтобы вычислить количество элементов в симметрической разности двух Bitmap:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    4 |
+------+
```

Чтобы вычислить количество элементов в симметрической разности двух одинаковых Bitmap:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    0 |
+------+
```

Чтобы вычислить количество элементов в симметрической разности двух разных Bitmap:

```sql
select bitmap_xor_count(bitmap_from_string('1,2,3'), bitmap_from_string('4,5,6')) res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    6 |
+------+
```

Чтобы вычислить количество элементов в симметрической разности трёх Bitmap:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5')) res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

Чтобы вычислить количество элементов в симметрической разности нескольких Bitmap, включая пустой Bitmap:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty());
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    3 |
+------+
```

Чтобы вычислить количество элементов в симметрической разности нескольких Bitmap, включая значение `NULL`:

```sql
select bitmap_xor_count(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL) res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    0 |
+------+
```
