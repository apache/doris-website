---
{
    "title": "NORMALIZE_JSON_NUMBERS_TO_DOUBLE",
    "language": "ja",
    "description": "JSON 内のすべての数値を倍精度浮動小数点数に変換します。"
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

`NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 関数は、JSON 内のすべての数値を倍精度浮動小数点数に変換します。JSON 値を入力として受け取り、すべての数値を double 型に変換した新しい JSON 値を返します。

## 構文

```sql
NORMALIZE_JSON_NUMBERS_TO_DOUBLE(json_value)
```

## 別名

`NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`

## パラメータ

**json_value**: 処理する JSON 値です。JSON 型である必要があります。

## 戻り値

すべての数値を倍精度浮動小数点数 (double) に変換した新しい JSON 値を返します。

入力が NULL の場合は NULL を返します。

## 用途

JSON 標準では Number の内部型が定義されていないため、ほとんどのシステムは IEEE 754-2008 の 64 ビット倍精度浮動小数点数 (C++ の double 型など) として Number を実装します。
Doris はデータの精度を保つため、Number 型を拡張し、Int128 や DECIMAL などのより高精度な型をサポートしています。
このため、他のシステムと結果が異なる場合があります。

たとえば、次の JSON 文字列について考えます。
```text
'{"abc": 18446744073709551616}'
```

MySQL のように JSON の数値に Double を使用するシステムでは、次の結果になります。
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc": 1.8446744073709552e19}                |
+-----------------------------------------------+
```

一方、Doris の JSON Number はより高精度な型を使用するため、次の結果になります。
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc":18446744073709551616}                  |
+-----------------------------------------------+
```

他のシステムとの互換性を確保するには、`NORMALIZE_JSON_NUMBERS_TO_DOUBLE` を使用します。
```text
+---------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"abc": 18446744073709551616}' as json)) |
+---------------------------------------------------------------------------------+
| {"abc":1.8446744073709552e+19}                                                  |
+---------------------------------------------------------------------------------+
```

## 例

### 基本的な数値変換

```sql
SELECT normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json));
```

```text
+---------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json)) |
+---------------------------------------------------------------------------------------------+
| {"b":1.2345678901234568e+18,"b":456,"a":789}                                                |
+---------------------------------------------------------------------------------------------+
```

### ネストした JSON の処理

```sql
SELECT normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json));
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json)) |
+-----------------------------------------------------------------------------------------------------------------------------+
| {"object":{"int":123,"bigint":1.2345678901234568e+18},"array":[123,456,789]}                                                |
+-----------------------------------------------------------------------------------------------------------------------------+
```

### NULL 値の処理

```sql
SELECT normalize_json_numbers_to_double(null);
```

```text
+----------------------------------------+
| normalize_json_numbers_to_double(null) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```

## 注意事項

1. `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` には別名 `NORMALIZE_JSONB_NUMBERS_TO_DOUBLE` があり、両者の機能は同じです。

2. JSON 内のすべての数値型 (整数、浮動小数点数、DECIMAL を含む) を倍精度浮動小数点数に変換します。

3. 非常に大きな整数は、倍精度浮動小数点数への変換時に精度が失われる場合があります。例では 1234567890123456789 が 1.2345678901234568e+18 に変換されます。

4. JSON の構造は変更せず、内部の数値の表現だけを変更します。
