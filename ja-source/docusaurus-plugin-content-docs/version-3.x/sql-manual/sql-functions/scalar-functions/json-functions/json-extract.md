---
{
  "title": "JSON_EXTRACT",
  "description": "JSONEXTRACTは、JSONデータからjsonpathで指定されたフィールドを抽出し、異なるシリーズの関数を提供する一連の関数です",
  "language": "ja"
}
---
## 説明
JSON_EXTRACTは、JSONデータからjson_pathで指定されたフィールドを抽出する一連の関数であり、抽出するフィールドのタイプに応じて異なる一連の関数を提供します。

* JSON_EXTRACTは、VARCHAR型のjson文字列に対してVARCHAR型を返します。
* JSON_EXTRACT_NO_QUOTESは、VARCHAR型のjson文字列に対してVARCHAR型を返します。JSONフィールドの値が文字列の場合、ダブルクォートが削除されます。
* JSON_EXTRACT_ISNULLは、json nullであるかどうかを示すBOOLEAN型を返します。
* JSON_EXTRACT_BOOLは、BOOLEAN型を返します。
* JSON_EXTRACT_INTは、INT型を返します。
* JSON_EXTRACT_BIGINTは、BIGINT型を返します。
* JSON_EXTRACT_LARGEINTは、LARGEINT型を返します。
* JSON_EXTRACT_DOUBLEは、DOUBLE型を返します。
* JSON_EXTRACT_STRINGは、STRING型を返します。

:::tip
`JSON_EXTRACT_NO_QUOTES`関数はバージョン3.0.6以降でサポートされています。
:::

## エイリアス
* JSONB_EXTRACTは、JSON_EXTRACTと同じです。
* JSON_EXTRACT_NO_QUOTESは、JSON_EXTRACT_NO_QUOTESと同じです。
* JSONB_EXTRACT_ISNULLは、JSON_EXTRACT_ISNULLと同じです。
* JSONB_EXTRACT_BOOLは、JSON_EXTRACT_BOOLと同じです。
* JSONB_EXTRACT_INTは、JSON_EXTRACT_INTと同じです。
* JSONB_EXTRACT_BIGINTは、JSON_EXTRACT_BIGINTと同じです。
* JSONB_EXTRACT_LARGEINTは、JSON_EXTRACT_LARGEINTと同じです。
* JSONB_EXTRACT_DOUBLEは、JSON_EXTRACT_DOUBLEと同じです。
* JSONB_EXTRACT_STRINGは、JSON_EXTRACT_STRINGと同じです。

## 構文

```sql
JSON_EXTRACT (<json_str>, <path>[, path] ...)
```
```sql
JSON_EXTRACT_NO_QUOTES (<json_str>, <path>[, path] ...)
```
```sql
JSON_EXTRACT_ISNULL (<json_str>, <path>)
```
```sql
JSON_EXTRACT_BOOL (<json_str>, <path>)
```
```sql
JSON_EXTRACT_INT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_BIGINT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_LARGEINT (<json_str>, <path>)
```
```sql
JSON_EXTRACT_DOUBLE (<json_str>, <path>)
```
```sql
JSON_EXTRACT_STRING (<json_str>, <path>)
```
エイリアス関数は、関数名を除いて、上記の関数と同じ構文と使用法を持ちます。

## パラメータ
| パラメータ           | 説明                          |
|--------------|-----------------------------|
| `<json_str>` | 抽出対象のJSON型パラメータまたはフィールド。         |
| `<path>`     | 対象JSONから目標要素を抽出するためのJSONパス。 |
json pathの構文:
- '$' はjsonドキュメントのルート
- '.k1' はキー'k1'を持つjsonオブジェクトの要素
  - キーカラムの値に"."が含まれる場合、json_pathでダブルクォートが必要です。例: SELECT json_extract('{"k1.a":"abc","k2":300}', '$."k1.a"');
- '[i]' はインデックスiでのjson配列の要素
  - '$[last]'を使用してjson_arrayの最後の要素を取得し、'$[last-1]'で最後から2番目の要素を取得します。以下同様です。

## 戻り値
抽出対象フィールドの型に応じて、対象JSON内の指定されたJSON_PATHのデータ型を返します。特殊ケースの処理は以下の通りです:
* json_pathで指定されたフィールドがJSONに存在しない場合、NULLを返します。
* JSONでjson_pathで指定されたフィールドの実際の型がjson_extract_tで指定された型と一致しない場合。
* 指定された型に無損失で変換可能な場合、指定された型tを返します。そうでなければNULLを返します。



## 例

```sql
SELECT json_extract('{"id": 123, "name": "doris"}', '$.id');
```
```text
+------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.id') |
+------------------------------------------------------+
| 123                                                  |
+------------------------------------------------------+
```
```sql
SELECT json_extract('[1, 2, 3]', '$.[1]');
```
```text
+------------------------------------+
| json_extract('[1, 2, 3]', '$.[1]') |
+------------------------------------+
| 2                                  |
+------------------------------------+
```
```sql
SELECT json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]');
```
```text
+-------------------------------------------------------------------------------------------------------------------+
| json_extract('{"k1": "v1", "k2": { "k21": 6.6, "k22": [1, 2] } }', '$.k1', '$.k2.k21', '$.k2.k22', '$.k2.k22[1]') |
+-------------------------------------------------------------------------------------------------------------------+
| ["v1",6.6,[1,2],2]                                                                                                |
+-------------------------------------------------------------------------------------------------------------------+
```
```sql
SELECT json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name');
```
```text
+-----------------------------------------------------------------+
| json_extract('{"id": 123, "name": "doris"}', '$.aaa', '$.name') |
+-----------------------------------------------------------------+
| [null,"doris"]                                                  |
+-----------------------------------------------------------------+
```
```sql
SELECT json_extract_no_quotes('{"id": 123, "name": "doris"}', '$.name');
```
```text
+------------------------------------------------------------------+
| json_extract_no_quotes('{"id": 123, "name": "doris"}', '$.name') |
+------------------------------------------------------------------+
| doris                                                            |
+------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_ISNULL('{"id": 123, "name": "doris"}', '$.id');
```
```text
+----------------------------------------------------------------------------+
| jsonb_extract_isnull(cast('{"id": 123, "name": "doris"}' as JSON), '$.id') |
+----------------------------------------------------------------------------+
|                                                                          0 |
+----------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_BOOL('{"id": 123, "name": "NULL"}', '$.id');
```
```text
+-------------------------------------------------------------------------+
| jsonb_extract_bool(cast('{"id": 123, "name": "NULL"}' as JSON), '$.id') |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_INT('{"id": 123, "name": "NULL"}', '$.id');
```
```text
+------------------------------------------------------------------------+
| jsonb_extract_int(cast('{"id": 123, "name": "NULL"}' as JSON), '$.id') |
+------------------------------------------------------------------------+
|                                                                    123 |
+------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_INT('{"id": 123, "name": "doris"}', '$.name');
```
```text
+---------------------------------------------------------------------------+
| jsonb_extract_int(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+---------------------------------------------------------------------------+
|                                                                      NULL |
+---------------------------------------------------------------------------+
```
```sql
SELECT JSON_EXTRACT_STRING('{"id": 123, "name": "doris"}', '$.name');
```
```text
+------------------------------------------------------------------------------+
| jsonb_extract_string(cast('{"id": 123, "name": "doris"}' as JSON), '$.name') |
+------------------------------------------------------------------------------+
| doris                                                                        |
+------------------------------------------------------------------------------+
```
