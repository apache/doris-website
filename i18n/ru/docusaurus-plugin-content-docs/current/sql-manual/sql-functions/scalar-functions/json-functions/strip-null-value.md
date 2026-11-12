---
{
    "title": "STRIP_NULL_VALUE",
    "language": "ru",
    "description": "Функция STRIPNULLVALUE преобразует значения NULL в JSON в значения NULL в SQL. Все остальные значения типа variant остаются без изменений."
}
---

## Описание {#description}

Функция `STRIP_NULL_VALUE` преобразует значения NULL в JSON в значения NULL в SQL. Все остальные значения типа variant остаются без изменений.

## Синтаксис {#syntax}

```sql
STRIP_NULL_VALUE( <json_doc> )
```

## Обязательные параметры {#required-parameters}
- `<json_doc>`: тип JSON, объект JSON для обработки.

## Примечания по использованию {#usage-notes}
1. Если аргумент имеет значение NULL, возвращает NULL.
2. Если аргумент имеет значение null в JSON, возвращает NULL.
3. Для данных JSON, отличных от null, возвращает исходное значение.

## Примеры {#examples}
0. Подготовка данных
```sql
create table my_test(id INT, v json) properties('replication_num' = '1');
insert into my_test values(0, 'null'), (1, null), (2, 123), (3, '{"key": 445}'), (4, '{"key": null}');

select * from my_test;
```
1. Пример 1
    ```sql
    select id, v, strip_null_value(v) from my_test order by id;
    ```
    ```text
    +------+--------------+---------------------+
    | id   | v            | strip_null_value(v) |
    +------+--------------+---------------------+
    |    0 | null         | NULL                |
    |    1 | NULL         | NULL                |
    |    2 | 123          | 123                 |
    |    3 | {"key":445}  | {"key":445}         |
    |    4 | {"key":null} | {"key":null}        |
    +------+--------------+---------------------+
    5 rows in set (0.02 sec)
    ```

2. Пример 2
    ```sql
    select
        id
        , v
        , strip_null_value(json_extract(v, '$.key')) 
    from my_test order by id;
    ```
    ```text
    +------+--------------+--------------------------------------------+
    | id   | v            | strip_null_value(json_extract(v, '$.key')) |
    +------+--------------+--------------------------------------------+
    |    0 | null         | NULL                                       |
    |    1 | NULL         | NULL                                       |
    |    2 | 123          | NULL                                       |
    |    3 | {"key":445}  | 445                                        |
    |    4 | {"key":null} | NULL                                       |
    +------+--------------+--------------------------------------------+
    ```
