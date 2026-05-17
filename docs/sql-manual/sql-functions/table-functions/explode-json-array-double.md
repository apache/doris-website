---
{
    "title": "EXPLODE_JSON_ARRAY_DOUBLE",
    "language": "en",
    "description": "The explodejsonarraydouble table function accepts a JSON array."
}
---

## Description
The `explode_json_array_double` table function accepts a JSON array. Its implementation logic is to convert the JSON array to an array type and then call the `explode` function for processing. The behavior is equivalent to: `explode(cast(<json_array> as Array<DOUBLE>))`.
It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax
```sql
EXPLODE_JSON_ARRAY_DOUBLE(<json>)
```

## Parameters
- `<json>` JSON type, the content should be an array.

## Return Value
- Returns a single-column, multi-row result composed of all elements in `<json>`. The column type is `Nullable<DOUBLE>`.
- If `<json>` is NULL or an empty array (number of elements is 0), 0 rows are returned.
- If the elements in the JSON array are not of DOUBLE type, the function will try to convert them to DOUBLE. Elements that cannot be converted to DOUBLE will be converted to NULL. For type conversion rules, please refer to [JSON Type Conversion](../../basic-element/sql-data-types/conversion/json-conversion.md).

## Examples
0. Prepare data
    ```sql
    create table example(
        id int
    ) properties(
        "replication_num" = "1"
    );

    insert into example values(1);
    ```
1. Regular parameters
    ```sql
    select * from example lateral view explode_json_array_double('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | id   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. DOUBLE type
    ```sql
    select * from example
        lateral view 
        explode_json_array_double('[123.445, 9223372036854775807.0, 9223372036854775808.0, -9223372036854775808.0, -9223372036854775809.0]') t2 as c;
    ```
    ```text
    +------+------------------------+
    | id   | c                      |
    +------+------------------------+
    |    1 |                123.445 |
    |    1 |  9.223372036854776e+18 |
    |    1 |  9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    |    1 | -9.223372036854776e+18 |
    +------+------------------------+
    ```
3. Empty array
    ```sql
    select * from example lateral view explode_json_array_double('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL parameter
    ```sql
    select * from example lateral view explode_json_array_double(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. Non-array parameter
    ```sql
    select * from example lateral view explode_json_array_double('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```