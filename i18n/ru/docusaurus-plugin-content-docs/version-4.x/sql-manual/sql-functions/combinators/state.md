---
{
    "title": "STATE",
    "language": "ru",
    "description": "Возвращает промежуточный результат агрегатной функции,"
}
---

## Описание {#description}

Возвращает промежуточный результат агрегатной функции, который можно использовать для последующего агрегирования или получения итогового результата вычисления с помощью комбинатора merge, а также напрямую записать в таблицу типа agg_state и сохранить.
Тип результата — agg_state, а сигнатура функции в agg_state — `AGGREGATE_FUNCTION(arg...)`.

## Синтаксис {#syntax}

`AGGREGATE_FUNCTION_STATE(arg...)`

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
AGG_STATE,STATE
