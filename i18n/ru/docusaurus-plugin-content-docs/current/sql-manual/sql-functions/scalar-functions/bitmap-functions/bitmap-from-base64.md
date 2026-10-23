---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "ru",
    "description": "Преобразует строку base64 (которую можно получить с помощью функции bitmaptobase64) в BITMAP. Возвращает NULL, если входная строка некорректна."
}
---

## Описание {#description}

Преобразует строку base64 (которую можно получить с помощью функции `bitmap_to_base64`) в BITMAP. Возвращает NULL, если входная строка некорректна.

## Синтаксис {#syntax}

```sql
 BITMAP_FROM_BASE64(<base64_str>)
```

## Параметры {#parameters}

| Параметр       | Описание                                                        |
|----------------|-----------------------------------------------------------------|
| `<base64_str>` | Строка base64 (можно получить с помощью функции `bitmap_to_base64`) |

## Возвращаемое значение {#return-value}

Возвращает BITMAP
- Если входное поле некорректно, результатом будет NULL

## Примеры {#examples}


```sql
select bitmap_to_string(bitmap_from_base64("invalid")) bts;
```

```text
+------+
| bts  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AA==")) bts;
```

```text
+------+
| bts  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AQEAAAA=")) bts;
```

```text
+------+
| bts  |
+------+
| 1    |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) bts;
```

```text
+-----------+
| bts       |
+-----------+
| 1,9999999 |
+-----------+
```
