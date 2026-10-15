---
{
    "title": "JSON_HASH",
    "language": "ja",
    "description": "JSON オブジェクトのハッシュ値を計算します。JSON 型の引数を受け取り、BIGINT 型のハッシュ値を返します。"
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

`JSON_HASH` は JSON オブジェクトのハッシュ値を計算します。JSON 型の引数を受け取り、BIGINT 型のハッシュ値を返します。

計算前に JSON オブジェクトのキーをソートするため、内容が同じでキーの順序だけが異なるオブジェクトは同じハッシュ値になります。

## 構文

```sql
JSON_HASH(json_value)
```

## 別名

`JSONB_HASH`

## パラメータ

| パラメータ | 説明 |
| --- | --- |

| **json_value** | ハッシュ値を計算する JSON 型の値。 |

## 戻り値

BIGINT 型のハッシュ値を返します。

入力が NULL の場合は NULL を返します。

## 使用方法

JSON 規格ではオブジェクトのキーと値の組に順序がありません。`JSON_HASH` は、異なるシステムでも同じ内容のオブジェクトを同じように扱えるよう、`SORT_JSON_OBJECT_KEYS` と同様にキーをソートしてからハッシュ値を計算します。

Doris は JSON オブジェクト内の重複キーを許可しますが、ハッシュ値の計算では最初に現れたキーと値の組だけを使用します。

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

2. 別名の確認
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
同じ入力に対して `json_hash` と `jsonb_hash` は同じハッシュ値を返します。両者が等価な別名であることを確認できます。

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
`json_hash` は計算前にキーをソートするため、キーの順序が異なっても同じハッシュ値を返します。

4. 重複キーの扱い
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
JSON オブジェクトに重複キー（`{"a":123, "a":456}`）がある場合、`json_hash` は最初のキーと値の組だけを計算に使用します。そのため、結果は最初の組だけを含む `{"a":123}` のハッシュ値と一致します。

5. 数値型の違い
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
同じ数値 123 でも、JSON 内で異なる型（int と tinyint）として保存すると、ハッシュ値は異なります。Doris の JSON は型情報を保持し、ハッシュ計算でも型の違いを考慮するためです。

6. normalize_json_numbers_to_double で型を統一する
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
型による差をなくすには、`normalize_json_numbers_to_double` で数値を倍精度浮動小数点型に変換してからハッシュ値を計算します。これにより、元の数値型が違っても同じハッシュ値になります。

7. NULL 値の扱い
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

1. `JSON_HASH` の別名は `JSONB_HASH` です。機能は同じです。

2. この関数は、`SORT_JSON_OBJECT_KEYS` と同様にキーをソートしてからハッシュ値を計算します。

3. キーが重複する場合は、最初に現れたキーと値の組だけを計算に使用します。

4. Doris の JSON は数値を異なる型（int、tinyint、bigint、float、double、decimal）で保存できます。同じ数値でも型が異なればハッシュ値が変わる場合があります。値を統一したい場合は、計算前に `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` で数値型を統一してください。

5. 文字列を `CAST` で JSON に変換するなど、テキストを解析してオブジェクトを作る場合、Doris が適切な数値型を自動選択します。通常は数値型の不一致を気にする必要はありません。

6. `cast/to_json` で "123" を手動変換せず、文字列から JSON を解析する場合、Doris は "123" を tinyint 型の JSON 値として保存します。この方法では "123" が int 型と tinyint 型の両方で保存されることはありません。
