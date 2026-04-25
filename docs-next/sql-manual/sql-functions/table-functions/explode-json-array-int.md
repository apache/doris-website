---
{
    "title": "EXPLODE_JSON_ARRAY_INT",
    "language": "en",
    "description": "The explodejsonarrayint table function accepts a JSON array."
}
---

## Description
The `explode_json_array_int` table function accepts a JSON array. Its implementation logic is to convert the JSON array to an array type and then call the `explode` function for processing. The behavior is equivalent to: `explode(cast(<json_array> as Array<BIGINT>))`.
It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax
```sql
EXPLODE_JSON_ARRAY_INT(<json>)
```

## Parameters
- `<json>` JSON type, the content should be an array.

## Return Value
- Returns a single-column, multi-row result composed of all elements in `<json>`. The column type is `Nullable<BIGINT>`.
- If `<json>` is NULL or an empty array (number of elements is 0), 0 rows are returned.
- If the elements in the JSON array are not of INT type, the function will try to convert them to INT. Elements that cannot be converted to INT will be converted to NULL. For type conversion rules, please refer to [JSON Type Conversion](../../basic-element/sql-data-types/conversion/json-conversion.md).

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
    select * from example lateral view explode_json_array_int('[4, 5, 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    5 |
    |    1 | NULL |
    +------+------+
    ```
2. Non-INT type
    ```sql
    select * from example 
        lateral view 
        explode_json_array_int('["abc", "123.4", 9223372036854775808.0, 9223372036854775295.999999]') t2 as c;
    ```
    ```text
    +------+---------------------+
    | k1   | c                   |
    +------+---------------------+
    |    1 |                NULL |
    |    1 |                 123 |
    |    1 |                NULL |
    |    1 | 9223372036854774784 |
    +------+---------------------+
    ```
    > `9223372036854775808.0` exceeds the valid range of `BIGINT`, so it will be converted to NULL.
    > The string "123.4" is converted to 123.
    > The string "abc" cannot be converted to INT, so the result is NULL.
3. Empty array
    ```sql
    select * from example lateral view explode_json_array_int('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL parameter
    ```sql
    select * from example lateral view explode_json_array_int(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. Non-array parameter
    ```sql
    select * from example lateral view explode_json_array_int('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```