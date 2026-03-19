---
{
  "title": "SORT_JSON_OBJECT_KEYS",
  "language": "ja",
  "description": "SORTJSONOBJECTKEYSはJSONオブジェクトのキーをソートします。この関数はJSONオブジェクトを入力として受け取り、キーがソートされた新しいJSONオブジェクトを返します"
}
---
<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 説明

`SORT_JSON_OBJECT_KEYS`はJSONオブジェクトのキーをソートします。この関数はJSONオブジェクトを入力として受け取り、辞書順でソートされたキーを持つ新しいJSONオブジェクトを返します。

JSON標準によると、JSONオブジェクトは順序のないコレクションであることに注意してください。ただし、この関数は、例えば2つのJSONオブジェクトが同一の内容であるかを比較する場合など、キーの順序の一貫性を確保する必要がある場合に有用です。

## 構文

```sql
SORT_JSON_OBJECT_KEYS(json_value)
```
## エイリアス

SORT_JSONB_OBJECT_KEYS

## パラメータ

**json_value** - キーをソートする必要があるJSON値。JSON型である必要があります。

## 戻り値

キーが辞書順でソートされた新しいJSONオブジェクトを返します。戻り値の型は入力のJSON型と一致します。

入力がNULLの場合、関数はNULLを返します。

## 例

### 基本的なキーソート

```sql
SELECT sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json));
```
```text
+------------------------------------------------------------------+
| sort_json_object_keys(cast('{"b":123,"b":456,"a":789}' as json)) |
+------------------------------------------------------------------+
| {"a":789,"b":123}                                                |
+------------------------------------------------------------------+
```
### ネストされたJSON配列の処理

```sql
SELECT sort_json_object_keys(cast('[{"b":123,"b":456,"a":789},{"b":123},{"b":456},{"a":789}]' as json));
```
```text
+----------------------------------------------------------------------------------------------------+
| sort_json_object_keys(cast('[{"b":123,"b":456,"a":789} ,{"b":123},{"b":456},{"a":789} ]' as json)) |
+----------------------------------------------------------------------------------------------------+
| [{"a":789,"b":123},{"b":123},{"b":456},{"a":789}]                                                  |
+----------------------------------------------------------------------------------------------------+
```
### NULL値の処理

```sql
SELECT sort_json_object_keys(null);
```
```text
+-----------------------------+
| sort_json_object_keys(null) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```
## 注意事項

1. `SORT_JSON_OBJECT_KEYS`関数には別名`SORT_JSONB_OBJECT_KEYS`があり、両方の関数は同一の機能を持ちます。

2. この関数はオブジェクトのキーのみをソートし、関連する値は変更しません。

3. この関数はオブジェクトのみをソートし、配列はソートしません。これは標準で配列が順序付きコレクションであると規定されているためです。

4. JSONオブジェクト内の重複するキーは、Doris JSON型に変換される際にマージされ、最初のキーと値のペアのみが保持されます。

5. この関数は主に、比較やデバッグの目的でJSONオブジェクトのキーが一貫した順序で表示されることを保証するために使用されます。デフォルトではDoris JSON型はキーの順序を保証しないためです。
