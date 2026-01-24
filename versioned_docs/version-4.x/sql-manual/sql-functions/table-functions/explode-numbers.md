---
{
    "title": "EXPLODE_NUMBERS",
    "language": "en",
    "description": "The explodenumbers function accepts an integer and maps each number in the range to a separate row."
}
---

## Description
The `explode_numbers` function accepts an integer and maps each number in the range to a separate row. It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md) to flatten nested data structures into a standard flat table format. The main difference between `explode_numbers` and [`explode_numbers_outer`](./explode-numbers-outer.md) is how they handle null values.

## Syntax
```sql
EXPLODE_NUMBERS(<int>)
```

## Parameters
- `<int>` Integer type

## Return Value
- Returns an integer column `[0, n)`, with column type `INT`.
- If `<int>` is NULL or 0 or negative, 0 rows are returned.


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
    select  * from example lateral view explode_numbers(10) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |    0 |
    |    1 |    1 |
    |    1 |    2 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |    7 |
    |    1 |    8 |
    |    1 |    9 |
    +------+------+
    ```
2. Parameter 0
    ```sql
    select  * from example lateral view explode_numbers(0) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL parameter
    ```sql
    select  * from example lateral view explode_numbers(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Negative parameter
    ```sql
    select  * from example lateral view explode_numbers(-1) t2 as c;
    ```
    ```text
    Empty set (0.04 sec)
    ```