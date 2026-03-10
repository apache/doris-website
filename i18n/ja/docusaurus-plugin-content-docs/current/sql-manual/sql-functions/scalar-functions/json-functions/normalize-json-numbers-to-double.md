---
{
  "title": "NORMALIZE_JSON_NUMBERS_TO_DOUBLE",
  "language": "ja",
  "description": "NORMALIZEJSONNUMBERSTODOUBLE関数は、JSON内のすべての数値を倍精度浮動小数点型に変換します。"
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

`NORMALIZE_JSON_NUMBERS_TO_DOUBLE`関数は、JSON内のすべての数値を倍精度浮動小数点型に変換します。この関数はJSONの値を入力として受け取り、すべての数値型が倍精度の値に変換された新しいJSONの値を返します。

## 構文

```sql
NORMALIZE_JSON_NUMBERS_TO_DOUBLE(json_value)
```
## Alias

`NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`

## パラメータ

**json_value** - 処理対象のJSON値。JSON型である必要があります。

## 戻り値

すべての数値型がdouble精度浮動小数点（double）型に変換された新しいJSON値を返します。

入力がNULLの場合、この関数はNULLを返します。

## 目的

JSON標準ではNumber型の基盤となる型が規定されていないため、ほとんどのシステムはIEEE 754-2008 binary 64-bit（倍精度）浮動小数点数（C++のdouble型など）に基づいてNumber型を実装しています。
データの精度を確保するため、DorisはNumber型をより細分化された型で拡張し、Int128やDECIMALなどのより精密な型をサポートしています。
しかし、これにより他のシステムとの比較時に違いが生じる可能性があります。

例えば、以下のJSON文字列の場合：

```text
'{"abc": 18446744073709551616}'
```
JSON NumbersのベースとなるタイプとしてDoubleを使用するMySQL等のシステムでは、以下のようになります：

```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc": 1.8446744073709552e19}                |
+-----------------------------------------------+
```
しかし、DorisのJSON Numberはより高い精度の型を持つため、次のような結果を返します：

```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc":18446744073709551616}                  |
+-----------------------------------------------+
```
他のシステムとの互換性を保つために、`NORMALIZE_JSON_NUMBERS_TO_DOUBLE`を使用できます：

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
### ネストしたJSONの処理

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
### NULL値の処理

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

1. `NORMALIZE_JSON_NUMBERS_TO_DOUBLE`関数には`NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`というエイリアスがあり、両方の関数は同一の機能を持ちます。

2. この関数はJSON内のすべての数値型（整数、浮動小数点数、DECIMALを含む）を倍精度浮動小数点表現に変換します。

3. 特に大きな整数の場合、倍精度浮動小数点への変換により精度の損失が発生する可能性があります。例に示すように、1234567890123456789は1.2345678901234568e+18に変換されます。

4. この関数はJSONの構造を変更せず、その中の数値表現のみを変更します。
