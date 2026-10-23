---
{
    "title": "EXPLODE_SPLIT",
    "language": "ru",
    "description": "Табличная функция explodesplit используется для разбиения строки на несколько подстрок по указанному разделителю."
}
---

## Описание {#description}
Табличная функция `explode_split` разбивает строку на несколько подстрок по указанному разделителю и выводит каждую подстроку в отдельной строке.
Её следует использовать вместе с [`LATERAL VIEW`](../../../query-data/lateral-view.md) для преобразования вложенных структур данных в стандартную плоскую таблицу.
Основное отличие между `explode_split` и [`explode_split_outer`](./explode-split-outer.md) заключается в обработке значений NULL.

## Синтаксис {#syntax}
```sql
EXPLODE_SPLIT(<str>, <delimiter>)
```

## Параметры {#parameters}
- `<str>`: строка типа String, которую нужно разбить.
- `<delimiter>`: разделитель типа String.

## Возвращаемое значение {#return-value}
- Возвращает столбец типа String, состоящий из полученных подстрок.

## Примечания по использованию {#usage-notes}
1. Если `<str>` имеет значение NULL, возвращается 0 строк.
2. Если `<str>` является пустой строкой ("") или не может быть разбита, возвращается 1 строка.
3. Если `<delimiter>` имеет значение NULL, возвращается 0 строк.
4. Если `<delimiter>` является пустой строкой (""), `<str>` разбивается побайтово ([`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md)).

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
    select  * from example lateral view explode_split("ab,cd,ef", ",") t2 as c;
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
2. Пустая строка и случаи, когда разбиение невозможно
    ```sql
    select  * from example lateral view explode_split("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from example lateral view explode_split("abc", ",") t2 as c;
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
    select  * from example lateral view explode_split(NULL, ',') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Пустой разделитель
    ```sql
    select  * from example lateral view explode_split('abc', '') t2 as c;
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
    select  * from example lateral view explode_split('abc', null) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
