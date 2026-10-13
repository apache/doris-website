---
{
    "title": "NOT_NULL_OR_EMPTY",
    "language": "ja",
    "description": "指定した値が NULL でも空でもないかを判定します。"
}
---

## 説明

`not_null_or_empty` 関数は、指定した値が NULL でも空でもないかを判定します。NULL でも空でもなければ true、それ以外は false を返します。

## 構文

```sql
NOT_NULL_OR_EMPTY (<str>)
```

## パラメータ
- `<str>`: STRING 型。NULL または空かを判定する文字列。

## 戻り値
文字列が空文字列または NULL の場合は false、それ以外は true を返します。

## 例
1. 例 1
    ```sql
    select not_null_or_empty(null), not_null_or_empty(""), not_null_or_empty(" ");
    ```
    ```text
    +-------------------------+-----------------------+------------------------+
    | not_null_or_empty(null) | not_null_or_empty("") | not_null_or_empty(" ") |
    +-------------------------+-----------------------+------------------------+
    |                       0 |                     0 |                      1 |
    +-------------------------+-----------------------+------------------------+
    ```
