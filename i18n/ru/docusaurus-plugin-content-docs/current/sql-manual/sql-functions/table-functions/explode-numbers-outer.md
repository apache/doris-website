---
{
    "title": "EXPLODE_NUMBERS_OUTER",
    "language": "ru",
    "description": "Функция explodenumbersouter принимает целое число и выводит каждое число из диапазона в отдельной строке."
}
---

## Описание {#description}
Функция `explode_numbers_outer` принимает целое число и выводит каждое число из диапазона в отдельной строке. Ее следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md) для преобразования вложенных структур данных в стандартный формат плоской таблицы. Основное различие между `explode_numbers_outer` и [`explode_numbers`](./explode-numbers.md) заключается в обработке значений NULL.

## Синтаксис {#syntax}
```sql
EXPLODE_NUMBERS_OUTER(<int>)
```

## Параметры {#parameters}
- `<int>` Целочисленный тип

## Возвращаемое значение {#return-value}
- Возвращает столбец целых чисел `[0, n)` с типом `Nullable<INT>`.
- Если `<int>` равен NULL, 0 или отрицательному числу, возвращается 1 строка со значением NULL.

## Примеры {#examples}
1. Обычные параметры
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(10) t2 as c;
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
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(0) t2 as c;
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
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Отрицательный параметр
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(-1) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
