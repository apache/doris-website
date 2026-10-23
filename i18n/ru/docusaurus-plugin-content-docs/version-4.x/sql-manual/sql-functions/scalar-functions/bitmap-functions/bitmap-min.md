---
{
    "title": "BITMAP_MIN",
    "language": "ru",
    "description": "Вычисляет и возвращает минимальное значение в Bitmap."
}
---

## Описание {#description}

Вычисляет и возвращает минимальное значение в Bitmap.

## Синтаксис {#syntax}

```sql
BITMAP_MIN(<bitmap>)
```

## Параметры {#parameters}

| Параметр   | Описание                        |
|------------|---------------------------------|
| `<bitmap>` | Столбец или выражение типа Bitmap |

## Возвращаемое значение {#return-value}

Минимальное значение в Bitmap.  
Возвращает `NULL`, если Bitmap пуст или имеет значение NULL.

## Примеры {#examples}

Чтобы вычислить минимальное значение в пустом Bitmap:

```sql
select bitmap_min(bitmap_from_string('')) value;
```

Результат будет следующим:

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```

Чтобы вычислить минимальное значение в Bitmap с несколькими элементами:

```sql
select bitmap_min(bitmap_from_string('1,9999999999')) value;
```

Результат будет следующим:

```text
+-------+
| value |
+-------+
|     1 |
+-------+
```

```sql
select bitmap_min(bitmap_empty()) res1,bitmap_min(NULL) res2;
```

Результат будет следующим:

```text
+------+------+
| res1 | res2 |
+------+------+
| NULL | NULL |
+------+------+
```
