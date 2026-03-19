---
{
  "title": "NULLIF",
  "language": "ja",
  "description": "2つの入力値が等しい場合はNULLを返し、そうでなければ最初の入力値を返します。"
}
---
## 説明

2つの入力値が等しい場合は`NULL`を返し、そうでない場合は最初の入力値を返します。この関数は以下の`CASE WHEN`式と等価です：

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```
## 構文

```sql
NULLIF(<expr1>, <expr2>)
```
## パラメータ
- `<expr1>`: 比較される最初の入力値。サポートされる型については以下の使用上の注意を参照してください。
- `<expr2>`: 最初の入力値と比較される2番目の値。サポートされる型については以下の使用上の注意を参照してください。

## 使用上の注意
パラメータでサポートされる型:
1. Boolean
2. 数値型 (TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal)
3. 日付型 (Date, DateTime, Time)
4. 文字列型 (String, VARCHAR, CHAR)

## 戻り値
- `<expr1>` が `<expr2>` と等しい場合、`NULL` を返します。
- そうでなければ、`<expr1>` の値を返します。

## 例
1. 例1

    ```sql
    SELECT NULLIF(1, 1);
    ```
    ```text
    +--------------+
    | NULLIF(1, 1) |
    +--------------+
    |         NULL |
    +--------------+
    ```
2. 例2

    ```sql
    SELECT NULLIF(1, 0);
    ```
    ```text
    +--------------+
    | NULLIF(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```
