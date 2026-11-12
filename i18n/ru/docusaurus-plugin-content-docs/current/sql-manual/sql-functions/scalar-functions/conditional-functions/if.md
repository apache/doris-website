---
{
    "title": "IF",
    "language": "ru",
    "description": "Если выражение <condition> истинно, возвращает <valuetrue>; в противном случае возвращает <valuefalseornull>."
}
---

## Описание {#description}

Если выражение `<condition>` истинно, возвращает `<value_true>`; в противном случае возвращает `<value_false_or_null>`.
Тип возвращаемого значения: тип результата выражения `<value_true>`.

## Синтаксис {#syntax}

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```
## Параметры {#parameters}
- `<condition>`: Выражение типа Boolean, определяющее, истинно ли условие.
- `<value_true>`: Значение, возвращаемое, когда `<condition>` истинно.
- `<value_false_or_null>`: Значение, возвращаемое, когда `<condition>` ложно или равно NULL.

## Примеры {#examples}
0. Подготовка данных
    ```sql
    create table test_if(
        user_id int
    ) properties('replication_num' = '1');
    insert into test_if values(1),(2),(null);
    ```
1. Пример 1
    ```sql
    SELECT user_id, IF(user_id = 1, "true", "false") AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL | false   |
    |       1 | true    |
    |       2 | false   |
    +---------+---------+
    ```
2. Преобразование типов
    ```sql
    SELECT user_id, IF(user_id = 1, 2, 3.14) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    3.14 |
    |       1 |    2.00 |
    |       2 |    3.14 |
    +---------+---------+
    ```
    > Второй аргумент "2" преобразуется к типу третьего аргумента "3.14" (Decimal).

3. Аргумент NULL
    ```sql
    SELECT user_id, IF(user_id = 1, 2, NULL) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    NULL |
    |       1 |       2 |
    |       2 |    NULL |
    +---------+---------+
    ```
