---
{
    "title": "TO_JSON",
    "language": "ja",
    "description": "Doris の内部データ型を JSONB 型に変換します。対応する型を精度を失わずに JSON として表現できます。"
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

Doris の内部データ型を JSONB 型に変換します。対応する Doris のデータ型を、精度を失わずに JSON として表現できます。

## 構文

```sql
TO_JSON(value)
```

## パラメータ

**value**: JSONB 型に変換する値です。

次の型は JSONB 型に直接対応し、変換できます。
- 数値型: TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 真偽値型: BOOLEAN
- 文字列型: STRING、VARCHAR、CHAR
- 複合型: ARRAY、STRUCT

さらに、次の型も変換できます。
- 日時型: DATETIME、TIMESTAMP_NS、DATE、TIME
- IP 型: IPV4、IPV6
- 複合型: MAP

DATETIME、TIMESTAMP_NS、DATE、TIME、IPV4、IPV6 には対応する JSONB のネイティブ型がないため、JSONB の文字列に変換されます。
MAP 型は JSONB Object 型に変換されます。JSON 標準ではオブジェクトのキーが文字列である必要があるため、MAP のキーは STRING 型でなければなりません。

## 戻り値

JSONB 型の値を返します。

入力の `value` が SQL NULL の場合は、JSON の null ではなく SQL NULL を返します。配列や構造体の中の NULL は JSON の null に変換されます。

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

### 日時型

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

### IP 型

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

### 配列の変換

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

### 変換後の JSON 配列の要素にアクセスする

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

### 構造体の変換

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

### 変換後の JSON オブジェクトのプロパティにアクセスする

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

### MAP の変換

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

### NULL 値の処理

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

### サポートされない Doris の型

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

1. 一部の型 (DATE など) には JSON への直接の対応がありません。その場合はまず STRING に変換してから `TO_JSON` を使用します。

2. Doris の内部型を `TO_JSON` で JSONB に変換する場合、テキスト表現を経由する場合と異なり、精度は失われません。

3. Doris の JSONB オブジェクトのサイズ上限は既定で 1,048,576 バイト (1 MB) です。BE 設定 `string_type_length_soft_limit_bytes` により、最大 2,147,483,643 バイト (約 2 GB) まで調整できます。

4. Doris の JSON オブジェクトでは、キーの長さは 255 バイトを超えられません。
