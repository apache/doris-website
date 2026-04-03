---
{
  "title": "REGEXP_COUNT",
  "language": "ja",
  "description": "これは、文字列内で指定されたregular expressionパターンに一致する文字数をカウントする関数です。"
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
これは、指定された正規表現パターンにマッチする文字列内の文字数をカウントする関数です。入力は、ユーザー提供の文字列と正規表現パターンで構成されます。戻り値は、マッチした文字の総数です。マッチするものが見つからない場合は、0を返します。

'str'パラメータは'string'型で、ユーザーが正規表現でマッチさせたい文字列です。

'pattern'パラメータは'string'型で、文字列のマッチに使用される正規表現の文字列です。

文字セットマッチングを処理する際は、Utf-8標準文字クラスを使用する必要があることに注意してください。これにより、関数が異なる言語の様々な文字を正しく識別し、処理できることが保証されます。

サポートされる文字マッチクラス : https://github.com/google/re2/wiki/Syntax

## 構文

```sql
REGEXP_COUNT(<str>, <pattern>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<str>` | このパラメータは'string'型で、正規表現でマッチした対象の値です。 |
| `<pattern>` | このパラメータは'string'型で、正規表現であり、パターンの規則に合致する文字列をマッチするために使用されます。 |
## 戻り値

- 'str'内の正規表現'pattern'のマッチ数を返します。これは'int'型で、マッチする文字がない場合は0を返します。
patternがNULLまたはstrがNULL、あるいは両方がNULLの場合はNULLを返します。
patternが許可されない正規表現の場合はエラーが発生し、この操作は誤りです。

## 例

エスケープ文字を含む表現に対する文字列領域のマッチングを行い、結果を返す

```sql
SELECT regexp_count('a.b:c;d', '[\\\\.:;]');
```
```text
+--------------------------------------+
| regexp_count('a.b:c;d', '[\\\\.:;]') |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```
通常文字':'に対する正規表現の文字列マッチング結果。

```sql
SELECT regexp_count('a.b:c;d', ':');
```
```text
+------------------------------+
| regexp_count('a.b:c;d', ':') |
+------------------------------+
|                            1 |
+------------------------------+
```
2つの角括弧を含む正規表現に対して文字列をマッチングした際の戻り値の結果。

```sql
SELECT regexp_count('Hello, World!', '[[:punct:]]');
```
```text
+----------------------------------------------+
| regexp_count('Hello, World!', '[[:punct:]]') |
+----------------------------------------------+
|                                            2 |
+----------------------------------------------+
```
Patternがnullの場合

```sql
SELECT regexp_count("abc",NULL);
```
```text
+------------------------+
| regexp_count("abc",NULL) |
+------------------------+
|                   NULL |
+------------------------+
```
Strがnullの場合

```sql
SELECT regexp_count(NULL,"abc");
```
```text
+------------------------+
| regexp_count(NULL,"abc") |
+------------------------+
|                   NULL |
+------------------------+
```
両方ともNULLです

```sql
SELECT regexp_count(NULL,NULL);
```
```text
+------------------------+
| regexp_count(NULL,NULL) |
+------------------------+
|                   NULL |
+------------------------+
```
特定の変数値を挿入してから、保存された行から変数を取得して照合した場合の戻り結果。

```sql

CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, pattern) as count_result FROM test_table_for_regexp_count ORDER BY id;

```
```text
+------+--------------+
| id   | count_result |
+------+--------------+
|    1 |            2 |
|    2 |            1 |
|    3 |            3 |
|    4 |            3 |
|    5 |            1 |
|    6 |            3 |
|    7 |            2 |
|    8 |            1 |
|    9 |            3 |
|   10 |            2 |
+------+--------------+

```
特定の変数値を挿入し、マッチングのために格納された行から変数を取得した場合の戻り結果。正規表現は定数である。

```sql
CREATE TABLE test_table_for_regexp_count (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_count VALUES
    (1, 'HelloWorld', '[A-Z][a-z]+'),    
    (2, 'apple123', '[a-z]{5}[0-9]'),    
    (3, 'aabbcc', '(aa|bb|cc)'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]'), 
    (5, 'test,data', ','),              
    (6, 'a1b2c3', '[a-z][0-9]'),         
    (7, 'book keeper', 'oo|ee'),        
    (8, 'ababab', '(ab)(ab)(ab)'),       
    (9, 'aabbcc', '(aa|bb|cc)'),         
    (10, 'apple,banana', '[aeiou][a-z]+');

SELECT id, regexp_count(text_data, 'e') as count_e FROM test_table_for_regexp_count WHERE text_data IS NOT NULL ORDER BY id;
```
```text
+------+---------+
| id   | count_e |
+------+---------+
|    1 |       1 |
|    2 |       1 |
|    3 |       0 |
|    4 |       0 |
|    5 |       1 |
|    6 |       0 |
|    7 |       3 |
|    8 |       0 |
|    9 |       0 |
|   10 |       1 |
+------+---------+
```
絵文字正規表現カウント

```sql
SELECT regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕');
```
```text
+----------------------------------------------------+
| regexp_count('🍔🍟🍕🌍', '🍔|🍟|🍕')                             |
+----------------------------------------------------+
|                                                  3 |
+----------------------------------------------------+
```
'pattern'が許可された正規表現でない場合、エラーをスローする

```sql

SELECT regexp_count('Hello, World!', '[[:punct:');
```
```text

ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: [[:punct:
Error: missing ]: [[:punct:
```
