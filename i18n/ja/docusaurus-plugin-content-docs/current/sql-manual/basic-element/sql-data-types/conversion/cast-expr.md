---
{
    "title": "CAST 式",
    "language": "ja",
    "description": "CAST は、あるデータ型の値を別のデータ型に変換します。"
}
---

## 概要

CAST は、あるデータ型の値を別のデータ型に変換します。
TRY_CAST は、変換に失敗する可能性がある場合にエラーを発生させる代わりに SQL の NULL 値を返す、安全な型変換の仕組みです。

## 構文

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```

## 引数

- source_expr  
  別のデータ型に変換する、サポート対象の任意のデータ型の式。
- target_data_type  
  変換先のデータ型。型に追加の属性がある場合（たとえば DECIMAL(p, s) の精度とスケール）、必要に応じて指定します。

## 厳格モード

Doris 4.0 より前の CAST の動作は MySQL などのデータベースシステムに倣い、CAST 操作でエラーが発生しないようにしていました。たとえば、MySQL で次の SQL を実行すると、

```sql
select cast('abc' as signed);
```

結果は次のようになります。
```
0
```

Doris 4.0 からは PostgreSQL の方式に倣い、より厳格な動作を採用しています。無効な変換が行われた場合、混乱を招く可能性のある結果を生成する代わりに、Doris は直接エラーを報告します。

Doris 4.0 では、新しい変数 `enable_strict_cast` が導入されました。次のようにして有効にできます。

```sql
set enable_strict_cast = true;
```

厳格モードでは、不正な CAST 操作を行うと直接エラーになります。

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```

厳格モードには次の利点があります。
1. CAST 操作で予期しない値が返されるのを防げます。
2. すべてのデータを正常に型変換できるとシステムが想定できます（不正なデータは直接エラーになるため）。これにより、計算時の最適化を改善できます。

## 例

### 通常の CAST 変換

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

### 失敗する可能性がある変換での TRY_CAST の使用

変換に失敗する可能性がある場合、TRY_CAST を使うと、代わりに NULL を返してクエリのエラーを防げます。

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

CAST を変換先の target_data_type によって分類すると、次のとおりです。

- [ARRAY への CAST](./array-conversion.md)
- [BOOLEAN への CAST](./boolean-conversion.md)
- [DATE への CAST](./date-conversion.md)
- [TIME への CAST](./time-conversion.md)
- [DATETIME への CAST](./datetime-conversion.md)
- [TIMESTAMP_NS への CAST](./timestamp-ns-conversion.md)
- [TIMESTAMPTZ への CAST](./timestamptz-conversion.md)
- [整数型（INT など）への CAST](./int-conversion.md)
- [浮動小数点型（FLOAT/DOUBLE）への CAST](./float-double-conversion.md)
- [DECIMAL への CAST](./decimal-conversion.md)
- [CHAR/VARCHAR/STRING への CAST](./cast-to-string.md)
- [JSON への CAST / JSON から他の型への変換](./json-conversion.md)
- [MAP への CAST](./map-conversion.md)
- [STRUCT への CAST](./struct-conversion.md)
- [IP への CAST](./ip-conversion.md)

## 暗黙的な CAST

一部の関数は暗黙的な CAST を引き起こすことがあり、場合によっては予期しない動作につながります。
暗黙的な CAST が行われるかどうかは、EXPLAIN 文で確認できます。

```sql
EXPLAIN SELECT length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

上の実行計画から、システムが整数 123 を文字列型に変換する CAST を自動的に実行していることがわかります。これは暗黙的な CAST の例です。
