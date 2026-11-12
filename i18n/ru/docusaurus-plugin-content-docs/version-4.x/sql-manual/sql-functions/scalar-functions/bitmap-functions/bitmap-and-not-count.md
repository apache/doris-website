---
{
    "title": "BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT",
    "language": "ru",
    "description": "Выполняет операцию NOT над двумя BITMAP и возвращает количество элементов в результирующем множестве."
}
---

## Описание {#description}

Выполняет операцию NOT над двумя BITMAP и возвращает количество элементов в результирующем множестве. Первый входной параметр называется `base BITMAP`, а второй называется `exclusion BITMAP`.

## Псевдоним {#alias}

- BITMAP_ANDNOT_COUNT

## Синтаксис {#syntax}

```sql
BITMAP_AND_NOT_COUNT(<bitmap1>, <bitmap2>)
```

## Параметры {#parameters}

| Параметр   | Описание                      |
|-------------|----------------------------------|
| `<bitmap1>` | `Base BITMAP`, к которому применяется операция NOT      |
| `<bitmap2>` | `Exclusion BITMAP`, к которому применяется операция NOT |

## Возвращаемое значение {#return-value}

Возвращает целое число.
- Если параметр имеет значение NULL, возвращает 0

## Примеры {#examples}

```sql
select bitmap_and_not_count(NULL, bitmap_from_string('1,2,3')) banc1, bitmap_and_not_count(bitmap_from_string('1,2,3'), NULL) banc2;
```

```text
+-------+-------+
| banc1 | banc2 |
+-------+-------+
|     0 |     0 |
+-------+-------+
```

```sql
select bitmap_and_not_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) banc;
```

```text
+------+
| banc |
+------+
|    2 |
+------+
```
