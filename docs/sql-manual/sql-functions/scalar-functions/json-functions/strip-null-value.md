---
{
    "title": "STRIP_NULL_VALUE",
    "language": "en",
    "description": "The STRIPNULLVALUE function converts NULL values in JSON to NULL values in SQL. All other variant values remain unchanged."
}
---

## Description

The `STRIP_NULL_VALUE` function converts NULL values in JSON to NULL values in SQL. All other variant values remain unchanged.

## Syntax

```sql
STRIP_NULL_VALUE( <json_doc> )
```

## Required Parameters
- `<json_doc>`: JSON type, the JSON object to be processed.

## Usage Notes
1. If the argument is NULL, returns NULL.
2. If the argument is json null, returns NULL.
3. For json data that is not null, returns the original input.

## Examples
0. Prepare data
```sql
create table my_test(id, v json) properties('replication_num' = '1');
insert into my_test values(0, 'null'), (1, null), (2, 123), (3, '{"key": 445}'), (4, '{"key": null}');

select * from my_test;
```
1. Example 1
    ```sql
    select id, v, strip_null_value(v) from my_test order by id;
    ```
    ```text
    +------+--------------+---------------------+
    | id   | v            | strip_null_value(v) |
    +------+--------------+---------------------+
    |    0 | null         | NULL                |
    |    1 | NULL         | NULL                |
    |    2 | 123          | 123                 |
    |    3 | {"key":445}  | {"key":445}         |
    |    4 | {"key":null} | {"key":null}        |
    +------+--------------+---------------------+
    1 row in set (0.02 sec)
    ```

2. Example 2
    ```sql
    select
        id
        , v
        , strip_null_value(json_extract(v, '$.key')) 
    from my_test order by id;
    ```
    ```text
    +------+--------------+--------------------------------------------+
    | id   | v            | strip_null_value(json_extract(v, '$.key')) |
    +------+--------------+--------------------------------------------+
    |    0 | null         | NULL                                       |
    |    1 | NULL         | NULL                                       |
    |    2 | 123          | NULL                                       |
    |    3 | {"key":445}  | 445                                        |
    |    4 | {"key":null} | NULL                                       |
    +------+--------------+--------------------------------------------+
    ```
