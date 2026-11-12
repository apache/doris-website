---
{
    "title": "EXPLODE_SPLIT_OUTER",
    "language": "ru",
    "description": "Табличная функция explodesplitouter используется для разделения строки на несколько подстрок по указанному разделителю,"
}
---

## Описание {#description}
Табличная функция `explode_split_outer` используется для разделения строки на несколько подстрок по указанному разделителю и вывода каждой подстроки в отдельной строке.
Её следует использовать вместе с [`LATERAL VIEW`](../../../query-data/lateral-view.md) для преобразования вложенных структур данных в стандартный формат плоской таблицы.
Основное различие между `explode_split_outer` и [`explode_split`](./explode-split.md) заключается в обработке значений NULL.

## Синтаксис {#syntax}
```sql
EXPLODE_SPLIT_OUTER(<str>, <delimiter>)
```

## Параметры {#parameters}
- `<str>`: тип String, строка для разделения.
- `<delimiter>`: тип String, разделитель.

## Возвращаемое значение {#return-value}
- Возвращает столбец из полученных при разделении подстрок. Тип столбца: String.

## Примечания по использованию {#usage-notes}
1. Если `<str>` имеет значение NULL, возвращается 1 строка со значением NULL.
2. Если `<str>` представляет собой пустую строку ("") или не поддаётся разделению, возвращается 1 строка.
3. Если `<delimiter>` имеет значение NULL, возвращается 1 строка со значением NULL.
4. Если `<delimiter>` представляет собой пустую строку (""), `<str>` разделяется по байтам ([`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md)).

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
    select  * from example lateral view explode_split_outer("ab,cd,ef", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | ab   |
    |    1 | cd   |
    |    1 | ef   |
    +------+------+
    ```
2. Пустая строка и случаи, когда разделение невозможно
    ```sql
    select  * from example lateral view explode_split_outer("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from example lateral view explode_split_outer("abc", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | abc  |
    +------+------+
    ```
3. Параметр NULL
    ```sql
    select  * from example lateral view explode_split_outer(NULL, ',') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Пустой разделитель
    ```sql
    select  * from example lateral view explode_split_outer('abc', '') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | a    |
    |    1 | b    |
    |    1 | c    |
    +------+------+
    ```
5. Разделитель равен NULL
    ```sql
    select  * from example lateral view explode_split_outer('abc', null) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
