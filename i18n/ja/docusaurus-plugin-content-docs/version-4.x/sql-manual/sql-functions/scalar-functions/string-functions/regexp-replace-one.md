---
{
    "title": "REGEXP_REPLACE_ONE",
    "language": "ja",
    "description": "REGEXP_REPLACE_ONE 関数は、文字列内で正規表現に最初に一致する部分を置換します。"
}
---

## 説明

`REGEXP_REPLACE_ONE` 関数は、文字列内で正規表現に最初に一致する部分を置換します。

この関数は、対象文字列 (`str`)、正規表現パターン (`pattern`)、置換文字列 (`repl`) を受け取ります。`str` の中で `pattern` に最初に一致した部分を `repl` に置き換えます。正規表現を使うと、文字列を加工する条件を柔軟に指定できます。

文字セットのマッチングでは、UTF-8 標準の文字クラスを使用してください。これにより、さまざまな言語の文字を正しく識別して処理できます。

無効な正規表現を `pattern` に指定すると、エラーが発生します。

使用できる文字クラスについては、https://github.com/google/re2/wiki/Syntax を参照してください。

## 構文

```sql
REGEXP_REPLACE_ONE(<str>, <pattern>, <repl>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<str>` | 文字列型。正規表現によるマッチングと置換の対象となる文字列です。 |
| `<pattern>` | 文字列型。<str> 内で最初に一致する箇所を検索するための正規表現パターンです。 |
| `<repl>` | 文字列型。<str> の中で <pattern> に最初に一致した部分を置き換える文字列です。 |

## 戻り値

置換後の文字列を VARCHAR 型で返します。<str> に <pattern> と一致する部分がない場合は、元の <str> を返します。いずれかの引数が NULL の場合は、NULL を返します。

## 例

最初の空白をハイフンに置換します。入力文字列 <str> は 'a b c'、正規表現パターン <pattern> は空白文字 ' '、置換文字列 <repl> はハイフン '-' です。最初の空白を置換した結果、'a-b c' を返します。

```sql
mysql> SELECT regexp_replace_one('a b c', ' ', '-');

+-----------------------------------+
| regexp_replace_one('a b c', ' ', '-') |
+-----------------------------------+
| a-b c                             |
+-----------------------------------+
```

最初に一致したキャプチャグループを置換します。入力文字列 <str> は 'a b b' です。正規表現パターン <pattern> の '(b)' は、文字 'b' に一致するキャプチャグループです。置換文字列 <repl> は '<\1>' で、\1 は最初のキャプチャグループ、ここでは一致した 'b' を参照します。最初に見つかった 'b' を '<b>' に置換するため、結果は 'a <b> b' です。


```sql
mysql> SELECT regexp_replace_one('a b b', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace_one('a b b', '(b)', '<\1>') |
+----------------------------------------+
| a <b> b                                |
+----------------------------------------+
```
最初の漢字を置換します。入力文字列 <str> には漢字と英語のテキストが含まれます。正規表現パターン <pattern> の '\p{Han}' は、漢字に一致する Unicode 文字クラスです。置換文字列 <repl> は '123' です。文字列内で最初に見つかった漢字を '123' に置換し、'123是一段中文This is a passage in English 1234567' を返します。

```sql
mysql> select regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\\p{Han}', '123');
+------------------------------------------------------------------------------------------------+
| regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\p{Han}', '123')       |
+------------------------------------------------------------------------------------------------+
| 123是一段中文This is a passage in English 1234567                                              |
+------------------------------------------------------------------------------------------------+
```

テーブルにデータを挿入して置換を実行します。まず、id（整数）、text_data（置換対象の文字列）、pattern（マッチングに使う正規表現パターン）、repl（置換文字列）の四つの列を持つ test_table_for_regexp_replace_one テーブルを作成します。次に、各列に異なる値を持つ十行を挿入します。最後に SELECT 文で各行の text_data に対し、同じ行の pattern と repl を使って REGEXP_REPLACE_ONE 関数を適用します。結果の列名を replaced_result とし、id の順に並べます。

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

絵文字が最初に一致した箇所だけを置換する例です。

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


'str' が NULL の場合、NULL を返します。
```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, ' ', '-');
+------------------------------------+
| REGEXP_REPLACE_ONE(NULL, ' ', '-') |
+------------------------------------+
| NULL                               |
+------------------------------------+
```

'pattern' が NULL の場合、NULL を返します。

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', NULL, '-');
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', NULL, '-') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
'repl' が NULL の場合、NULL を返します。

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', ' ', NULL);
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', ' ', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

すべての引数が NULL の場合、NULL を返します。

```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, NULL, NULL);
+--------------------------------------+
| REGEXP_REPLACE_ONE(NULL, NULL, NULL) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

`pattern` に無効な正規表現を指定すると、エラーが発生します。

```sql
SELECT regexp_replace_one('a b b', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```
