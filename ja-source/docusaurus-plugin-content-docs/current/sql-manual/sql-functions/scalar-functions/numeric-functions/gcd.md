---
{
  "title": "GCD",
  "language": "ja",
  "description": "2つの整数の最大公約数（GCD）を計算します。"
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

2つの整数の最大公約数（GCD）を計算します。

## 構文

```sql
GCD(<a>, <b>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<a>` | 最初の整数 |
| `<b>` | 2番目の整数 |

## 戻り値

`<a>`と`<b>`の最大公約数を返します。
いずれかの入力がNULLの場合、NULLを返します。

## 例

```sql
select gcd(54, 24);
```
```text
+------------+
| gcd(54,24) |
+------------+
|          6 |
+------------+
```
```sql
select gcd(-17, 31);
```
```text
+-------------+
| gcd(17,31)  |
+-------------+
|           1 |
+-------------+
```
```sql
select gcd(0, 10);
```
```text
+-----------+
| gcd(0,10) |
+-----------+
|        10 |
+-----------+
```
```sql
select gcd(54, NULL);
```
```text
+---------------+
| gcd(54, NULL) |
+---------------+
|          NULL |
+---------------+
```
