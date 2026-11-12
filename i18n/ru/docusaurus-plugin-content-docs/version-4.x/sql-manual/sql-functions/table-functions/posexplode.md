---
{
    "title": "POSEXPLODE",
    "language": "ru",
    "description": "Табличная функция posexplode разворачивает столбец <array> в несколько строк и добавляет столбец с позицией элемента, возвращая данные типа STRUCT."
}
---

## Описание {#description}
Табличная функция `posexplode` разворачивает столбец `<array>` в несколько строк и добавляет столбец с позицией элемента, возвращая данные типа [`STRUCT`](../../basic-element/sql-data-types/semi-structured/STRUCT.md).
Она используется совместно с Lateral View и поддерживает несколько Lateral View.
Основное различие между `posexplode` и [`posexplode_outer`](./posexplode-outer.md) заключается в обработке значений NULL.

## Синтаксис {#syntax}
```sql
POSEXPLODE(<array>)
```

## Параметры {#parameters}
- `<array>`: тип Array, NULL не поддерживается.

## Возвращаемое значение {#return-value}
- Возвращает данные типа STRUCT в одном столбце и нескольких строках. STRUCT состоит из двух столбцов:
1. Столбец целых чисел, начиная с 0 с шагом 1 до n – 1, где n обозначает количество строк результата.
2. Столбец, содержащий все элементы `<array>`.

- Если `<array>` имеет значение NULL или является пустым массивом (количество элементов равно 0), возвращается 0 строк.

## Примечания по использованию {#usage-notes}
1. `<array>` не может быть NULL или иметь другой тип, иначе возникает ошибка.

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
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+-----------------------+
    | k1   | c                     |
    +------+-----------------------+
    |    1 | {"pos":0, "col":1}    |
    |    1 | {"pos":1, "col":2}    |
    |    1 | {"pos":2, "col":null} |
    |    1 | {"pos":3, "col":4}    |
    |    1 | {"pos":4, "col":5}    |
    +------+-----------------------+
    ```
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode([1, 2, null, 4, 5]) t2 as pos, value;
    ```
    ```text
    +------+------+-------+
    | k1   | pos  | value |
    +------+------+-------+
    |    1 |    0 |     1 |
    |    1 |    1 |     2 |
    |    1 |    2 |  NULL |
    |    1 |    3 |     4 |
    |    1 |    4 |     5 |
    +------+------+-------+
    ```
2. Пустой массив
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode([]) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. Параметр NULL
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode(NULL) t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got NULL
    ```
4. Параметр, не являющийся массивом
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode function but got VARCHAR(3)
    ```
