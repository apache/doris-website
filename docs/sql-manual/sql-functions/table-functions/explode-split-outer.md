---
{
    "title": "EXPLODE_SPLIT_OUTER",
    "language": "en"
}
---

## Description
The `explode_split_outer` table function is used to split a string into multiple substrings according to the specified delimiter, and expand each substring into a separate row.
It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md) to flatten nested data structures into a standard flat table format.
The main difference between `explode_split_outer` and [`explode_split`](./explode-split.md) is how they handle null values.

## Syntax
```sql
EXPLODE_SPLIT_OUTER(<str>, <delimiter>)
```

## Parameters
- `<str>` String type, the string to be split.
- `<delimiter>` String type, the delimiter.

## Return Value
- Returns a column composed of the split substrings, with column type String.

## Usage Notes
1. If `<str>` is NULL, 1 row with NULL is returned.
2. If `<str>` is an empty string ("") or cannot be split, 1 row is returned.
3. If `<delimiter>` is NULL, 1 row with NULL is returned.
4. If `<delimiter>` is an empty string (""), `<str>` will be split by bytes([`SPLIT_BY_STRING`](../scalar-functions/string-functions/split-by-string.md)).

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
    select  * from (select 1 as k1) t1 lateral view explode_split_outer("ab,cd,ef", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | ab   |
    |    1 | cd   |
    |    1 | ef   |
    +------+------+
    ```
2. Empty string and unsplittable cases
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_split_outer("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_split_outer("abc", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | abc  |
    +------+------+
    ```
3. NULL parameter
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_split_outer(NULL, ',') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```
4. Empty delimiter
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_split_outer('abc', '') t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | a    |
    |    1 | b    |
    |    1 | c    |
    +------+------+
    ```
5. Delimiter is NULL
    ```sql
    select  * from (select 1 as k1) t1 lateral view explode_split_outer('abc', null) t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 | NULL |
    +------+------+
    ```