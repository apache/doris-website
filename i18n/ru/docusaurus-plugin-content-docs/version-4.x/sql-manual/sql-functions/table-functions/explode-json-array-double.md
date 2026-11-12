---
{
    "title": "EXPLODE_JSON_ARRAY_DOUBLE",
    "language": "ru",
    "description": "Табличная функция explodejsonarraydouble принимает массив JSON."
}
---

## Описание {#description}
Табличная функция `explode_json_array_double` принимает массив JSON. Она преобразует массив JSON в тип массива, а затем вызывает функцию `explode_outer` для обработки. Её поведение эквивалентно следующему выражению: `explode(cast(<json_array> as Array<DOUBLE>))`.
Её следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
```

## Параметры {#parameters}
- `<json>` — значение типа JSON, содержимое которого должно быть массивом.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, содержащий все элементы из `<json>`. Тип столбца — `Nullable<DOUBLE>`.
- Если `<json>` имеет значение NULL или является пустым массивом (количество элементов равно 0), возвращается 0 строк.
- Если элементы массива JSON имеют тип, отличный от DOUBLE, функция попытается преобразовать их в DOUBLE. Элементы, которые невозможно преобразовать в DOUBLE, получают значение NULL. Правила преобразования типов приведены в разделе [Преобразование типа JSON](../../basic-element/sql-data-types/conversion/json-conversion.md).

## Примеры {#examples}
0. Подготовка данных
    ```sql
    create table example(
        id int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. Обычные параметры
    ```sql
    select * from example lateral view explode_json_array_double('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | id   | c    |
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
        explode_json_array_double('[123.445, 9223372036854775807.0, 9223372036854775808.0, -9223372036854775808.0, -9223372036854775809.0]') t2 as c;
    ```
    ```text
    +------+------------------------+
    | id   | c                      |
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
    select * from example lateral view explode_json_array_double('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр NULL
    ```sql
    select * from example lateral view explode_json_array_double(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. Параметр, не являющийся массивом
    ```sql
    select * from example lateral view explode_json_array_double('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
