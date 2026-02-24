---
{
    "title": "IF",
    "language": "en",
    "description": "If the expression <condition> is true, returns <valuetrue>; otherwise, returns <valuefalseornull>."
}
---

## Description

If the expression `<condition>` is true, returns `<value_true>`; otherwise, returns `<value_false_or_null>`.
Return type: The result type of the `<value_true>` expression.

## Syntax

```sql
IF(<condition>, <value_true>, <value_false_or_null>)
```
## Parameters
- `<condition>`: Boolean type, the expression used to determine whether the condition is true.
- `<value_true>`: The value returned when `<condition>` is true.
- `<value_false_or_null>`: The value returned when `<condition>` is false or NULL.

## Examples
0. Prepare data
    ```sql
    create table test_if(
        user_id int
    ) properties('replication_num' = '1');
    insert into test_if values(1),(2),(null);
    ```
1. Example 1
    ```sql
    SELECT user_id, IF(user_id = 1, "true", "false") AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL | false   |
    |       1 | true    |
    |       2 | false   |
    +---------+---------+
    ```
2. Type conversion
    ```sql
    SELECT user_id, IF(user_id = 1, 2, 3.14) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    3.14 |
    |       1 |    2.00 |
    |       2 |    3.14 |
    +---------+---------+
    ```
    > The second argument "2" is converted to the type of the third argument "3.14" (Decimal).

3. NULL argument
    ```sql
    SELECT user_id, IF(user_id = 1, 2, NULL) AS test_if FROM test_if;
    ```
    ```text
    +---------+---------+
    | user_id | test_if |
    +---------+---------+
    |    NULL |    NULL |
    |       1 |       2 |
    |       2 |    NULL |
    +---------+---------+
    ```
