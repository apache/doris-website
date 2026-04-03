---
{
  "title": "JSON_HASH",
  "language": "ja",
  "description": "JSONHASHはJSONオブジェクトのハッシュ値を計算します。この関数はJSON型パラメータを受け取り、BIGINTハッシュ値を返します。"
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

`JSON_HASH`はJSONオブジェクトのハッシュ値を計算します。この関数はJSON型のパラメータを受け取り、BIGINTハッシュ値を返します。

JSONオブジェクトのハッシュ値を計算する際、関数は計算前にJSONオブジェクトのキーをソートし、内容が同一でキーの順序が異なるJSONオブジェクトが同じハッシュ値を生成することを保証します。

## 構文

```sql
JSON_HASH(json_value)
```
## エイリアス

`JSONB_HASH`

## パラメータ

**json_value** - ハッシュ値を計算するJSON値。JSON型である必要があります。

## 戻り値

BIGINT型のハッシュ値を返します。

入力がNULLの場合、関数はNULLを返します。

## 使用法

JSON標準ではJSONオブジェクトのキー値ペアは順序付けられていないと規定されているため、異なるシステム間で同じ内容のJSONオブジェクトを一貫して識別できるよう、`JSON_HASH`関数は`SORT_JSON_OBJECT_KEYS`関数を呼び出すのと同様に、ハッシュ値を計算する前にキー値ペアをソートします。

また、JSONオブジェクトの重複キーについて、Dorisでは存在を許可していますが、ハッシュ計算では最初に出現するキー値ペアのみを考慮し、これにより実際のアプリケーションシナリオにより適合します。

## 例

1. 基本的なハッシュ計算

```sql
SELECT json_hash(cast('123' as json));
```
```text
+--------------------------------+
| json_hash(cast('123' as json)) |
+--------------------------------+
|            5279066513252500087 |
+--------------------------------+
```
2. エイリアス機能の確認

```sql
SELECT json_hash(cast('123' as json)), jsonb_hash(cast('123' as json));
```
```text
+--------------------------------+---------------------------------+
| json_hash(cast('123' as json)) | jsonb_hash(cast('123' as json)) |
+--------------------------------+---------------------------------+
|            5279066513252500087 |             5279066513252500087 |
+--------------------------------+---------------------------------+
```
示されているように、`json_hash`と`jsonb_hash`関数は同じ入力に対して同一のハッシュ値を生成し、これらが等価なエイリアス関数であることを確認しています。

3. キーソート検証

```sql
SELECT 
    json_hash(cast('{"a":123, "b":456}' as json)), 
    json_hash(cast('{"b":456, "a":123}' as json));
```
```text
+-----------------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123, "b":456}' as json)) | json_hash(cast('{"b":456, "a":123}' as json)) |
+-----------------------------------------------+-----------------------------------------------+
|                             82454694884268544 |                             82454694884268544 |
+-----------------------------------------------+-----------------------------------------------+
```
`json_hash`関数は、ハッシュ値を計算する前にキーをソートするため、キーの順序に関係なく同じハッシュ値を生成します。

4. 重複キーの処理

```sql
SELECT 
    json_hash(cast('{"a":123}' as json)), 
    json_hash(cast('{"a":456}' as json)), 
    json_hash(cast('{"a":123, "a":456}' as json));
```
```text
+--------------------------------------+--------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123}' as json)) | json_hash(cast('{"a":456}' as json)) | json_hash(cast('{"a":123, "a":456}' as json)) |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
|                 -7416836614234106918 |                 -3126362109586887012 |                          -7416836614234106918 |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
```
JSON オブジェクトに重複したキー（`{"a":123, "a":456}`）が含まれている場合、`json_hash` 関数はハッシュ計算において最初のキーと値のペアのみを考慮します。示されているように、重複したキーを持つ JSON オブジェクトのハッシュ値は、最初のキーと値のペア `{"a":123}` のみを含むオブジェクトのハッシュ値と一致します。

5. 異なる数値型の処理

```sql
SELECT 
    json_hash(to_json(cast('123' as int))), 
    json_hash(to_json(cast('123' as tinyint)));
```
```text
+----------------------------------------+--------------------------------------------+
| json_hash(to_json(cast('123' as int))) | json_hash(to_json(cast('123' as tinyint))) |
+----------------------------------------+--------------------------------------------+
|                    7882559133986259892 |                        5279066513252500087 |
+----------------------------------------+--------------------------------------------+
```
同じ数値123でも、JSONで異なる型（intとtinyint）で格納すると、異なるハッシュ値が生成されます。これは、DorisのJSON実装が型情報を保持しており、ハッシュ計算でこれらの型の違いが考慮されるためです。

6. 統一された型のためのnormalize_json_numbers_to_doubleの使用

```sql
SELECT 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))), 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint))));
```
```text
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
| json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))) | json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint)))) |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
|                                                      4028523408277343359 |                                                          4028523408277343359 |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
```
この例では、上記の問題を解決する方法を示しています。`normalize_json_numbers_to_double`関数を使用して、まずすべての数値を倍精度浮動小数点型に変換してからハッシュ値を計算します。これにより、元の数値型に関係なく一貫したハッシュ値が保証されます。

7. NULL値の処理

```sql
SELECT json_hash(null);
```
```text
+-----------------+
| json_hash(null) |
+-----------------+
|            NULL |
+-----------------+
```
## 注意事項

1. `JSON_HASH`関数には`JSONB_HASH`というエイリアスがあり、両方の関数は同一の機能を持ちます。

2. この関数は、`SORT_JSON_OBJECT_KEYS`関数を呼び出すのと同様に、ハッシュ値を計算する前にJSONオブジェクトのキーをソートします。

3. JSONオブジェクト内の重複キーについては、この関数はハッシュ計算において最初に出現するキーと値のペアのみを考慮します。

4. DorisのJSONは異なる型（int、tinyint、bigint、float、double、decimal）で数値を格納できるため、同じ数値でも型が異なると異なるハッシュ値が生成される可能性があります。一貫性が必要な場合は、ハッシュ値を計算する前に`NORMALIZE_JSON_NUMBERS_TO_DOUBLE`関数を使用してすべての数値を統一の型に変換できます。

5. JSONオブジェクトがテキスト解析によって作成される場合（文字列をJSONに変換するために`CAST`を使用するなど）、Dorisは格納に適した数値型を自動的に選択するため、通常は数値型の不整合の問題を心配する必要はありません。

6. `cast/to_json`を使用して手動で"123"をJSONオブジェクトに変換するのではなく、テキスト変換（文字列からJSONオブジェクトを解析）を使用する場合、Dorisは"123"をtinyint型のJSONオブジェクトとしてのみ格納し、"123"がint型とtinyint型の両方で格納されるという状況は発生しないことに注意してください。
