---
{
    "title": "BITMAP_HAS_ALL",
    "language": "ru",
    "description": "Определяет, содержит ли один Bitmap все элементы другого Bitmap."
}
---

## Описание {#description}

Определяет, содержит ли один Bitmap все элементы другого Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_HAS_ALL(<bitmap1>, <bitmap2>)
```

## Параметры {#parameters}

| Параметр    | Описание          |
|-------------|-------------------|
| `<bitmap1>` | Первый Bitmap     |
| `<bitmap2>` | Второй Bitmap     |

## Возвращаемое значение {#return-value}

Возвращает `true`, если `<bitmap1>` содержит все элементы `<bitmap2>`;  
Возвращает `true`, если `<bitmap2>` не содержит элементов;  
В противном случае возвращает `false`.
- Если параметр имеет значение NULL, возвращает NULL

## Примеры {#examples}

Чтобы проверить, содержит ли один Bitmap все элементы другого Bitmap:

```sql
select bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) as res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    1 |
+------+
```

Чтобы проверить, содержит ли пустой Bitmap все элементы другого Bitmap:

```sql
select bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) as res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
|    0 |
+------+
```


```sql
select bitmap_has_all(bitmap_empty(), NULL) as res;
```

Результат будет следующим:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
