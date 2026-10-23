---
{
    "title": "EXPLODE_BITMAP_OUTER",
    "language": "ru",
    "description": "Табличная функция explodebitmapouter принимает данные типа bitmap и преобразует каждый бит bitmap в отдельную строку."
}
---

## Описание {#description}
Табличная функция `explode_bitmap_outer` принимает данные типа bitmap и преобразует каждый бит bitmap в отдельную строку.
Обычно она используется для обработки данных bitmap, разворачивая каждый элемент bitmap в отдельную запись. Её следует использовать вместе с [`LATERAL VIEW`](../../../query-data/lateral-view.md).
`explode_bitmap_outer` аналогична `explode_bitmap`, но иначе обрабатывает пустые значения и NULL. Она сохраняет записи с пустыми bitmap или bitmap со значением NULL и разворачивает их в строки со значением NULL в результате.

## Синтаксис {#syntax}
```sql
EXPLODE_BITMAP_OUTER(<bitmap>)
```

## Параметры {#parameters}
- `<bitmap>` — значение типа [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md)

## Возвращаемое значение {#return-value}
- Возвращает строку для каждого бита в `<bitmap>`, при этом каждая строка содержит значение бита.
- Если `<bitmap>` имеет значение NULL, возвращается 1 строка со значением NULL.
- Если `<bitmap>` пуст, возвращается 1 строка со значением NULL.


## Примечания по использованию {#usage-notes}
1. Если параметр `<bitmap>` имеет тип, отличный от [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md), будет выдана ошибка.

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
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
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
    select k1, e1 from example lateral view explode_bitmap_outer(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. Параметр NULL
    ```sql
    select  * from example lateral view explode_bitmap_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Параметр, не являющийся массивом
    ```sql
    select  * from example lateral view explode_bitmap_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap_outer(VARCHAR(3))
    ```
