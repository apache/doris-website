---
{
    "title": "POSEXPLODE_OUTER",
    "language": "en",
    "description": "The posexplodeouter table function expands the <array> column into multiple rows and adds a column indicating the position, returning a STRUCT type."
}
---

## Description
The `posexplode_outer` table function expands the `<array>` column into multiple rows and adds a column indicating the position, returning a [`STRUCT`](../../basic-element/sql-data-types/semi-structured/STRUCT.md) type.
It should be used together with Lateral View and supports multiple Lateral Views.
The main difference between `posexplode_outer` and [`posexplode`](./posexplode.md) is how they handle null values.

## Syntax
```sql
POSEXPLODE_OUTER(<array>)
```

## Parameters
- `<array>` Array type, NULL is not supported.

## Return Value
- Returns a single-column, multi-row STRUCT data. STRUCT consists of two columns:
    1. A column of integers starting from 0, incrementing by 1, until n – 1, where n represents the number of result rows.
    2. A column containing all elements of `<array>`.
- If `<array>` is NULL or an empty array (number of elements is 0), 1 row with NULL are returned.

## Usage Notes
1. `<array>` cannot be NULL or other types, otherwise an error will be reported.

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
    select  * from (select 1 as k1) t1 lateral view posexplode_outer([1, 2, null, 4, 5]) t2 as c;
    ```
    ```text
    +------+-----------------------+
    | k1   | c                     |
    +------+-----------------------+
    |    1 | {"pos":0, "col":1}    |
    |    1 | {"pos":1, "col":2}    |
    |    1 | {"pos":2, "col":null} |
    |    1 | {"pos":3, "col":4}    |
    |    1 | {"pos":4, "col":5}    |
    +------+-----------------------+
    ```
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode_outer([1, 2, null, 4, 5]) t2 as pos, value;
    ```
    ```text
    +------+------+-------+
    | k1   | pos  | value |
    +------+------+-------+
    |    1 |    0 |     1 |
    |    1 |    1 |     2 |
    |    1 |    2 |  NULL |
    |    1 |    3 |     4 |
    |    1 |    4 |     5 |
    +------+------+-------+
    ```
2. Empty array
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode_outer([]) t2 as c;
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
    select  * from (select 1 as k1) t1 lateral view posexplode_outer(NULL) t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode_outer function but got NULL
    ```
4. Non-array parameter
    ```sql
    select  * from (select 1 as k1) t1 lateral view posexplode_outer('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = only support array type for posexplode_outer function but got VARCHAR(3)
    ```