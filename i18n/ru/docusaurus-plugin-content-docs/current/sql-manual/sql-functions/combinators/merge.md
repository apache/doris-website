---
{
    "title": "MERGE",
    "language": "ru",
    "description": "Промежуточные результаты агрегации объединяются для вычисления итогового результата."
}
---

## Описание {#description}

Промежуточные результаты агрегации объединяются для вычисления итогового результата.
Тип результата совпадает с типом результата `AGGREGATE_FUNCTION`.

## Синтаксис {#syntax}

`AGGREGATE_FUNCTION_MERGE(agg_state)`

## Пример {#example}
```
mysql [test]>select avg_merge(avg_state(1)) from d_table;
+-------------------------+
| avg_merge(avg_state(1)) |
+-------------------------+
|                       1 |
+-------------------------+
```
### Ключевые слова {#keywords}
AGG_STATE, MERGE
