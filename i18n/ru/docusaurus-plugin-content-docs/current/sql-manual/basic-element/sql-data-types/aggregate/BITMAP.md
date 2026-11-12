---
{
    "title": "BITMAP",
    "language": "ru",
    "description": "BITMAP"
}
---

## BITMAP {#bitmap}
### Описание {#description}
BITMAP

Столбцы типа BITMAP можно использовать в таблицах моделей Aggregate, Unique и Duplicate.
В таблицах моделей Unique и Duplicate они должны быть неключевыми столбцами.
В таблицах модели Aggregate они должны быть неключевыми столбцами, а при создании таблицы для них необходимо указать тип агрегации BITMAP_UNION.
Пользователю не нужно указывать длину и значение по умолчанию. Длина определяется системой в зависимости от степени агрегации данных.
Запрашивать или использовать столбец BITMAP можно только с помощью поддерживающих его функций, таких как bitmap_union_count, bitmap_union, bitmap_hash и bitmap_hash64.

Использование BITMAP в офлайн-сценариях влияет на скорость загрузки. При большом объёме данных запросы выполняются медленнее, чем при использовании HLL, но быстрее, чем при использовании Count Distinct.
Примечание: если в сценариях реального времени BITMAP используется без глобального словаря, применение bitmap_hash() может приводить к погрешности порядка одной тысячной. Если такая погрешность недопустима, вместо этого можно использовать bitmap_hash64.

### Пример {#example}

Пример создания таблицы:

    create table metric_table (
      datekey int,
      hour int,
      device_id bitmap BITMAP_UNION
    )
    aggregate key (datekey, hour)
    distributed by hash(datekey, hour) buckets 1
    properties(
      "replication_num" = "1"
    );

Пример вставки данных:

    insert into metric_table values
    (20200622, 1, to_bitmap(243)),
    (20200622, 2, bitmap_from_array([1,2,3,4,5,434543])),
    (20200622, 3, to_bitmap(287667876573));

Пример запроса данных:

    select hour, BITMAP_UNION_COUNT(pv) over(order by hour) uv from(
       select hour, BITMAP_UNION(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200622
    group by hour order by 1
    ) final;

Для [переменной сеанса](../../../sql-statements/session/variable/SET-VARIABLE) `return_object_data_as_binary` можно установить значение `true`. В этом случае bitmap будет возвращаться в двоичном формате.

### Ключевые слова {#keywords}
BITMAP
