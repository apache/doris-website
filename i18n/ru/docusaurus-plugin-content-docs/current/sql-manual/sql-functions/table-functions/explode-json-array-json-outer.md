---
{
    "title": "EXPLODE_JSON_ARRAY_JSON_OUTER",
    "language": "ru",
    "description": "Табличная функция explodejsonarrayjsonouter принимает массив JSON."
}
---

## Описание {#description}
Табличная функция `explode_json_array_json_outer` принимает массив JSON. Она преобразует массив JSON в тип массива, а затем вызывает функцию `explode_outer` для обработки. Это эквивалентно вызову: `explode_outer(cast(<json_array> as Array<JSON>))`.
Её следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_ARRAY_JSON_OUTER(<json>)
```

## Параметры {#parameters}
- `<json>` имеет тип JSON и должен содержать массив.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, содержащий все элементы `<json>`. Тип столбца: `Nullable<JSON>`.
- Если `<json>` равен NULL или является пустым массивом (количество элементов равно 0), возвращается 1 строка со значением NULL.

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
    select * from example lateral view explode_json_array_json_outer('[4, "abc", {"key": "value"}, 5.23, null]') t2 as c;
    ```
    ```text
    +------+-----------------+
    | k1   | c               |
    +------+-----------------+
    |    1 | 4               |
    |    1 | "abc"           |
    |    1 | {"key":"value"} |
    |    1 | 5.23            |
    |    1 | NULL            |
    +------+-----------------+
    ```
2. Пустой массив
    ```sql
    select * from example lateral view explode_json_array_json_outer('[]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. Параметр со значением NULL
    ```sql
    select * from example lateral view explode_json_array_json_outer(NULL) t2 as c;
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
    select * from example lateral view explode_json_array_json_outer('{}') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
