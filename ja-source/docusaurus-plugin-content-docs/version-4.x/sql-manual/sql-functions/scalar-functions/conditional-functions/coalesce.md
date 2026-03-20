---
{
  "title": "COALESCE",
  "description": "引数リストから最初の非null式を左から右に評価して返します。すべての引数がNULLの場合、NULLを返します。",
  "language": "ja"
}
---
## 説明

引数リストから最初の非null式を左から右に評価して返します。すべての引数がNULLの場合、NULLを返します。

## 構文

```sql
COALESCE( <expr1> [ , ... , <exprN> ] )
```
## パラメータ
### 必須パラメータ
- `<expr1>`: 任意の型の式。
### 可変長パラメータ
- `COALESCE`関数は複数の可変長パラメータをサポートします。

## 戻り値
引数リスト内の最初の非null式を返します。すべての引数がNULLの場合、NULLを返します。

## 使用上の注意
1. 複数の引数の型は可能な限り一貫している必要があります。
2. 複数の引数の型が一貫していない場合、関数は同じ型に変換を試みます。変換ルールについては、[タイプ Conversion](../../../basic-element/sql-data-types/conversion/overview.md)を参照してください。
3. 現在、引数として以下の型のみがサポートされています：
    * String型（String/VARCHAR/CHAR）
    * Boolean型（Boolean）
    * 数値型（TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal）
    * 日付型（Date、DateTime）
    * Bitmap型（Bitmap）
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
> 3番目の引数"1.234"がDecimal型であるため、引数"2"はDecimal型に変換されます。

2. すべての引数がNULL

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
