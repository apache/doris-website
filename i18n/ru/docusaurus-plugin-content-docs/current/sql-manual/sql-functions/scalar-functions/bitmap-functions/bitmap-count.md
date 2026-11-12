---
{
    "title": "BITMAP_COUNT",
    "language": "ru",
    "description": "Подсчитывает количество элементов во входном BITMAP"
}
---

## Описание {#description}

Подсчитывает количество элементов во входном BITMAP

## Синтаксис {#syntax}

```sql
BITMAP_COUNT(<bitmap>)
```

## Параметры {#parameters}

| Параметр   | Описание |
|------------|-------------|
| `<bitmap>` | Значение BITMAP |

## Возвращаемое значение {#return-value}

Возвращает целое число

## Примеры {#examples}

```sql
select bitmap_count(to_bitmap(1)) cnt;
```

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

```sql
select bitmap_count(bitmap_empty()) cnt;
```

```text
+------+
| cnt  |
+------+
|    0 |
+------+
```
