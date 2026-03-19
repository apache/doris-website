---
{
  "title": "REGEXP_REPLACE_ONE",
  "language": "ja",
  "description": "REGEXPREPLACEONE関数は、指定された文字列に対して正規表現マッチングを実行するために設計された強力なツールです。"
}
---
## 説明

`REGEXP_REPLACE_ONE`関数は、指定された文字列に対して正規表現マッチングを実行するために設計された強力なツールです。この関数を使用すると、文字列内の特定のパターンの最初の出現を検索して置換することができます。

テキストデータを扱う際、特定のルールに基づいて文字列を操作する必要がよくあります。正規表現は、これらのルールを定義するための柔軟で効率的な方法を提供します。この関数は文字列（`str`）、正規表現パターン（`pattern`）、および置換文字列（`repl`）を受け取ります。そして`pattern`にマッチする`str`の最初の部分を検索し、それを`repl`で置換します。

文字セットマッチングを処理する際は、Utf-8標準文字クラスを使用する必要があることに注意してください。これにより、関数が異なる言語の様々な文字を正しく識別し、処理できることが保証されます。

`pattern`が許可された正規表現でない場合、エラーが発生します。

サポートされる文字マッチクラス：https://github.com/google/re2/wiki/Syntax

## 構文

```sql
REGEXP_REPLACE_ONE(<str>, <pattern>, <repl>)
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | このパラメータは文字列型です。正規表現マッチングが実行される文字列を表します。これは変更したい対象文字列です。|
| `<pattern>` | このパラメータも文字列型です。正規表現パターンです。関数は<str>文字列内でこのパターンの最初の出現を検索します。|
| `<repl>` | これも文字列パラメータです。<pattern>にマッチする<str>の最初の部分を置き換える文字列が含まれています。|

## 戻り値

関数は置換操作後の結果文字列を返します。戻り値の型はVarcharです。<str>の一部が<pattern>にマッチしない場合、元の<str>が返されます。

## Example

最初のスペースをハイフンで置き換える
 説明: この例では、入力文字列<str>は'a b c'、正規表現パターン<pattern>は単一のスペース' '、置換文字列<repl>はハイフン'-'です。関数は文字列'a b c'内でスペースの最初の出現を検索し、それをハイフンで置き換えます。そのため出力は'a-b c'となります。

```sql
mysql> SELECT regexp_replace_one('a b c', ' ', '-');

+-----------------------------------+
| regexp_replace_one('a b c', ' ', '-') |
+-----------------------------------+
| a-b c                             |
+-----------------------------------+
```
最初にマッチしたグループを置換します。ここで、入力文字列<str>は'a b b'、正規表現パターン<pattern>は'(b)'で、これは文字'b'にマッチするキャプチャグループです。置換文字列<repl>は'<\1>'で、\1は最初のキャプチャグループ（この場合、マッチした'b'）を参照します。この関数は文字列'a b b'内で最初に出現する'b'を見つけて'<b>'に置換します。したがって、出力は'a <b> b'になります。

```sql
mysql> SELECT regexp_replace_one('a b b', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace_one('a b b', '(b)', '<\1>') |
+----------------------------------------+
| a <b> b                                |
+----------------------------------------+
```
最初の中国語文字を置き換えます。入力文字列<str>は中国語文字と英語テキストを含む長い文字列です。正規表現パターン<pattern>は'\p{Han}'で、これは任意の中国語文字にマッチするUnicode文字クラスです。置換文字列<repl>は'123'です。この関数は文字列内の最初の中国語文字を検索し、それを'123'で置き換えます。そのため出力は'123是一段中文This is a passage in English 1234567'となります。

```sql
mysql> select regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\\p{Han}', '123');
+------------------------------------------------------------------------------------------------+
| regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\p{Han}', '123')       |
+------------------------------------------------------------------------------------------------+
| 123是一段中文This is a passage in English 1234567                                              |
+------------------------------------------------------------------------------------------------+
```
テーブルにデータを挿入して置換を実行まず、test_table_for_regexp_replace_oneという名前のテーブルが4つの列で作成されます：id（整数）、text_data（置換が実行される文字列）、pattern（マッチングのための正規表現パターン）、およびrepl（置換文字列）。次に、10行のデータがテーブルに挿入され、各行には4つの列に対して異なる値が含まれます。最後に、SELECT文を使用してテーブルをクエリします。各行について、REGEXP_REPLACE_ONE関数が対応するpatternとrepl値を使用してtext_data列に適用されます。置換の結果はreplaced_resultとしてエイリアスされます。行はid列で順序付けされます。

```sql
CREATE TABLE test_table_for_regexp_replace_one (
        id INT,
        text_data VARCHAR(500),
        pattern VARCHAR(100),
        repl VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

INSERT INTO test_table_for_regexp_replace_one VALUES
    (1, 'Hello World', ' ', '-'),    
    (2, 'apple123', '[0-9]', 'X'),    
    (3, 'aabbcc', '(aa)', 'AA'),         
    (4, '123-456-7890', '[0-9][0-9][0-9]', 'XXX'), 
    (5, 'test,data', ',', ';'),              
    (6, 'a1b2c3', '[a-z][0-9]', 'X'),         
    (7, 'book keeper', 'oo', 'OO'),        
    (8, 'ababab', '(ab)', 'AB'),       
    (9, 'aabbcc', '(bb)', 'BB'),         
    (10, 'apple,banana', '[aeiou]', 'X');

SELECT id, regexp_replace_one(text_data, pattern, repl) as replaced_result FROM test_table_for_regexp_replace_one ORDER BY id;
```
```text
+------+-----------------+
| id   | replaced_result |
+------+-----------------+
|    1 | Hello-World     |
|    2 | appleX23        |
|    3 | AAbbcc          |
|    4 | XXX-456-7890    |
|    5 | test;data       |
|    6 | Xb2c3           |
|    7 | BOOk keeper     |
|    8 | ABabab          |
|    9 | aaBBcc          |
|   10 | Xpple,banana    |
+------+-----------------+
```
絵文字単一置換ケース

```sql 
SELECT regexp_replace_one('😀😊😀', '😀|😊', '[SMILE]');
```
```text
+------------------------------------------------------------+
| regexp_replace_one('😀😊😀', '😀|😊', '[SMILE]')                     |
+------------------------------------------------------------+
| [SMILE]😊😀                                                    |
+------------------------------------------------------------+
```
'str'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, ' ', '-');
+------------------------------------+
| REGEXP_REPLACE_ONE(NULL, ' ', '-') |
+------------------------------------+
| NULL                               |
+------------------------------------+
```
'pattern'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', NULL, '-');
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', NULL, '-') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
'repl'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', ' ', NULL);
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', ' ', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
全てのパラメータがNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, NULL, NULL);
+--------------------------------------+
| REGEXP_REPLACE_ONE(NULL, NULL, NULL) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```
`pattern`が正規表現として許可されていない場合、エラーをスローします

```sql
SELECT regexp_replace_one('a b b', '(b', '<\\1>');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```
