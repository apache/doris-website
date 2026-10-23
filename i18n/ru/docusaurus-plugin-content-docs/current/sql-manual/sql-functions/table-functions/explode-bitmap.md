---
{
    "title": "EXPLODE_BITMAP",
    "language": "ru",
    "description": "Табличная функция explodebitmap принимает данные типа bitmap и преобразует каждый бит в bitmap в отдельную строку."
}
---

## Описание {#description}
Табличная функция `explode_bitmap` принимает данные типа bitmap и преобразует каждый бит в bitmap в отдельную строку.
Обычно она используется для обработки данных bitmap, разворачивая каждый элемент bitmap в отдельную запись. Функцию следует использовать вместе с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_BITMAP(<bitmap>)
```

## Параметры {#parameters}
- `<bitmap>`: значение типа [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md)

## Возвращаемое значение {#return-value}
- Для каждого бита в `<bitmap>` возвращается строка, содержащая значение этого бита.

## Примечания по использованию {#usage-notes}
1. Если параметр `<bitmap>` не относится к типу [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md), возникает ошибка.

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
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 |    1 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |   10 |
    +------+------+
    ```
2. Пустой BITMAP
    ```sql
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. Параметр NULL
    ```sql
    select  * from example lateral view explode_bitmap(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр, не являющийся массивом
    ```sql
    select  * from example lateral view explode_bitmap('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap(VARCHAR(3))
    ```
