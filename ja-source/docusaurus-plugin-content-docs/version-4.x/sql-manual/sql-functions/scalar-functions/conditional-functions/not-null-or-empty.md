---
{
  "title": "NOT_NULL_OR_EMPTY",
  "description": "notnullorempty関数は、指定された値がNULLでなく、かつ空でないかどうかを判定するために使用されます。入力値がNULLでも空でもない場合、",
  "language": "ja"
}
---
## 説明

`not_null_or_empty` 関数は、指定された値がNULLでなく、かつ空でないかを判定するために使用されます。入力値がNULLでも空でもない場合、trueを返し、そうでない場合はfalseを返します。

## 構文

```sql
NOT_NULL_OR_EMPTY (<str>)
```
## パラメータ
- `<str>`: String型、NULLまたは空文字列かどうかをチェックする文字列。

## Return Value
文字列が空文字列またはNULLの場合はfalseを返し、そうでなければtrueを返します。

## Examples
1. Example 1

    ```sql
    select not_null_or_empty(null), not_null_or_empty("");, not_null_or_empty(" ");
    ```
    ```text
    +-------------------------+-----------------------+------------------------+
    | not_null_or_empty(null) | not_null_or_empty("") | not_null_or_empty(" ") |
    +-------------------------+-----------------------+------------------------+
    |                       0 |                     0 |                      1 |
    +-------------------------+-----------------------+------------------------+
    ```
