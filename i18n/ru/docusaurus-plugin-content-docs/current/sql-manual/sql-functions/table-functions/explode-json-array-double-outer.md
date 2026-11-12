---
{
    "title": "EXPLODE_JSON_ARRAY_DOUBLE_OUTER",
    "language": "ru",
    "description": "Табличная функция explodejsonarraydoubleouter принимает массив JSON."
}
---

## Описание {#description}
Табличная функция `explode_json_array_double_outer` принимает массив JSON. Она преобразует массив JSON в значение типа массива, а затем вызывает функцию `explode_outer` для обработки. Её поведение эквивалентно: `explode_outer(cast(<json_array> as Array<DOUBLE>))`.
Эту функцию следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_ARRAY_DOUBLE_OUTER(<json>)
```

## Параметры {#parameters}
- `<json>`: значение типа JSON, которое должно содержать массив.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, содержащий все элементы из `<json>`. Тип столбца: `Nullable<DOUBLE>`.
- Если `<json>` имеет значение NULL или является пустым массивом (количество элементов равно 0), возвращается 1 строка со значением NULL.
- Если элементы массива JSON имеют тип, отличный от DOUBLE, функция пытается преобразовать их в DOUBLE. Элементы, которые не удаётся преобразовать в DOUBLE, преобразуются в NULL. Правила преобразования типов см. в разделе [Преобразование типа JSON](../../basic-element/sql-data-types/conversion/json-conversion.md).

## Примеры {#examples}
0. Подготовка данных
    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. Обычные параметры
    ```sql
    select * from example lateral view explode_json_array_double_outer('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. Тип DOUBLE
    ```sql
    select * from example 
        lateral view 
        explode_json_array_double_outer('[123.445, 9223372036854775807.0, 9223372036854775808.0, -9223372036854775808.0, -9223372036854775809.0]') t2 as c;
    ```
    ```text
    +------+------------------------+
    | k1   | c                      |
    +------+------------------------+
    |    1 |                123.445 |
    |    1 |  9.223372036854776e+18 |
    |    1 |  9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    +------+------------------------+
    ```
3. Пустой массив
    ```sql
    select * from example lateral view explode_json_array_double_outer('[]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Параметр NULL
    ```sql
    select * from example lateral view explode_json_array_double_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
5. Параметр, не являющийся массивом
    ```sql
    select * from example lateral view explode_json_array_double_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
