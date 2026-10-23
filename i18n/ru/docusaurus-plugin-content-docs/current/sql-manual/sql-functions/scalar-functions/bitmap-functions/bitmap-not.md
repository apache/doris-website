---
{
    "title": "BITMAP_NOT",
    "language": "ru",
    "description": "Вычисляет разность первого и второго Bitmap и возвращает результат в виде нового Bitmap."
}
---

## Описание {#description}

Вычисляет разность первого и второго Bitmap и возвращает результат в виде нового Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_NOT(<bitmap1>, <bitmap2>)
```

## Параметры {#parameters}

| Параметр    | Описание             |
|-------------|----------------------|
| `<bitmap1>` | Первый Bitmap        |
| `<bitmap2>` | Второй Bitmap        |

## Возвращаемое значение {#return-value}

Bitmap, содержащий элементы из `<bitmap1>`, которые отсутствуют в `<bitmap2>`.
- Если параметр имеет значение NULL, возвращается NULL

## Примеры {#examples}

Чтобы вычислить разность двух Bitmap:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) as res;
```

Результатом будет пустой Bitmap, поскольку все элементы из `<bitmap1>` также присутствуют в `<bitmap2>`:

```text
+------+
| res  |
+------+
|      |
+------+
```

Чтобы вычислить разность, когда в `<bitmap1>` есть элементы, отсутствующие в `<bitmap2>`:

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) as res;
```

Результатом будет Bitmap, содержащий элемент `5`:

```text
+------+
| res  |
+------+
| 5    |
+------+
```

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
