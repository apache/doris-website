---
{
    "title": "EXPLODE_MAP",
    "language": "ru",
    "description": "Табличная функция explodemap принимает значение типа map и разворачивает его в несколько строк, каждая из которых содержит пару из ключа и значения."
}
---

## Описание {#description}
Табличная функция `explode_map` принимает значение типа map и разворачивает его в несколько строк, каждая из которых содержит пару из ключа и значения.
Её следует использовать совместно с [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Синтаксис {#syntax}
```sql
EXPLODE_MAP(<map>)
```

## Параметры {#parameters}
- `<map>`: значение типа MAP.

## Возвращаемое значение {#return-value}
- Возвращает результат с одним столбцом и несколькими строками, состоящий из всех элементов `<map>`. Тип столбца: `Nullable<Struct<K, V>>`.
- Если `<map>` равен NULL или пуст, возвращается 0 строк.

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
    select  * from example lateral view explode_map(map("k", "v", "k2", 123, null, null)) t2 as c;
    ```
    ```text
    +------+-----------------------------+
    | k1   | c                           |
    +------+-----------------------------+
    |    1 | {"col1":"k", "col2":"v"}    |
    |    1 | {"col1":"k2", "col2":"123"} |
    |    1 | {"col1":null, "col2":null}  |
    +------+-----------------------------+
    ```
2. Разворачивание пар ключ-значение в отдельные столбцы
    ```sql
    select  * from example lateral view explode_map(map("k", "v", "k2", 123, null, null)) t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k    | v    |
    |    1 | k2   | 123  |
    |    1 | NULL | NULL |
    +------+------+------+
    ```
3. Пустой объект
    ```sql
    select  * from example lateral view explode_map(map()) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Параметр NULL
    ```sql
    select  * from example lateral view explode_map(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
