---
{
    "title": "HLL (HyperLogLog)",
    "language": "ru",
    "description": "HLL"
}
---

## HLL (HyperLogLog) {#hll-hyperloglog}
### Описание {#description}
HLL

HLL нельзя использовать в качестве ключевого столбца. Столбцы типа QUANTILE_STATE можно использовать в таблицах Aggregate, Duplicate и Unique. При использовании в таблице Aggregate во время создания таблицы указывается тип агрегации QUANTILE_UNION.
Пользователю не нужно указывать длину и значение по умолчанию.
Длина регулируется системой в зависимости от степени агрегации данных.
Выполнять запросы к столбцам HLL или использовать их можно только с помощью соответствующих функций hll_union_agg, hll_raw_agg, hll_cardinality и hll_hash.

HLL позволяет приближённо подсчитывать количество уникальных элементов и при больших объёмах данных работает быстрее, чем Count Distinct.
Погрешность HLL обычно составляет около 1%, иногда достигая 2%.

### Пример {#example}

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;
    
### Ключевые слова {#keywords}
HLL,HYPERLOGLOG
