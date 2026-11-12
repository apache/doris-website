---
{
    "title": "EXPLODE_JSON_ARRAY_STRING_OUTER",
    "language": "ru",
    "description": "Табличная функция explodejsonarraystringouter принимает массив JSON."
}
---

## Описание {#description}
Табличная функция `explode_json_array_string_outer` принимает массив JSON. При выполнении она преобразует массив JSON в значение типа массива, а затем вызывает функцию `explode_outer` для обработки. Её поведение эквивалентно выражению: `explode_outer(cast(<json_array> as Array<STRING>))`.
Её следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_ARRAY_STRING_OUTER(<json>)
```

## Параметры {#parameters}
- `<json>` имеет тип JSON, содержимое должно быть массивом.

## Возвращаемое значение {#return-value}
- Возвращает результат с одним столбцом и несколькими строками, содержащий все элементы из `<json>`. Тип столбца: `Nullable<STRING>`.
- Если `<json>` равен NULL или представляет собой пустой массив (число элементов равно 0), возвращается 1 строка со значением NULL.
- Если элементы массива JSON имеют тип, отличный от STRING, функция попытается преобразовать их в STRING. Если преобразование в STRING не удаётся, элемент преобразуется в NULL. Правила преобразования типов приведены в разделе [Преобразование типов JSON](../../basic-element/sql-data-types/conversion/json-conversion.md).

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
    select * from example lateral view explode_json_array_string_outer('[4, "5", "abc", 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | 4    |
    |    1 | 5    |
    |    1 | abc  |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. Пустой массив
    ```sql
    select * from example lateral view explode_json_array_string_outer('[]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. Параметр NULL
    ```sql
    select * from example lateral view explode_json_array_string_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Параметр, не являющийся массивом
    ```sql
    select * from example lateral view explode_json_array_string_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
