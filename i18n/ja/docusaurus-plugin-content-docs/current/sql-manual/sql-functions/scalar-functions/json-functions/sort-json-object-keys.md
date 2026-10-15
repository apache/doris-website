---
{
    "title": "SORT_JSON_OBJECT_KEYS",
    "language": "ja",
    "description": "JSON オブジェクトのキーを辞書順に並べ替えます。"
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

`SORT_JSON_OBJECT_KEYS` は JSON オブジェクトのキーを並べ替えます。JSON オブジェクトを受け取り、キーを辞書順に並べた新しい JSON オブジェクトを返します。

JSON 標準では、JSON オブジェクトは順序のない集合です。ただし、両方の JSON オブジェクトの内容を比較する場合など、キーの順序を一定に保ちたいときにこの関数が役立ちます。

## 構文

```sql
SORT_JSON_OBJECT_KEYS(json_value)
```

## 別名

SORT_JSONB_OBJECT_KEYS

## パラメータ

**json_value**: キーを並べ替える JSON 値です。JSON 型である必要があります。

## 戻り値

キーを辞書順に並べた新しい JSON オブジェクトを返します。戻り値の型は入力の JSON 型と同じです。

入力が NULL の場合は NULL を返します。

## 例

### 基本的なキーの並べ替え

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

### ネストした JSON 配列の処理

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

### NULL 値の処理

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

1. `SORT_JSON_OBJECT_KEYS` には別名 `SORT_JSONB_OBJECT_KEYS` があり、両者の機能は同じです。

2. オブジェクトのキーだけを並べ替え、対応する値は変更しません。

3. 配列は JSON 標準で順序のある集合と定義されているため、この関数は配列を並べ替えず、オブジェクトだけを並べ替えます。

4. JSON オブジェクトの重複するキーは Doris JSON 型への変換時に統合され、最初のキーと値の組だけが残ります。

5. Doris の JSON 型は既定ではキーの順序を保証しません。この関数は比較やデバッグのためにキーを一定の順序で表示するときに役立ちます。
