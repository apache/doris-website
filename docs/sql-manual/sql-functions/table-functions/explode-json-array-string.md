---
{
"title": "EXPLODE_JSON_ARRAY_STRING",
"language": "en"
}
---

## Description
The `explode_json_array_string` table function accepts a JSON array. Its implementation logic is to convert the JSON array to an array type and then call the `explode` function for processing. The behavior is equivalent to: `explode(cast(<json_array> as Array<STRING>))`.
It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md).

## Syntax
```sql
EXPLODE_JSON_ARRAY_STRING(<json>)
```

## Parameters
- `<json>` JSON type, the content should be an array.

## Return Value
- Returns a single-column, multi-row result composed of all elements in `<json>`. The column type is `Nullable<STRING>`.
- If `<json>` is NULL or an empty array (number of elements is 0), 0 rows are returned.
- If the elements in the JSON array are not of STRING type, the function will try to convert them to STRING. If conversion to STRING fails, the element will be converted to NULL. For type conversion rules, please refer to [JSON Type Conversion](../../basic-element/sql-data-types/conversion/json-conversion.md).

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
    select * from example lateral view explode_json_array_string('[4, "5", "abc", 5.23, null]') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | 4    |
    |    1 | 5    |
    |    1 | abc  |
    |    1 | 5.23 |
    |    1 | NULL |
    +------+------+
    ```
2. Empty array
    ```sql
    select * from example lateral view explode_json_array_string('[]') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL parameter
    ```sql
    select * from example lateral view explode_json_array_string(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Non-array parameter
    ```sql
    select * from example lateral view explode_json_array_string('{}') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```