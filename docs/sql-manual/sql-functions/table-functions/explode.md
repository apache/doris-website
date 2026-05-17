---
{
    "title": "EXPLODE",
    "language": "en",
    "description": "The explode function accepts one or more arrays and maps each element of the arrays to a separate row."
}
---

## Description
The `explode` function accepts one or more arrays and maps each element of the arrays to a separate row. It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md) to flatten nested data structures into a standard flat table format. The main difference between `explode` and [`explode_outer`](./explode-outer.md) is how they handle null values.

## Syntax
```sql
EXPLODE(<array>[, ...])
```

## Variadic Parameters
- `<array>` Array type.

## Return Value
- Returns a single-column, multi-row result composed of all elements in `<array>`.
- If `<array>` is NULL or an empty array (number of elements is 0), 0 rows are returned.

## Usage Notes
1. If the `<array>` parameter is not of type [`Array`](../../basic-element/sql-data-types/semi-structured/ARRAY.md), an error will be reported.
2. If there are multiple array parameters, the number of expanded rows is determined by the array with the most elements. Arrays with fewer elements will be padded with NULLs.

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
    select  * from example lateral view explode([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    1 |
    |    1 |    2 |
    |    1 | NULL |
    |    1 |    4 |
    |    1 |    5 |
    +------+------+
    ```
2. Multiple parameters
    ```sql
    select  * from example lateral view explode([], [1, 2, null, 4, 5], ["ab", "cd", "ef"], [null, null, 1, 2, 3, 4, 5]) t2 as c0, c1, c2, c3;
    ```
    ```text
    +------+------+------+------+------+
    | k1   | c0   | c1   | c2   | c3   |
    +------+------+------+------+------+
    |    1 | NULL |    1 | ab   | NULL |
    |    1 | NULL |    2 | cd   | NULL |
    |    1 | NULL | NULL | ef   |    1 |
    |    1 | NULL |    4 | NULL |    2 |
    |    1 | NULL |    5 | NULL |    3 |
    |    1 | NULL | NULL | NULL |    4 |
    |    1 | NULL | NULL | NULL |    5 |
    +------+------+------+------+------+
    ```
    > The array with the most rows after expansion is `[null, null, 1, 2, 3, 4, 5]` (c3), which has 7 rows. Therefore, the final result has 7 rows, and the other three arrays (c0, c1, c2) are padded with NULLs for missing rows.
3. Empty array
    ```sql
    select  * from example lateral view explode([]) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. NULL parameter
    ```sql
    select  * from example lateral view explode(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
5. Non-array parameter
    ```sql
    select  * from example lateral view explode('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode(VARCHAR(3))
    ```