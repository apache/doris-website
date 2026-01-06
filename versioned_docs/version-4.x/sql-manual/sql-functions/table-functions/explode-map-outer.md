---
{
    "title": "EXPLODE_MAP_OUTER",
    "language": "en",
    "description": "The explodemapouter table function accepts a map type and expands the map into multiple rows, each containing a key-value pair."
}
---

## Description
The `explode_map_outer` table function accepts a map type and expands the map into multiple rows, each containing a key-value pair.
It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax
```sql
EXPLODE_MAP_OUTER(<map>)
```

## Parameters
- `<map>` MAP type.

## Return Value
- Returns a single-column, multi-row result composed of all elements in `<map>`. The column type is `Nullable<Struct<K, V>>`.
- If `<map>` is NULL or empty, 1 row with NULL is returned.

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
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as c;
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
2. Expand key-value pairs into separate columns
    ```sql
    select  * from example lateral view explode_map_outer(map("k", "v", "k2", 123, null, null)) t2 as k, v;
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
3. Empty object
    ```sql
    select  * from example lateral view explode_map_outer(map()) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. NULL parameter
    ```sql
    select  * from example lateral view explode_map_outer(cast('ab' as map<string,string>)) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```