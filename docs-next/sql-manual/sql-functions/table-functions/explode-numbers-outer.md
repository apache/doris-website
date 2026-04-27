---
{
    "title": "EXPLODE_NUMBERS_OUTER",
    "language": "en",
    "description": "The explodenumbersouter function accepts an integer and maps each number in the range to a separate row."
}
---

## Description
The `explode_numbers_outer` function accepts an integer and maps each number in the range to a separate row. It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md) to flatten nested data structures into a standard flat table format. The main difference between `explode_numbers_outer` and [`explode_numbers`](./explode-numbers.md) is how they handle null values.

## Syntax
```sql
EXPLODE_NUMBERS_OUTER(<int>)
```

## Parameters
- `<int>` Integer type

## Return Value
- Returns an integer column `[0, n)`, with column type `Nullable<INT>`.
- If `<int>` is NULL, 0, or negative, 1 row with NULL is returned.

## Examples
1. Regular parameters
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(10) t2 as c;
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
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(0) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
3. NULL parameter
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(NULL) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Negative parameter
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_numbers_outer(-1) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```