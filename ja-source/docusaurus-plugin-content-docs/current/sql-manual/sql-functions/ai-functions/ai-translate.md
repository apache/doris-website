---
{
  "title": "AI翻訳",
  "language": "ja",
  "description": "指定された言語にテキストを翻訳するために使用されます。"
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

テキストを指定された言語に翻訳するために使用されます。

## 構文

```sql
AI_TRANSLATE([<resource_name>], <text>, <target_language>)
```
## パラメータ

|    Parameter      | Description             |
| ----------------- | ---------------------- |
| `<resource_name>` | 指定されたリソース名 |
| `<text>`          | 翻訳するテキスト  |
| `<target_language>` | ターゲット言語   |

## 戻り値

翻訳されたテキスト文字列を返します。

いずれかの入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力が異なる場合があります。

## 例

```sql
SET default_ai_resource = 'resourse_name';
SELECT AI_TRANSLATE('In my mind, doris is the best databases management system.', 'zh-CN') AS Result;
```
```text
+----------------------------------------------------------------+
| Result                                                         |
+----------------------------------------------------------------+
| 在我心目中，Doris是最优秀的数据库管理系统。                    |
+----------------------------------------------------------------+
```
```sql
SELECT AI_Translate('resource_name', 'This is an example', 'French') AS Result;
```
```text
+------------------+
| Result           |
+------------------+
| Voici un exemple |
+------------------+
```
