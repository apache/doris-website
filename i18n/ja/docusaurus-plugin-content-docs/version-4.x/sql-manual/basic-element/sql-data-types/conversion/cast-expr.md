---
{
    "title": "CAST 式",
    "language": "ja",
    "description": "CAST は、あるデータ型の値を別のデータ型に変換します。"
}
---

## はじめに {#introduction}

CAST は、あるデータ型の値を別のデータ型に変換します。
TRY_CAST は安全な型変換メカニズムで、変換に失敗する可能性がある場合、エラーをスローする代わりに SQL NULL 値を返します。

## 構文 {#syntax}

```sql
CAST( <source_expr> AS <target_data_type> )
TRY_CAST( <source_expr> AS <target_data_type> )
```

## 引数 {#arguments}

- source_expr
  サポートされている任意のデータ型の式で、別のデータ型に変換される値です。
- target_data_type
  変換先のデータ型です。型が追加プロパティ（たとえば DECIMAL(p, s) の精度とスケール）をサポートしている場合は、必要に応じて指定します。

## 厳格モード {#strict-mode}

Doris 4.0 より前は、Doris の CAST の動作は MySQL などのデータベースシステムに従い、CAST 操作でエラーが発生しないようにしていました。たとえば、MySQL で次の SQL を実行すると:

```sql
select cast('abc' as signed);
```

結果は次のようになります:
```
0
```

Doris 4.0 以降は、PostgreSQL の方式に従う、より厳格なアプローチを採用しています。無効な変換に遭遇すると、混乱を招く可能性のある結果を生成するのではなく、Doris は直接エラーを報告します。

Doris 4.0 では新しい変数 `enable_strict_cast` が導入されました。次のコマンドで有効にできます:

```sql
set enable_strict_cast = true;
```

厳格モードでは、不正な CAST 操作は直接エラーになります:

```sql
mysql> select cast('abc' as int);
ERROR 1105 (HY000): errCode = 2, detailMessage = abc can't cast to INT in strict mode.
```

厳格モードの利点:
1. CAST 操作中にユーザーが予期しない値を取得するのを防ぎます
2. システムはすべてのデータが正常に型変換できると仮定できます（不正なデータは直接エラーになります）。これにより、計算時により適切な最適化が可能になります

## 例 {#examples}

### 通常の CAST 変換 {#normal-cast-conversion}

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

### 変換に失敗する可能性がある場合の TRY_CAST の使用 {#using-try_cast-to-handle-potentially-failed-conversions}

4.1.5 以降では、変換中に算術オーバーフローが発生した場合も、TRY_CAST クエリ全体を失敗させる代わりに、該当する行について NULL を返します。内部実行エラーやサポートされていない型変換では引き続き失敗する可能性があります。TRY_CAST はすべてのエラーを抑制するわけではありません。

変換に失敗する可能性がある場合は、TRY_CAST を使用すると、代わりに NULL を返してクエリエラーを防げます:

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

CAST を target_data_type に基づいて分類します:

- [ARRAY への変換](./array-conversion.md)
- [BOOLEAN への変換](./boolean-conversion.md)
- [DATE への変換](./date-conversion.md)
- [TIME への変換](./time-conversion.md)
- [DATETIME への変換](./datetime-conversion.md)
- [TIMESTAMPTZ への変換](./timestamptz-conversion.md)
- [整数（INT など）への変換](./int-conversion.md)
- [浮動小数点（FLOAT/DOUBLE）への変換](./float-double-conversion.md)
- [DECIMAL への変換](./decimal-conversion.md)
- [JSON への変換 / JSON から他の型への変換](./json-conversion.md)
- [MAP への変換](./map-conversion.md)
- [STRUCT への変換](./struct-conversion.md)
- [IP への変換](./ip-conversion.md)

## 暗黙的 CAST {#implicit-cast}

一部の関数は暗黙的な CAST を引き起こす可能性があり、特定のケースでは予期しない動作につながることがあります。
EXPLAIN 文を使用して暗黙的な CAST が発生しているか確認できます:

```sql
EXPLAIN SELECT length(123);
```

```text
...
length(CAST(123 AS varchar(65533)))
...
```

上記の実行計画から、システムが整数 123 を文字列型に自動的に変換していることがわかります。これは暗黙的 CAST の例です。

算術オーバーフローと NULL 入力:

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
