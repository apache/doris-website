---
{
    "title": "EXPLODE_NUMBERS",
    "language": "ru",
    "description": "Функция explodenumbers принимает целое число и выводит каждое число из диапазона в отдельной строке."
}
---

## Описание {#description}
Функция `explode_numbers` принимает целое число и выводит каждое число из диапазона в отдельной строке. Её следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md) для преобразования вложенных структур данных в стандартную плоскую таблицу. Основное различие между `explode_numbers` и [`explode_numbers_outer`](./explode-numbers-outer.md) заключается в обработке значений NULL.

## Синтаксис {#syntax}
```sql
EXPLODE_NUMBERS(<int>)
```

## Параметры {#parameters}
- `<int>` Целочисленный тип

## Возвращаемое значение {#return-value}
- Возвращает столбец целых чисел `[0, n)` с типом `INT`.
- Если `<int>` равен NULL, 0 или отрицательному числу, возвращается 0 строк.


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
1. Обычные значения параметра
    ```sql
    select  * from example lateral view explode_numbers(10) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    0 |
    |    1 |    1 |
    |    1 |    2 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |    7 |
    |    1 |    8 |
    |    1 |    9 |
    +------+------+
    ```
2. Параметр 0
    ```sql
    select  * from example lateral view explode_numbers(0) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. Параметр NULL
    ```sql
    select  * from example lateral view explode_numbers(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Отрицательный параметр
    ```sql
    select  * from example lateral view explode_numbers(-1) t2 as c;
    ```
    ```text
    Empty set (0.04 sec)
    ```
