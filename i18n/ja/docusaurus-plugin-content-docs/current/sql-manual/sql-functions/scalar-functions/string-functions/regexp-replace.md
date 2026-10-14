---
{
    "title": "REGEXP_REPLACE",
    "language": "ja",
    "description": "文字列 STR を正規表現で照合し、パターンに一致した部分を新しい文字列に置き換えます。"
}
---

## 説明

文字列 STR を正規表現で照合し、パターンに一致した部分を新しい文字列に置き換えます。

文字集合を照合する場合は、UTF-8 標準の文字クラスを使用してください。これにより、さまざまな言語の文字を正しく識別して処理できます。

`pattern` が有効な正規表現でない場合は、エラーが発生します。

使用できる文字クラスについては、https://github.com/google/re2/wiki/Syntax を参照してください。

## 構文

```sql
REGEXP_REPLACE(<str>, <pattern>, <repl>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<str>` | VARCHAR 型。正規表現による照合の対象となる文字列です。文字列リテラル、または文字列値を含むテーブルの列を指定できます。|
| `<pattern>` | VARCHAR 型。文字列の照合に使用する正規表現パターンです。メタ文字や正規表現の構文を使用して、複雑な照合規則を指定できます。|
| `<repl>` | VARCHAR 型。<str> 内で <pattern> に一致した部分を置き換える文字列です。パターンでキャプチャしたグループを参照するには、\1、\2 などの後方参照を使用できます。\1 は最初のキャプチャグループ、\2 は次のキャプチャグループを参照します。|

## 戻り値

置換後の文字列を VARCHAR 型で返します。<str> のどの部分も <pattern> に一致しない場合は、元の <str> を返します。いずれかの引数が NULL の場合は、NULL を返します。

## 例

基本的な置換の例です。文字列 'a b c' 内のすべての空白をハイフンに置き換えます。

```sql
mysql> SELECT regexp_replace('a b c', ' ', '-');
+-----------------------------------+
| regexp_replace('a b c', ' ', '-') |
+-----------------------------------+
| a-b-c                             |
+-----------------------------------+
```
キャプチャグループを使用する例です。パターン (b) で文字 b をキャプチャし、置換文字列内の後方参照 \1 を使用して <b> に置き換えます。

```sql
mysql> SELECT regexp_replace('a b c', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace('a b c', '(b)', '<\1>') |
+----------------------------------------+
| a <b> c                                |
+----------------------------------------+
```

中国語の文字を照合する例です。文字列内で連続する中国語の文字をすべて '123' に置き換えます。

```sql
mysql> select regexp_replace('这是一段中文 This is a passage in English 1234567', '\\p{Han}+', '123');
+---------------------------------------------------------------------------------------------+
| regexp_replace('这是一段中文 This is a passage in English 1234567', '\p{Han}+', '123')       |
+---------------------------------------------------------------------------------------------+
| 123This is a passage in English 1234567                                                     |
+---------------------------------------------------------------------------------------------+
```

テーブルへの挿入と照合の例です。元の文字列、パターン、置換文字列を格納するテーブルを作成します。さまざまなテストデータを挿入し、各行のパターンと置換文字列を使用して元の文字列に REGEXP_REPLACE を適用します。最後に、置換後の文字列を取得して表示します。

```sql
-- Create a table to store test data
CREATE TABLE test_table_for_regexp_replace (
        id INT,
        original_text VARCHAR(500),
        pattern VARCHAR(100),
        replacement VARCHAR(100)
    ) PROPERTIES ("replication_num"="1");

-- Insert test data
INSERT INTO test_table_for_regexp_replace VALUES
    (1, 'Hello, World!', ',', '-'),    
    (2, 'apple123', '[0-9]', '*'),    
    (3, 'aabbcc', '(aa|bb|cc)', 'XX'),         
    (4, '123-456-7890', '-', ' '), 
    (5, 'test,data', ',', ';'),              
    (6, 'a1b2c3', '[0-9]', '#'),         
    (7, 'book keeper', 'oo|ee', '**'),        
    (8, 'ababab', '(ab)', 'XY'),       
    (9, 'aabbcc', '(aa|bb|cc)', 'ZZ'),         
    (10, 'apple,banana', ',', ' - ');

-- Perform replacement operations on the inserted data
SELECT id, regexp_replace(original_text, pattern, replacement) as replaced_text FROM test_table_for_regexp_replace ORDER BY id;
```

```text
+------+------------------+
| id   | replaced_text    |
+------+------------------+
|    1 | Hello- World!    |
|    2 | apple***         |
|    3 | XXXXYY           |
|    4 | 123 456 7890     |
|    5 | test;data        |
|    6 | a#b#c#           |
|    7 | b**k k**per      |
|    8 | XYXYXY           |
|    9 | ZZZZYY           |
|   10 | apple - banana   |
+------+------------------+
```

絵文字を置き換える例です。

```sql
SELECT regexp_replace('🌍 Earth 🍔 Food', '🌍|🍔', '*');
```

```text
+----------------------------------------------------------+
| regexp_replace('🌍 Earth 🍔 Food', '🌍|🍔', '*')                 |
+----------------------------------------------------------+
| * Earth * Food                                           |
+----------------------------------------------------------+
```

'str' が NULL の場合は、NULL を返します。

```sql
mysql> SELECT REGEXP_REPLACE(NULL, ' ', '-');
+--------------------------------+
| REGEXP_REPLACE(NULL, ' ', '-') |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

'pattern' が NULL の場合は、NULL を返します。

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', NULL, '-');
+------------------------------------------+
| REGEXP_REPLACE('Hello World', NULL, '-') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

'repl' が NULL の場合は、NULL を返します。

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', ' ', NULL);
+------------------------------------------+
| REGEXP_REPLACE('Hello World', ' ', NULL) |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

すべての引数が NULL の場合は、NULL を返します。

```sql
mysql> SELECT REGEXP_REPLACE(NULL, NULL, NULL);
+----------------------------------+
| REGEXP_REPLACE(NULL, NULL, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

`pattern` が有効な正規表現でない場合は、エラーが発生します。

```sql
SELECT regexp_replace('a b c', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```
