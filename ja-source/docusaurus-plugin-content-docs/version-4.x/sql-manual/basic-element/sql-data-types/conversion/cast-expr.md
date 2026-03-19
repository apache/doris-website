---
{
  "title": "CAST式",
  "description": "CASTは、あるデータ型の値を別のデータ型に変換します。",
  "language": "ja"
}
---
## はじめに

CASTは、あるデータ型の値を別のデータ型に変換します。
TRY_CASTは、変換が失敗する可能性がある場合に、エラーを投げる代わりにSQL NULLの値を返す、安全な型変換メカニズムです。

## 構文

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```
## 引数

- source_expr  
  異なるデータタイプに変換される、サポートされている任意のデータタイプの式。
- target_data_type  
  ターゲットデータタイプ。そのタイプが追加のプロパティをサポートしている場合（例：DECIMAL(p, s)の精度とスケール）、必要に応じてそれらを含める。

## Strict Mode

Doris 4.0以前では、DorisのCAST動作はMySQLなどのデータベースシステムに従い、CAST操作がエラーを発生させることを回避しようとしていました。例えば、MySQLで以下のSQLを実行する場合：

```sql
select cast('abc' as signed);
```
結果は以下のようになります:

```
0
```
Doris 4.0以降、より厳密なアプローチを採用し、PostgreSQLの慣行に従うようになりました。不正な変換に遭遇した場合、Dorisは混乱を招く可能性のある結果を生成するのではなく、直接エラーを報告します。

Doris 4.0では新しい変数`enable_strict_cast`が導入されており、以下で有効にできます：

```sql
set enable_strict_cast = true;
```
strict modeでは、不正なCAST操作は直接エラーになります：

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```
strict modeの利点は以下の通りです：
1. CAST操作中にユーザーが予期しない値を取得することを防ぐ
2. システムはすべてのデータが正常に型変換できると仮定できる（不正なデータは直接エラーを引き起こす）ため、計算時により良い最適化が可能になる

## Examples

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
### TRY_CASTを使用した変換失敗の可能性への対処

変換が失敗する可能性がある場合、TRY_CASTを使用することで、代わりにNULLを返してクエリエラーを防ぐことができます：

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

CASTをtarget_data_typeによって分類します：

- [ARRAYへのキャスト](./array-conversion.md)
- [BOOLEANへのキャスト](./boolean-conversion.md)
- [DATEへのキャスト](./date-conversion.md)
- [TIMEへのキャスト](./time-conversion.md)
- [DATETIMEへのキャスト](./datetime-conversion.md)
- [整数へのキャスト (INT, etc.)](./int-conversion.md)
- [浮動小数点へのキャスト (FLOAT/DOUBLE)](./float-double-conversion.md)
- [DECIMALへのキャスト](./decimal-conversion.md)
- [JSONへのキャスト / JSONから他の型へ](./json-conversion.md)
- [MAPへのキャスト](./map-conversion.md)
- [STRUCTへのキャスト](./struct-conversion.md)
- [IPへのキャスト](./ip-conversion.md)

## 暗黙的CAST

一部の関数は暗黙的CASTを引き起こし、特定の場合に予期しない動作を引き起こす可能性があります。
EXPLAIN文を使用して暗黙的CASTが発生するかどうかを確認できます：

```sql
EXPLAIN SELECT length(123);
```
```text
...
length(CAST(123 AS varchar(65533)))
...
```
上記の実行プランから、システムが自動的にCAST変換を実行し、整数123を文字列型に変換していることが分かります。これは暗黙的なCASTの例です。
