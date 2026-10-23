---
{
    "title": "EXPLODE_OUTER",
    "language": "ru",
    "description": "Функция explode принимает массив и преобразует каждый элемент массива в отдельную строку."
}
---

## Описание {#description}
Функция `explode` принимает массив и преобразует каждый элемент массива в отдельную строку. Её следует использовать вместе с [`LATERAL VIEW`](../../../query-data/lateral-view.md) для преобразования вложенных структур данных в стандартный формат плоской таблицы. Главное отличие `explode_outer` от [`explode`](./explode.md) заключается в обработке значений NULL.

## Синтаксис {#syntax}
```sql
EXPLODE_OUTER(<array>[, ...])
```

## Параметры переменной арности {#variadic-parameters}
- `<array>` Массив.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, содержащий все элементы `<array>`.
- Если `<array>` имеет значение NULL или является пустым массивом (число элементов равно 0), возвращается 1 строка со значением NULL.

## Примечания по использованию {#usage-notes}
1. Если параметр `<array>` имеет тип, отличный от [`Array`](../../basic-element/sql-data-types/semi-structured/ARRAY.md), возникает ошибка.
2. При передаче нескольких массивов число строк после разворачивания определяется массивом с наибольшим числом элементов. Массивы с меньшим числом элементов дополняются значениями NULL.

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
    select  * from example lateral view explode_outer([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    1 |
    |    1 |    2 |
    |    1 | NULL |
    |    1 |    4 |
    |    1 |    5 |
    +------+------+
    ```
2. Несколько параметров
    ```sql
    select  * from example lateral view explode_outer([], [1, 2, null, 4, 5], ["ab", "cd", "ef"], [null, null, 1, 2, 3, 4, 5]) t2 as c0, c1, c2, c3;
    ```
    ```text
    +------+------+------+------+------+
    | k1   | c0   | c1   | c2   | c3   |
    +------+------+------+------+------+
    |    1 | NULL |    1 | ab   | NULL |
    |    1 | NULL |    2 | cd   | NULL |
    |    1 | NULL | NULL | ef   |    1 |
    |    1 | NULL |    4 | NULL |    2 |
    |    1 | NULL |    5 | NULL |    3 |
    |    1 | NULL | NULL | NULL |    4 |
    |    1 | NULL | NULL | NULL |    5 |
    +------+------+------+------+------+
    ```
    > Больше всего строк после разворачивания даёт массив `[null, null, 1, 2, 3, 4, 5]` (c3): 7 строк. Поэтому итоговый результат содержит 7 строк, а недостающие строки остальных трёх массивов (c0, c1, c2) заполняются значениями NULL.
3. Пустой массив
    ```sql
    select  * from example lateral view explode_outer([]) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Параметр NULL
    ```sql
    select  * from example lateral view explode_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
5. Параметр, не являющийся массивом
    ```sql
    select  * from example lateral view explode_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_outer(VARCHAR(3))
    ```
