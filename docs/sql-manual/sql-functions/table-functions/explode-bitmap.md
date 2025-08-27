---
{
    "title": "EXPLODE_BITMAP",
    "language": "en"
}
---

## Description
The `explode_bitmap` table function accepts a bitmap type data and maps each bit in the bitmap to a separate row.
It is commonly used to process bitmap data, expanding each element in the bitmap into a separate record. It should be used together with [`LATERAL VIEW`](../../../query-data/lateral-view.md).
`explode_bitmap_outer` is similar to `explode_bitmap`, but behaves differently when handling empty or NULL values. It allows records with empty or NULL bitmaps to exist and expands them into NULL rows in the result.

## Syntax
```sql
EXPLODE_BITMAP(<bitmap>)
```

## Parameters
- `<bitmap>` [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md) type

## Return Value
- Returns a row for each bit in `<bitmap>`, with each row containing a bit value.

## Usage Notes
1. If the `<bitmap>` parameter is not of type [`BITMAP`](../../basic-element/sql-data-types/aggregate/BITMAP.md), an error will be reported.

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
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("1,3,4,5,6,10")) t2 as e1 order by k1, e1;
    ```
    ```text
    +------+------+
    | k1   | e1   |
    +------+------+
    |    1 |    1 |
    |    1 |    3 |
    |    1 |    4 |
    |    1 |    5 |
    |    1 |    6 |
    |    1 |   10 |
    +------+------+
    ```
2. Empty BITMAP
    ```sql
    select k1, e1 from example lateral view explode_bitmap(bitmap_from_string("")) t2 as e1 order by k1, e1;
    ```
    ```text
    Empty set (0.03 sec)
    ```
3. NULL parameter
    ```sql
    select  * from example lateral view explode_bitmap(NULL) t2 as c;
    ```
    ```text
    Empty set (0.03 sec)
    ```
4. Non-array parameter
    ```sql
    select  * from example lateral view explode_bitmap('abc') t2 as c;
    ```
    ```text
    ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: explode_bitmap(VARCHAR(3))
    ```