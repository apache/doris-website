---
{
    "title": "QUANTILE_STATE_EMPTY",
    "language": "ru",
    "description": "Возвращает пустой столбец типа quantilestate."
}
---

## Описание {#description}

Возвращает пустой столбец типа `quantile_state`.

## Синтаксис {#syntax}

```sql
QUANTILE_STATE_EMPTY()
```

## Возвращаемое значение {#return-value}

Пустой столбец типа `quantile_state`.

## Пример {#example}

```sql
select quantile_percent(quantile_union(quantile_state_empty()), 0)
```

Результат:

```text
+-------------------------------------------------------------+
| quantile_percent(quantile_union(quantile_state_empty()), 0) |
+-------------------------------------------------------------+
|                                                        NULL |
+-------------------------------------------------------------+
```
