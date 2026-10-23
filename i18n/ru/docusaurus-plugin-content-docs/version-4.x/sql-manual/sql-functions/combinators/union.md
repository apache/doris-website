---
{
    "title": "UNION",
    "language": "ru",
    "description": "Объединяет несколько промежуточных результатов агрегации в один. Результат имеет тип aggstate,"
}
---

## Описание {#description}

Объединяет несколько промежуточных результатов агрегации в один.
Результат имеет тип agg_state, а сигнатура функции соответствует входному параметру.

## Синтаксис {#syntax}

`AGGREGATE_FUNCTION_UNION(agg_state)`

## Пример {#example}
```
mysql [test]>select avg_merge(t) from (select avg_union(avg_state(1)) as t from d_table group by k1)p;
+----------------+
| avg_merge(`t`) |
+----------------+
|              1 |
+----------------+
```
### Ключевые слова {#keywords}
AGG_STATE, UNION
