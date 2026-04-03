---
{
  "title": "NULL_OR_EMPTY",
  "description": "nullorempty関数は、指定された値がNULLでもなく空でもないかどうかを判定するために使用されます。入力値がNULLでも空でもない場合、",
  "language": "ja"
}
---
## 説明

`null_or_empty`関数は、与えられた値がNULLでなく、かつ空でないかどうかを判定するために使用されます。入力値がNULLでも空でもない場合、trueを返します。それ以外の場合は、falseを返します。

## 構文

```sql
NULL_OR_EMPTY (<str>)
```
## パラメータ
- `<str>`: String型、NULLまたは空かどうかをチェックする文字列。

## Return Value
文字列が空文字列またはNULLの場合はtrueを返し、そうでなければfalseを返します。

## Examples
1. Example 1

    ```sql
    select null_or_empty(null), null_or_empty("");, null_or_empty(" ");
    ```
    ```text
    +---------------------+-------------------+--------------------+
    | null_or_empty(null) | null_or_empty("") | null_or_empty(" ") |
    +---------------------+-------------------+--------------------+
    |                   1 |                 1 |                  0 |
    +---------------------+-------------------+--------------------+
    ```
