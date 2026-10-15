---
{
    "title": "JSON_HASH",
    "language": "ja",
    "description": "JSONHASH は JSON オブジェクトのハッシュ値を計算します。この関数は JSON 型のパラメータを受け取り、BIGINT 型のハッシュ値を返します。"
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

`JSON_HASH` は JSON オブジェクトのハッシュ値を計算します。この関数は JSON 型のパラメータを受け取り、BIGINT 型のハッシュ値を返します。

JSON オブジェクトのハッシュ値を計算する際、この関数は計算前にキーをソートします。そのため、内容が同じでキーの順序だけが異なる JSON オブジェクトは同じハッシュ値になります。

## 構文

```sql
JSON_HASH(json_value)
```

## エイリアス

`JSONB_HASH`

## パラメータ

**json_value** - ハッシュ値を計算する対象の JSON 値。JSON 型である必要があります。

## 戻り値

BIGINT 型のハッシュ値を返します。

入力が NULL の場合、この関数は NULL を返します。

## 使用方法

JSON 規格では、JSON オブジェクト内のキーと値のペアに順序はありません。異なるシステム間でも内容が同じ JSON オブジェクトを一貫して識別できるように、`JSON_HASH` 関数はハッシュ値を計算する前にキーと値のペアをソートします。これは `SORT_JSON_OBJECT_KEYS` 関数を呼び出す場合と同様です。

また、Doris では JSON オブジェクト内に重複したキーを含めることができますが、ハッシュ計算では最初に出現したキーと値のペアだけを考慮します。これは実際のアプリケーションでの利用形態により適しています。

## 例

1. 基本的なハッシュ値の計算
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

2. エイリアス関数の確認
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
示されているように、`json_hash` と `jsonb_hash` は同じ入力に対して同じハッシュ値を生成し、等価なエイリアス関数であることが確認できます。

3. キーのソートの確認
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
`json_hash` 関数はハッシュ値を計算する前にキーをソートするため、キーの順序にかかわらず同じハッシュ値を生成します。

4. 重複したキーの処理
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
JSON オブジェクトに重複したキー（`{"a":123, "a":456}`）が含まれる場合、`json_hash` 関数はハッシュ計算で最初のキーと値のペアだけを考慮します。示されているように、重複したキーを持つ JSON オブジェクトのハッシュ値は、最初のキーと値のペア `{"a":123}` だけを含むオブジェクトのハッシュ値と一致します。

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
同じ数値 123 でも、JSON 内で異なる型（int と tinyint）として格納すると、ハッシュ値は異なります。これは、Doris の JSON 実装が型情報を保持し、ハッシュ計算でその型の違いを考慮するためです。

6. normalize_json_numbers_to_double を使用して型を統一する
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
この例では、上記の問題を解決する方法を示します。`normalize_json_numbers_to_double` 関数を使用して、まずすべての数値を倍精度浮動小数点型に変換してから、ハッシュ値を計算します。これにより、元の数値型にかかわらず一貫したハッシュ値が得られます。

7. NULL 値の処理
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

1. `JSON_HASH` 関数には `JSONB_HASH` というエイリアスがあり、両関数の機能は同じです。

2. この関数は、`SORT_JSON_OBJECT_KEYS` 関数を呼び出す場合と同様に、ハッシュ値を計算する前に JSON オブジェクトのキーをソートします。

3. JSON オブジェクト内に重複したキーがある場合、この関数はハッシュ計算で最初に出現したキーと値のペアだけを考慮します。

4. Doris の JSON は数値を異なる型（int、tinyint、bigint、float、double、decimal）で格納できるため、同じ数値でも型が異なればハッシュ値も異なる場合があります。一貫した値が必要な場合は、ハッシュ値を計算する前に `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 関数で数値を統一された型に変換できます。

5. JSON オブジェクトをテキストの解析によって作成する場合（`CAST` を使用して文字列を JSON に変換する場合など）、Doris は格納に適した数値型を自動的に選択するため、通常は数値型の不一致を気にする必要はありません。

6. `cast/to_json` を使用して「123」を手動で JSON オブジェクトに変換せず、代わりにテキスト変換（文字列から JSON オブジェクトを解析する方法）を使用する場合、Doris は「123」を tinyint 型の JSON オブジェクトとしてのみ格納します。そのため、「123」が int 型と tinyint 型の両方として格納されることはありません。
