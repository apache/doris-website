---
{
    "title": "EXPLODE_JSON_ARRAY_INT",
    "language": "ru",
    "description": "Табличная функция explodejsonarrayint принимает массив JSON."
}
---

## Описание {#description}
Табличная функция `explode_json_array_int` принимает массив JSON. В её реализации массив JSON преобразуется в тип массива, после чего для обработки вызывается функция `explode_outer`. Поведение эквивалентно выражению: `explode(cast(<json_array> as Array<BIGINT>))`.
Функцию следует использовать вместе с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_ARRAY_INT(<json>)
```

## Параметры {#parameters}
- `<json>` — значение типа JSON, содержимое которого должно быть массивом.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, состоящий из всех элементов `<json>`. Тип столбца — `Nullable<BIGINT>`.
- Если `<json>` имеет значение NULL или является пустым массивом (число элементов равно 0), возвращается 0 строк.
- Если элементы массива JSON имеют тип, отличный от INT, функция пытается преобразовать их в INT. Элементы, которые невозможно преобразовать в INT, преобразуются в NULL. Правила преобразования типов см. в разделе [Преобразование типов JSON](../../basic-element/sql-data-types/conversion/json-conversion.md).

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
    select * from example lateral view explode_json_array_int('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    5 |
    |    1 | NULL |
    +------+------+
    ```
2. Тип, отличный от INT
    ```sql
    select * from example 
        lateral view 
        explode_json_array_int('["abc", "123.4", 9223372036854775808.0, 9223372036854775295.999999]') t2 as c;
    ```
    ```text
    +------+---------------------+
    | k1   | c                   |
    +------+---------------------+
    |    1 |                NULL |
    |    1 |                 123 |
    |    1 |                NULL |
    |    1 | 9223372036854774784 |
    +------+---------------------+
    ```
    > `9223372036854775808.0` выходит за пределы допустимого диапазона `BIGINT`, поэтому преобразуется в NULL.
    > Строка "123.4" преобразуется в 123.
    > Строку "abc" невозможно преобразовать в INT, поэтому результатом будет NULL.
3. Пустой массив
    ```sql
    select * from example lateral view explode_json_array_int('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр NULL
    ```sql
    select * from example lateral view explode_json_array_int(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. Параметр, не являющийся массивом
    ```sql
    select * from example lateral view explode_json_array_int('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
