---
{
  "title": "CAST式",
  "language": "ja",
  "description": "CASTは、あるデータ型の値を別のデータ型に変換します。"
}
---
## 概要

CASTは、あるデータ型の値を別のデータ型に変換します。
TRY_CASTは、変換が失敗する可能性がある場合にエラーをスローする代わりにSQL NULL値を返す、安全な型変換メカニズムです。

## 構文

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```
## 引数

- source_expr  
  異なるデータ型に変換される、サポートされている任意のデータ型の式。
- target_data_type  
  対象のデータ型。型が追加のプロパティをサポートしている場合（例：DECIMAL(p, s)の精度とスケール）、必要に応じてそれらを含めてください。

## Strict Mode

Doris 4.0以前では、DorisのCAST動作はMySQLのようなデータベースシステムに従い、CAST操作でエラーが発生することを避けようとしていました。例えば、MySQLで以下のSQLを実行する場合：

```sql
select cast('abc' as signed);
```
結果は次のようになります：

```
0
```
Doris 4.0以降、PostgreSQLの慣行に従って、より厳密なアプローチを採用しています：無効な変換に遭遇した場合、Dorisは混乱を招く可能性のある結果を生成するのではなく、直接エラーを報告します。

Doris 4.0では新しい変数`enable_strict_cast`が導入され、以下で有効にできます：

```sql
set enable_strict_cast = true;
```
strict モードでは、不正な CAST 操作は直接エラーになります：

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```
strict modeの利点は以下の通りです：
1. CAST操作中にユーザーが予期しない値を取得することを防ぎます
2. システムは全てのデータが正常に型変換できると仮定できるため（不正なデータは直接エラーを引き起こします）、計算中により良い最適化が可能になります

## 例

### 通常のCAST変換

```sql
SELECT CAST('123' AS INT);
```
```text
+--------------------+
| cast('123' as int) |
+--------------------+
|                123 |
+--------------------+
```
### TRY_CASTを使用して変換失敗の可能性を処理する

変換が失敗する可能性がある場合、TRY_CASTを使用することで、NULLを返すことによりクエリエラーを防ぐことができます：

```sql
SELECT TRY_CAST('abc' AS INT);
```
```text
+------------------------+
| try_cast('abc' as int) |
+------------------------+
|                   NULL |
+------------------------+
```
## 動作

target_data_typeによってCASTを分類します：

- [Cast to ARRAY](./array-conversion.md)
- [Cast to BOOLEAN](./boolean-conversion.md)
- [Cast to DATE](./date-conversion.md)
- [Cast to TIME](./time-conversion.md)
- [Cast to DATETIME](./datetime-conversion.md)
- [Cast to TIMESTAMPTZ](./timestamptz-conversion.md)
- [Cast to integers (INT, etc.)](./int-conversion.md)
- [Cast to floating point (FLOAT/DOUBLE)](./float-double-conversion.md)
- [Cast to DECIMAL](./decimal-conversion.md)
- [Cast to JSON / From JSON to other types](./json-conversion.md)
- [Cast to MAP](./map-conversion.md)
- [Cast to STRUCT](./struct-conversion.md)
- [Cast to IP](./ip-conversion.md)

## 暗黙的CAST

一部の関数は暗黙的CASTを引き起こす可能性があり、特定のケースで予期しない動作を引き起こすことがあります。
EXPLAIN文を使用して暗黙的CASTが発生するかどうかを確認できます：

```sql
EXPLAIN SELECT length(123);
```
```text
...
length(CAST(123 AS varchar(65533)))
...
```
上記の実行プランから、システムが自動的にCAST変換を実行し、整数123を文字列型に変換していることがわかります。これは暗黙的なCASTの例です。
