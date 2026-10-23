---
{
    "title": "EXPLODE_JSON_ARRAY_JSON",
    "language": "ru",
    "description": "Табличная функция explodejsonarrayjson принимает массив JSON."
}
---

## Описание {#description}
Табличная функция `explode_json_array_json` принимает массив JSON. При выполнении она преобразует массив JSON в значение типа «массив», а затем вызывает функцию `explode_outer` для обработки. Такое поведение эквивалентно следующему: `explode(cast(<json_array> as Array<JSON>))`.
Функцию следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_ARRAY_JSON(<json>)
```

## Параметры {#parameters}
- `<json>`: значение типа JSON, которое должно быть массивом.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, содержащий все элементы из `<json>`. Столбец имеет тип `Nullable<JSON>`.
- Если `<json>` имеет значение NULL или является пустым массивом (число элементов равно 0), возвращается 0 строк.

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
    select * from example lateral view explode_json_array_json('[4, "abc", {"key": "value"}, 5.23, null]') t2 as c;
    ```
    ```text
    +------+-----------------+
    | k1   | c               |
    +------+-----------------+
    |    1 | 4               |
    |    1 | NULL            |
    |    1 | {"key":"value"} |
    |    1 | 5.23            |
    |    1 | NULL            |
    +------+-----------------+
    ```
2. Пустой массив
    ```sql
    select * from example lateral view explode_json_array_json('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. Параметр NULL
    ```sql
    select * from example lateral view explode_json_array_json(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр, не являющийся массивом
    ```sql
    select * from example lateral view explode_json_array_json('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
