---
{
  "title": "IFNULL",
  "language": "ja",
  "description": "<expr1>の値がNULLでない場合は<expr1>を返し、そうでない場合は<expr2>を返します。"
}
---
## 説明

`<expr1>`の値が`NULL`でない場合は`<expr1>`を返し、そうでなければ`<expr2>`を返します。

## エイリアス

- NVL

## 構文

```sql
IFNULL(<expr1>, <expr2>)
```
## パラメータ
- `<expr1>`: `NULL`かどうかをチェックする式。
- `<expr2>`: `<expr1>`が`NULL`の場合に返す値。

## 戻り値
- `<expr1>`が`NULL`でない場合、`<expr1>`を返します。
- そうでなければ、`<expr2>`を返します。

## 例
1. 例1

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
2. 例2

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
3. 両方の引数がNULL

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
