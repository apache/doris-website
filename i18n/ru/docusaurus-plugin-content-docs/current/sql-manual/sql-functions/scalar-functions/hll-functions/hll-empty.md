---
{
    "title": "HLL_EMPTY",
    "language": "ru",
    "description": "HLLEMPTY возвращает пустое значение HLL (HyperLogLog), представляющее набор данных без элементов."
}
---

## Описание {#description}

`HLL_EMPTY` возвращает пустое значение HLL (HyperLogLog), представляющее набор данных без элементов.

## Синтаксис {#syntax}

```sql
HLL_EMPTY()
```

## Возвращаемое значение {#return-value}

Возвращает пустое значение типа HLL, представляющее набор данных без элементов.

## Пример {#example}

```sql
select hll_cardinality(hll_empty());
```

```text
+------------------------------+
| hll_cardinality(hll_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```
