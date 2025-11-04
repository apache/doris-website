---
{
    "title": "EXPLODE_JSON_OBJECT_OUTER",
    "language": "en"
}
---

# EXPLODE_JSON_OBJECT_OUTER
## Description
The `explode_json_object_outer` table function expands a JSON object into multiple rows, each containing a key-value pair.
It is commonly used to transform JSON objects into a more query-friendly format. This function only supports JSON objects with elements.
It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax
```sql
EXPLODE_JSON_OBJECT_OUTER(<json>)
```

## Parameters
- `<json>` JSON type, the content should be a JSON object.

## Return Value
- Returns a single-column, multi-row result composed of all elements in `<json>`. The column type is `Nullable<Struct<String, JSON>>`.
- If `<json>` is NULL or not a JSON object (such as an array `[]`), 1 row with NULL is returned.
- If `<json>` is an empty object (such as `{}`), 1 row with NULL is returned.

## Examples
0. Prepare data
    ```sql
    create table example(
        k1 int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. Regular parameters
    ```sql
    select  * from example lateral view explode_json_object_outer('{"k1": "v1", "k2": 123}') t2 as c;
    ```
    ```text
    +------+------------------------------+
    | k1   | c                            |
    +------+------------------------------+
    |    1 | {"col1":"k1", "col2":""v1""} |
    |    1 | {"col1":"k2", "col2":"123"}  |
    +------+------------------------------+
    ```
2. Expand key-value pairs into separate columns
    ```sql
    select  * from example lateral view explode_json_object_outer('{"k1": "v1", "k2": 123}') t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | k1   | "v1" |
    |    1 | k2   | 123  |
    +------+------+------+
    ```
    > The type of `v` is JSON
3. Empty object
    ```sql
    select  * from example lateral view explode_json_object_outer('{}') t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | NULL | NULL |
    +------+------+------+
    ```
4. NULL parameter
    ```sql
    select  * from example lateral view explode_json_object_outer(NULL) t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | NULL | NULL |
    +------+------+------+
    ```
5. Non-object parameter
    ```sql
    select  * from example lateral view explode_json_object_outer('[]') t2 as k, v;
    ```
    ```text
    +------+------+------+
    | k1   | k    | v    |
    +------+------+------+
    |    1 | NULL | NULL |
    ```