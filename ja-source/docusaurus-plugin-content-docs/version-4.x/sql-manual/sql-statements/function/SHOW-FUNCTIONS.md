---
{
  "title": "SHOW FUNCTIONS",
  "description": "データベース下のすべてのカスタム関数およびシステム提供関数を表示します。",
  "language": "ja"
}
---
## デスクリプション

データベース配下のすべてのカスタム関数およびシステム提供関数を表示します。

## Syntax

```sql
SHOW [ FULL ] [ BUILTIN ] FUNCTIONS [ { IN | FROM } <db> ]  [ LIKE '<function_pattern>' ]
```
## Varaint構文

```sql
SHOW GLOBAL [ FULL ] FUNCTIONS [ LIKE '<function_pattern>' ]
```
## 必須パラメータ

**1. `<function_pattern>`**

> 関数名をフィルタリングするために使用されるマッチングパターンルール

## オプションパラメータ

**1. `FULL`**

> FULLはオプションパラメータです。
>
> このパラメータは関数の詳細情報を示します。

**2. `BUILTIN`**

> BUILTINはオプションパラメータです。
>
> このパラメータはシステムによって提供される関数を表示する必要があることを示します

**3. `<db>`**

> dbはオプションパラメータです。
>
> このパラメータは指定されたデータベース配下でのクエリを示します

## 戻り値

| Column | デスクリプション         |
| -- |------------|
| Signature | 関数名とパラメータ型   |
| Return タイプ | 関数によって返される値のデータ型 |
| ファンクション タイプ | 関数の型      |
| Intermediate タイプ | 中間結果の型     |
| Properties | 関数の詳細プロパティ    |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege  | Object   | 注釈       |
|:--------------|:---------|:--------------|
| SHOW_PRIV    | ファンクション | この関数に対するshow権限を持つ必要があります |

## 例

```sql
show full functions in testDb
```
```text
*************************** 1. row ***************************
Signature: my_add(INT,INT)
Return タイプ: INT
ファンクション タイプ: Scalar
Intermediate タイプ: NULL
Properties: {"symbol":"_ZN9doris_udf6AddUdfEPNS_15FunctionContextERKNS_6IntValES4_","object_file":"http://host:port/libudfsample.so","md5":"cfe7a362d10f3aaf6c49974ee0f1f878"}
*************************** 2. row ***************************
Signature: my_count(BIGINT)
Return タイプ: BIGINT
ファンクション タイプ: Aggregate
Intermediate タイプ: NULL
Properties: {"object_file":"http://host:port/libudasample.so","finalize_fn":"_ZN9doris_udf13CountFinalizeEPNS_15FunctionContextERKNS_9BigIntValE","init_fn":"_ZN9doris_udf9CountInitEPNS_15FunctionContextEPNS_9BigIntValE","merge_fn":"_ZN9doris_udf10CountMergeEPNS_15FunctionContextERKNS_9BigIntValEPS2_","md5":"37d185f80f95569e2676da3d5b5b9d2f","update_fn":"_ZN9doris_udf11CountUpdateEPNS_15FunctionContextERKNS_6IntValEPNS_9BigIntValE"}
*************************** 3. row ***************************
Signature: id_masking(BIGINT)
Return タイプ: VARCHAR
ファンクション タイプ: Alias
Intermediate タイプ: NULL
Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```
```sql
show builtin functions in testDb like 'year%';
```
```text
+---------------+
| ファンクション Name |
+---------------+
| year          |
| years_add     |
| years_diff    |
| years_sub     |
+---------------+
```
```sql
show global full functions
```
```text
*************************** 1. row ***************************
        Signature: decimal(ALL, INT, INT)
      Return タイプ: VARCHAR
    ファンクション タイプ: Alias
Intermediate タイプ: NULL
       Properties: {"parameter":"col, precision, scale","origin_function":"CAST(`col` AS decimal(`precision`, `scale`))"}
*************************** 2. row ***************************
        Signature: id_masking(BIGINT)
      Return タイプ: VARCHAR
    ファンクション タイプ: Alias
Intermediate タイプ: NULL
       Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```
```sql
show global functions
```
```text
+---------------+
| ファンクション Name |
+---------------+
| decimal       |
| id_masking    |
+---------------+
```
