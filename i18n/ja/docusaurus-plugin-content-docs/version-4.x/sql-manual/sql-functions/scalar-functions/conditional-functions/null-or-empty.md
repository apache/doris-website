---
{
    "title": "NULL_OR_EMPTY",
    "language": "ja",
    "description": "指定した値が NULL または空かを判定します。"
}
---

## 説明

`null_or_empty` 関数は、指定した値が NULL または空かを判定します。NULL または空であれば true、それ以外は false を返します。

## 構文

```sql
NULL_OR_EMPTY (<str>)
```

## パラメータ
- `<str>`: STRING 型。NULL または空かを判定する文字列。

## 戻り値
文字列が空文字列または NULL の場合は true、それ以外は false を返します。

## 例
1. 例 1
    ```sql
    select null_or_empty(null), null_or_empty(""), null_or_empty(" ");
    ```
    ```text
    +---------------------+-------------------+--------------------+
    | null_or_empty(null) | null_or_empty("") | null_or_empty(" ") |
    +---------------------+-------------------+--------------------+
    |                   1 |                 1 |                  0 |
    +---------------------+-------------------+--------------------+
    ```
