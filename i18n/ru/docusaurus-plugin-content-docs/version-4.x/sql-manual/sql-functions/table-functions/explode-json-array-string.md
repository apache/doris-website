---
{
    "title": "EXPLODE_JSON_ARRAY_STRING",
    "language": "ru",
    "description": "Табличная функция explodejsonarraystring принимает JSON-массив."
}
---

## Описание {#description}
Табличная функция `explode_json_array_string` принимает JSON-массив. Она преобразует JSON-массив в значение типа массива, а затем вызывает функцию `explode_outer` для его обработки. Такое поведение эквивалентно выражению: `explode(cast(<json_array> as Array<STRING>))`.
Её следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
```

## Параметры {#parameters}
- `<json>` имеет тип JSON и должен содержать массив.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, содержащий все элементы из `<json>`. Столбец имеет тип `Nullable<STRING>`.
- Если `<json>` имеет значение NULL или является пустым массивом (число элементов равно 0), возвращается 0 строк.
- Если элементы JSON-массива имеют тип, отличный от STRING, функция пытается преобразовать их в STRING. Если преобразование в STRING не удаётся, элемент преобразуется в NULL. Правила преобразования типов описаны в разделе [Преобразование типа JSON](../../basic-element/sql-data-types/conversion/json-conversion.md).

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
    select * from example lateral view explode_json_array_string('[4, "5", "abc", 5.23, null]') t2 as c;
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
    select * from example lateral view explode_json_array_string('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. Параметр NULL
    ```sql
    select * from example lateral view explode_json_array_string(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр, не являющийся массивом
    ```sql
    select * from example lateral view explode_json_array_string('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
