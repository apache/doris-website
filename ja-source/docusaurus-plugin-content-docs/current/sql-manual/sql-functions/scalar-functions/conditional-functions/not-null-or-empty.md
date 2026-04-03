---
{
  "title": "NOT_NULL_OR_EMPTY",
  "language": "ja",
  "description": "notnullorempty関数は、指定された値がNULLでなく、かつ空でないかを判定するために使用されます。入力値がNULLでも空でもない場合、"
}
---
## 説明

`not_null_or_empty`関数は、与えられた値がNULLでも空でもないかを判定するために使用されます。入力値がNULLでも空でもない場合、trueを返します。そうでなければfalseを返します。

## 構文

```sql
NOT_NULL_OR_EMPTY (<str>)
```
## パラメータ
- `<str>`: String型、NULLまたは空かどうかをチェックする文字列。

## 戻り値
文字列が空文字列またはNULLの場合はfalseを返し、そうでなければtrueを返します。

## 例
1. 例1

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
