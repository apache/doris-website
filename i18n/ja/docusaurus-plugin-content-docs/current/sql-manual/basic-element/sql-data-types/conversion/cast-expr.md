---
{
    "title": "CAST式",
    "language": "ja",
    "description": "CASTは、あるデータ型の値を別のデータ型に変換します。"
}
---

## はじめに {#introduction}

CASTは、あるデータ型の値を別のデータ型に変換します。
TRY_CASTは、変換に失敗した場合にエラーをスローせず、SQLのNULL値を返す安全な型変換機能です。

## 構文 {#syntax}

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```

## 引数 {#arguments}

- source_expr
  別のデータ型に変換する、サポートされている任意のデータ型の式。
- target_data_type
  変換先のデータ型。型が追加の属性をサポートする場合（たとえばDECIMAL(p, s)の精度とスケール）、必要に応じて指定します。

## 厳格モード {#strict-mode}

Doris 4.0より前は、DorisのCASTはMySQLなどのデータベースシステムと同様に、CAST操作でできるだけエラーが発生しないように動作していました。たとえば、MySQLで次のSQLを実行するとします。

```sql
select cast('abc' as signed);
```

結果は次のようになります。
```
0
```

Doris 4.0以降は、PostgreSQLの動作に倣って、より厳密な方法を採用しています。無効な変換が行われた場合、混乱を招く可能性のある結果を生成する代わりに、Dorisは直接エラーを報告します。

Doris 4.0では、新しい変数`enable_strict_cast`が導入されました。次のように有効にできます。

```sql
set enable_strict_cast = true;
```

厳格モードでは、不正なCAST操作は直接エラーになります。

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```

厳格モードには次の利点があります。
1. CAST操作中に予期しない値が返されるのを防げます
2. システムはすべてのデータを正常に型変換できると見なせるため（不正なデータは直接エラーになります）、計算時により効果的な最適化が可能になります

## 例 {#examples}

### 通常のCAST変換 {#normal-cast-conversion}

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

### TRY_CASTを使用した、失敗する可能性のある変換の処理 {#using-try_cast-to-handle-potentially-failed-conversions}

4.1.5以降、変換中に算術オーバーフローが発生した場合も、TRY_CASTのクエリ全体が失敗する代わりに、該当する行にNULLが返されます。内部実行エラーやサポートされていない型変換では、引き続き失敗する可能性があります。TRY_CASTはすべてのエラーを抑制するわけではありません。

変換が失敗する可能性がある場合、TRY_CASTを使用すると、代わりにNULLを返してクエリエラーを防げます。

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

## 動作 {#behavior}

CASTをtarget_data_typeによって分類します。

- [ARRAYへの変換](./array-conversion.md)
- [BOOLEANへの変換](./boolean-conversion.md)
- [DATEへの変換](./date-conversion.md)
- [TIMEへの変換](./time-conversion.md)
- [DATETIMEへの変換](./datetime-conversion.md)
- [TIMESTAMP_NSへの変換](./timestamp-ns-conversion.md)
- [TIMESTAMPTZへの変換](./timestamptz-conversion.md)
- [整数型（INTなど）への変換](./int-conversion.md)
- [浮動小数点型（FLOAT/DOUBLE）への変換](./float-double-conversion.md)
- [DECIMALへの変換](./decimal-conversion.md)
- [CHAR/VARCHAR/STRINGへの変換](./cast-to-string.md)
- [JSONへの変換／JSONから他の型への変換](./json-conversion.md)
- [MAPへの変換](./map-conversion.md)
- [STRUCTへの変換](./struct-conversion.md)
- [IPへの変換](./ip-conversion.md)

## 暗黙的なCAST {#implicit-cast}

一部の関数では暗黙的なCASTが行われることがあり、場合によっては予期しない動作につながります。
EXPLAIN文を使用すると、暗黙的なCASTが行われるかどうかを確認できます。

```sql
EXPLAIN SELECT length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

上の実行計画から、システムがCAST変換を自動的に行い、整数の123を文字列型に変換していることがわかります。これは暗黙的なCASTの例です。

算術オーバーフローとNULL入力：

```sql
SELECT TRY_CAST(CAST(1000 AS DECIMAL(9, 0)) AS DECIMAL(3, 0)) AS overflow_value,
       TRY_CAST(NULL AS INT) AS null_value;
```

```text
+----------------+------------+
| overflow_value | null_value |
+----------------+------------+
| NULL           | NULL       |
+----------------+------------+
```
