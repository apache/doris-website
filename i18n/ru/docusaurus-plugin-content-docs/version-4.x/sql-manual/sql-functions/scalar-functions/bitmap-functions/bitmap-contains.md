---
{
    "title": "BITMAP_CONTAINS",
    "language": "ru",
    "description": "Проверяет, содержится ли входное значение в BITMAP, и возвращает логическое значение."
}
---

## Описание {#description}

Проверяет, содержится ли входное значение в BITMAP, и возвращает логическое значение.

## Синтаксис {#syntax}

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```

## Параметры {#parameters}

| Параметр   | Описание                                |
|------------|-----------------------------------------|
| `<bitmap>` | Коллекция BITMAP                        |
| `<bitint>` | Целое число для проверки наличия         |

## Возвращаемое значение {#return-value}

Возвращает логическое значение.
- Если параметр равен NULL, возвращает NULL

## Примеры {#examples}

```sql
select bitmap_contains(to_bitmap(1),2) cnt1, bitmap_contains(to_bitmap(1),1) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
|    0 |    1 |
+------+------+
```

```sql
select bitmap_contains(NULL,2) cnt1, bitmap_contains(to_bitmap(1),NULL) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
| NULL | NULL |
+------+------+
```
