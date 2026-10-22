---
{
    "title": "EXPLODE_JSON_OBJECT",
    "language": "ru",
    "description": "Табличная функция explodejsonobject разворачивает объект JSON в несколько строк, каждая из которых содержит пару «ключ — значение»."
}
---

# EXPLODE_JSON_OBJECT {#explode_json_object}
## Описание {#description}
Табличная функция `explode_json_object` разворачивает объект JSON в несколько строк, каждая из которых содержит пару «ключ — значение».
Обычно её используют для преобразования объектов JSON в формат, более удобный для запросов. Эта функция поддерживает только объекты JSON, содержащие элементы.
Её следует использовать вместе с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_OBJECT(<json>)
```

## Параметры {#parameters}
- `<json>` — значение типа JSON, содержимое должно быть объектом JSON.

## Возвращаемое значение {#return-value}
- Возвращает результат с одним столбцом и несколькими строками, состоящий из всех элементов в `<json>`. Тип столбца — `Nullable<Struct<String, JSON>>`.
- Если `<json>` имеет значение NULL или не является объектом JSON (например, является массивом `[]`), возвращается 0 строк.
- Если `<json>` — пустой объект (например, `{}`), возвращается 0 строк.

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
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as c;
    ```
    ```text
    +------+------------------------------+
    | k1   | c                            |
    +------+------------------------------+
    |    1 | {"col1":"k1", "col2":""v1""} |
    |    1 | {"col1":"k2", "col2":"123"}  |
    +------+------------------------------+
    ```
2. Разворачивание пар «ключ — значение» в отдельные столбцы
    ```sql
    select  * from example lateral view explode_json_object('{"k1": "v1", "k2": 123}') t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k1   | "v1" |
    |    1 | k2   | 123  |
    +------+------+------+
    ```
    > Столбец `v` имеет тип JSON
3. Пустой объект
    ```sql
    select  * from example lateral view explode_json_object('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр со значением NULL
    ```sql
    select  * from example lateral view explode_json_object(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. Параметр, не являющийся объектом
    ```sql
    select  * from example lateral view explode_json_object('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
