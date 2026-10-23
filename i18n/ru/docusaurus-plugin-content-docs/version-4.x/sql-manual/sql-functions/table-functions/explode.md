---
{
    "title": "EXPLODE",
    "language": "ru",
    "description": "Функция explode принимает один или несколько массивов и преобразует каждый элемент массивов в отдельную строку."
}
---

## Описание {#description}
Функция `explode` принимает один или несколько массивов и преобразует каждый элемент массивов в отдельную строку. Её следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md) для преобразования вложенных структур данных в стандартный формат плоской таблицы. Основное различие между `explode` и [`explode_outer`](./explode-outer.md) заключается в обработке значений NULL.

## Синтаксис {#syntax}
```sql
EXPLODE(<array>[, ...])
```

## Переменное число параметров {#variadic-parameters}
- `<array>` — параметр типа массив.

## Возвращаемое значение {#return-value}
- Возвращает результат из одного столбца и нескольких строк, состоящий из всех элементов `<array>`.
- Если `<array>` равен NULL или является пустым массивом (число элементов равно 0), возвращается 0 строк.

## Примечания по использованию {#usage-notes}
1. Если параметр `<array>` не имеет тип [`Array`](../../basic-element/sql-data-types/semi-structured/ARRAY.md), возвращается ошибка.
2. Если передано несколько массивов, число строк после развёртывания определяется массивом с наибольшим числом элементов. Массивы с меньшим числом элементов дополняются значениями NULL.

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
    select  * from example lateral view explode([1, 2, null, 4, 5]) t2 as c;
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
    select  * from example lateral view explode([], [1, 2, null, 4, 5], ["ab", "cd", "ef"], [null, null, 1, 2, 3, 4, 5]) t2 as c0, c1, c2, c3;
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
    > Массив с наибольшим числом строк после развёртывания — `[null, null, 1, 2, 3, 4, 5]` (c3), который даёт 7 строк. Поэтому итоговый результат содержит 7 строк, а остальные три массива (c0, c1, c2) дополняются значениями NULL в недостающих строках.
3. Пустой массив
    ```sql
    select  * from example lateral view explode([]) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр NULL
    ```sql
    select  * from example lateral view explode(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. Параметр, не являющийся массивом
    ```sql
    select  * from example lateral view explode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode(VARCHAR(3))
    ```
