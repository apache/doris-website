---
{
  "title": "TO_JSON",
  "language": "ja",
  "description": "DorisのInternal データタイプをJSONBタイプに変換します。この関数により、互換性のあるDorisデータタイプを JSON表現に変換することができます"
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

Dorisの内部データ型をJSONB型に変換します。この関数を使用することで、互換性のあるDorisデータ型を精度を失うことなくJSON表現に変換できます。

## 構文

```sql
TO_JSON(value)
```
## パラメータ

**value** - JSONB型に変換される値。

以下の型はJSONB型への直接マッピングを持ち、直接変換できます：
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- ブール型：BOOLEAN
- 文字列型：STRING、VARCHAR、CHAR
- 複合型：ARRAY、STRUCT

さらに、この関数は以下の型の変換をサポートします：
- 日付型：DATETIME、DATE、TIME
- IP型：IPV4、IPV6
- 複合型：MAP

対応するJSONB型を持たないDATETIME、DATE、TIME、IPV4、IPV6型については、STRING型に変換されます。
MAP型については、JSONB Object型に変換されます。JSON標準ではObjectキーは文字列である必要があるため、Mapキーは必ずSTRING型である必要があります。

## 戻り値

JSONB型の値を返します。

入力の`value`がSQL NULLの場合、関数はSQL NULLを返します（JSON null値ではありません）。配列や構造体内にNULL値が現れた場合、それらはJSON null値に変換されます。

## 例

### 基本的なスカラー値

```sql
SELECT to_json(1), to_json(3.14), to_json("12345");
```
```text
+------------+---------------+------------------+
| to_json(1) | to_json(3.14) | to_json("12345") |
+------------+---------------+------------------+
| 1          | 3.14          | "12345"          |
+------------+---------------+------------------+
```
### Date型

```sql
SELECT 
     to_json(cast('2020-01-01' as date)) , 
     to_json(cast('2020-01-01 12:00:00' as datetime)),
     to_json(cast('2020-01-01 12:00:00.123' as datetime(3))),
     to_json(cast('2020-01-01 12:00:00.123456' as datetime(6))),
     to_json(cast('8:23:45' as time));
```
```text
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
| to_json(cast('2020-01-01' as date)) | to_json(cast('2020-01-01 12:00:00' as datetime)) | to_json(cast('2020-01-01 12:00:00.123' as datetime(3))) | to_json(cast('2020-01-01 12:00:00.123456' as datetime(6))) | to_json(cast('8:23:45' as time)) |
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
| "2020-01-01"                        | "2020-01-01 12:00:00"                            | "2020-01-01 12:00:00.123"                               | "2020-01-01 12:00:00.123456"                               | "08:23:45"                       |
+-------------------------------------+--------------------------------------------------+---------------------------------------------------------+------------------------------------------------------------+----------------------------------+
```
### IP タイプ

```sql
SELECT 
     to_json(cast('192.168.0.1' as ipv4)) , 
     to_json(cast('2001:0db8:85a3:0000:0000:8a2e:0370:7334' as ipv6));
```
```text
+--------------------------------------+------------------------------------------------------------------+
| to_json(cast('192.168.0.1' as ipv4)) | to_json(cast('2001:0db8:85a3:0000:0000:8a2e:0370:7334' as ipv6)) |
+--------------------------------------+------------------------------------------------------------------+
| "192.168.0.1"                        | "2001:db8:85a3::8a2e:370:7334"                                   |
+--------------------------------------+------------------------------------------------------------------+
```
### 配列変換

```sql
SELECT to_json(array(array(1,2,3),array(4,5,6)));
```
```text
+-------------------------------------------+
| to_json(array(array(1,2,3),array(4,5,6))) |
+-------------------------------------------+
| [[1,2,3],[4,5,6]]                         |
+-------------------------------------------+
```
```sql
SELECT to_json(array(12,34,null));
```
```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```
### 結果のJSONで配列要素にアクセスする

```sql
SELECT json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]');
```
```text
+----------------------------------------------------------------------+
| json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]') |
+----------------------------------------------------------------------+
| 6                                                                    |
+----------------------------------------------------------------------+
```
### 構造体変換

```sql
SELECT to_json(struct(123,array(4,5,6),"789"));
```
```text
+------------------------------------------+
| to_json(struct(123,array(4,5,6),"789"))  |
+------------------------------------------+
| {"col1":123,"col2":[4,5,6],"col3":"789"} |
+------------------------------------------+
```
### 結果のJSONでオブジェクトプロパティにアクセスする

```sql
SELECT json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2");
```
```text
+----------------------------------------------------------------+
| json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2") |
+----------------------------------------------------------------+
| [4,5,6]                                                        |
+----------------------------------------------------------------+
```
### MAP変換

```sql
SELECT to_json(map("1",2,"abc",3));  
```
```text
+-----------------------------+
| to_json(map("1",2,"abc",3)) |
+-----------------------------+
| {"1":2,"abc":3}             |
+-----------------------------+
```
```sql
SELECT to_json(map(1,2));  
```
```text
to_json only support map with string-like key type
```
### NULL値の処理

```sql
-- SQL NULL as input returns SQL NULL
SELECT to_json(null);
```
```text
+---------------+
| to_json(null) |
+---------------+
| NULL          |
+---------------+
```
```sql
-- NULL values within arrays become JSON null values
SELECT to_json(array(12,34,null));
```
```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```
### サポートされていないDorisタイプ

```sql
SELECT to_json(makedate(2025,5));
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(DATE)
```
```sql
-- Convert to string first and then apply to_json
SELECT to_json(cast(makedate(2025,5) as string));
```
```text
+-------------------------------------------+
| to_json(cast(makedate(2025,5) as string)) |
+-------------------------------------------+
| "2025-01-05"                              |
+-------------------------------------------+
```
## 注意事項

1. 一部の型には直接的なJSONマッピングがありません（DATEなど）。これらの型については、まずSTRINGに変換してから`TO_JSON`を使用する必要があります。

2. `TO_JSON`を使用してDoris内部型をJSONBに変換する際、テキスト表現を通じた変換とは異なり、精度の損失はありません。

3. DorisのJSONBオブジェクトは、デフォルトで1,048,576バイト（1 MB）のサイズ制限があり、BE設定`string_type_length_soft_limit_bytes`を通じて最大2,147,483,643バイト（約2 GB）まで調整可能です。

4. DorisのJSONオブジェクトでは、キーの長さが255バイトを超えることはできません。
