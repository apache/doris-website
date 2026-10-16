---
{
    "title": "COALESCE",
    "language": "ja",
    "description": "引数のリストを左から右へ評価し、最初の NULL でない式の値を返します。すべての引数が NULL の場合は NULL を返します。"
}
---

## 説明

引数のリストを左から右へ評価し、最初の NULL でない式の値を返します。すべての引数が NULL の場合は NULL を返します。

## 構文

```sql
COALESCE( <expr1> [ , ... , <exprN> ] )
```

## パラメータ
### 必須パラメータ
- `<expr1>`: 任意の型の式。
### 可変長パラメータ
- `COALESCE` 関数には複数の可変長パラメータを指定できます。

## 戻り値
引数のリストで最初の NULL でない式の値を返します。すべての引数が NULL の場合は NULL を返します。

## 使用上の注意
1. 複数の引数は、できるだけ同じ型にしてください。
2. 引数の型が異なる場合、この関数は同じ型への変換を試みます。変換規則は [型変換](../../../basic-element/sql-data-types/conversion/overview.md) を参照してください。
3. 現在、引数には次の型のみを指定できます。
    * 文字列型（String/VARCHAR/CHAR）
    * 真偽値型（Boolean）
    * 数値型（TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal）
    * 日付型（Date、DateTime）
    * Bitmap 型（Bitmap）
    * 半構造化型（JSON、Array、MAP、Struct）

## 例
1. 引数の型変換
    ```sql
    select coalesce(null, 2, 1.234);
    ```
    ```text
    +--------------------------+
    | coalesce(null, 2, 1.234) |
    +--------------------------+
    |                    2.000 |
    +--------------------------+
    ```
    > 三番目の引数 "1.234" が Decimal 型のため、引数 "2" は Decimal 型に変換されます。

2. すべての引数が NULL の場合
    ```sql
    select coalesce(null, null, null);
    ```
    ```text
    +----------------------------+
    | coalesce(null, null, null) |
    +----------------------------+
    | NULL                       |
    +----------------------------+
    ```
