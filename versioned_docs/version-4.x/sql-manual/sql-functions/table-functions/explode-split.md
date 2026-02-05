---
{
    "title": "EXPLODE_SPLIT",
    "language": "en",
    "description": "The explodesplit table function is used to split a string into multiple substrings according to the specified delimiter,"
}
---

## Description
The `explode_split` table function is used to split a string into multiple substrings according to the specified delimiter, and expand each substring into a separate row.
It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md) to flatten nested data structures into a standard flat table format.
The main difference between `explode_split` and [`explode_split_outer`](./explode-split-outer.md) is how they handle null values.

## Syntax
```sql
EXPLODE_SPLIT(<str>, <delimiter>)
```

## Parameters
- `<str>` String type, the string to be split.
- `<delimiter>` String type, the delimiter.

## Return Value
- Returns a column composed of the split substrings, with column type String.

## Usage Notes
1. If `<str>` is NULL, 0 rows are returned.
2. If `<str>` is an empty string ("") or cannot be split, 1 row is returned.
3. If `<delimiter>` is NULL, 0 rows are returned.
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
    select  * from example lateral view explode_split("ab,cd,ef", ",") t2 as c;
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
    select  * from example lateral view explode_split("", ",") t2 as c;
    ```
    ```text
    +------+------+
    | k1   | c    |
    +------+------+
    |    1 |      |
    +------+------+
    ```
    ```sql
    select  * from example lateral view explode_split("abc", ",") t2 as c;
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
    select  * from example lateral view explode_split(NULL, ',') t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Empty delimiter
    ```sql
    select  * from example lateral view explode_split('abc', '') t2 as c;
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
    select  * from example lateral view explode_split('abc', null) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```