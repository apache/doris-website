---
{
    "title": "IFNULL",
    "language": "ja",
    "description": "<expr1> が NULL でなければ <expr1> を、それ以外の場合は <expr2> を返します。"
}
---

## 説明

`<expr1>` が `NULL` でなければ `<expr1>` を、それ以外の場合は `<expr2>` を返します。

## 別名

- NVL

## 構文

```sql
IFNULL(<expr1>, <expr2>)
```

## パラメータ
- `<expr1>`: `NULL` かを判定する式。
- `<expr2>`: `<expr1>` が `NULL` の場合に返す値。

## 戻り値
- `<expr1>` が `NULL` でなければ `<expr1>` を返します。
- それ以外の場合は `<expr2>` を返します。

## 例
1. 例 1
    ```sql
    SELECT IFNULL(1, 0);
    ```
    ```text
    +--------------+
    | IFNULL(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```
2. 例 2
    ```sql
    SELECT IFNULL(NULL, 10);
    ```
    ```text
    +------------------+
    | IFNULL(NULL, 10) |
    +------------------+
    |               10 |
    +------------------+
    ```
3. 両方の引数が NULL の場合
    ```sql
    SELECT IFNULL(NULL, NULL);
    ```
    ```text
    +--------------------+
    | IFNULL(NULL, NULL) |
    +--------------------+
    |               NULL |
    +--------------------+
    ```