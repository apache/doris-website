---
{
  "title": "REGEXP_REPLACE",
  "description": "STR文字列の正規表現マッチングを行い、パターンにマッチした部分を新しい文字列で置換します。",
  "language": "ja"
}
---
## デスクリプション

STR文字列の正規表現マッチングを行い、patternにマッチした部分を新しい文字列で置き換えます。

文字セットマッチングを処理する際は、Utf-8標準の文字クラスを使用する必要があることに注意してください。これにより、関数が異なる言語の様々な文字を正しく識別し処理できることが保証されます。

`pattern`が有効な正規表現でない場合は、エラーを投げます。

サポートされる文字マッチクラス : https://github.com/google/re2/wiki/Syntax

## Syntax

```sql
REGEXP_REPLACE(<str>, <pattern>, <repl>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<str>` | このパラメータはVarchar型です。正規表現マッチングが実行される文字列を表します。リテラル文字列または文字列値を含むTableの列を指定できます。|
| `<pattern>` | このパラメータはVarchar型です。文字列とのマッチングに使用される正規表現パターンです。パターンには、複雑なマッチングルールを定義するために、さまざまな正規表現のメタ文字や構造を含めることができます。|
| `<repl>` | このパラメータはVarchar型です。<pattern>とマッチする<str>の部分を置き換える文字列です。パターン内でキャプチャされたグループを参照したい場合は、\1、\2などの後方参照を使用できます。ここで\1は最初のキャプチャグループを、\2は2番目のキャプチャグループを参照します。|

## Return Value

この関数は置換操作後の結果文字列を返します。戻り値はVarchar型です。<str>の一部も<pattern>とマッチしない場合は、元の<str>が返されます。

## Example

基本的な置換の例です。この例では、文字列'a b c'内のすべてのスペースがハイフンに置き換えられます。

```sql
mysql> SELECT regexp_replace('a b c', ' ', '-');
+-----------------------------------+
| regexp_replace('a b c', ' ', '-') |
+-----------------------------------+
| a-b-c                             |
+-----------------------------------+
```
キャプチャグループの使用。ここでは、パターン内のグループ (b) によって文字 'b' がキャプチャされ、置換文字列内の後方参照 \1 を使用して <b> に置き換えられます。

```sql
mysql> SELECT regexp_replace('a b c', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace('a b c', '(b)', '<\1>') |
+----------------------------------------+
| a <b> c                                |
+----------------------------------------+
```
中国語文字のマッチング。この例では、文字列内の連続する中国語文字をすべて '123' に置き換えます。

```sql
mysql> select regexp_replace('这是一段中文 This is a passage in English 1234567', '\\p{Han}+', '123');
+---------------------------------------------------------------------------------------------+
| regexp_replace('这是一段中文 This is a passage in English 1234567', '\p{Han}+', '123')       |
+---------------------------------------------------------------------------------------------+
| 123This is a passage in English 1234567                                                     |
+---------------------------------------------------------------------------------------------+
```
テストケースの挿入とテスト。このテストケースセットでは、元の文字列、パターン、および置換文字列を格納するTableを作成します。次に、さまざまなテストデータを挿入し、対応するパターンと置換文字列を使用して元の文字列にREGEXP_REPLACE操作を実行します。最後に、置換された文字列を取得して表示します。

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

-- Perform replacement 運用 on the inserted data
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
絵文字の置換

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
'str'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE(NULL, ' ', '-');
+--------------------------------+
| REGEXP_REPLACE(NULL, ' ', '-') |
+--------------------------------+
| NULL                           |
+--------------------------------+
```
'pattern'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', NULL, '-');
+------------------------------------------+
| REGEXP_REPLACE('Hello World', NULL, '-') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```
'repl'がNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', ' ', NULL);
+------------------------------------------+
| REGEXP_REPLACE('Hello World', ' ', NULL) |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```
全てのパラメータがNULLの場合、NULLを返す

```sql
mysql> SELECT REGEXP_REPLACE(NULL, NULL, NULL);
+----------------------------------+
| REGEXP_REPLACE(NULL, NULL, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
`pattern`が正規表現として正しくない場合は、エラーをthrowします;

```sql
SELECT regexp_replace('a b c', '(b', '<\\1>');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```
