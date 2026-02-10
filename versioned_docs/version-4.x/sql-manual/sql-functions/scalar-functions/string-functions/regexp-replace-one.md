---
{
    "title": "REGEXP_REPLACE_ONE",
    "language": "en",
    "description": "The REGEXPREPLACEONE function is a powerful tool designed to perform regular expression matching on a given string."
}
---

## Description

The `REGEXP_REPLACE_ONE` function is a powerful tool designed to perform regular expression matching on a given string. It allows you to find and replace the first occurrence of a specific pattern within the string. 

When working with text data, you often need to manipulate strings based on certain rules. Regular expressions provide a flexible and efficient way to define these rules. This function takes a string (`str`), a regular expression pattern (`pattern`), and a replacement string (`repl`). It then searches for the first part of the `str` that matches the `pattern` and substitutes it with the `repl`.

It should be noted that when handling character set matching, Utf-8 standard character classes should be used. This ensures that functions can correctly identify and process various characters from different languages.

If the `pattern` is not allowed regexp regular,throw error;

Support character match classes : https://github.com/google/re2/wiki/Syntax

## Syntax

```sql
REGEXP_REPLACE_ONE(<str>, <pattern>, <repl>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | This parameter is of type string. It represents the string on which the regular expression matching will be performed. This is the target string that you want to modify.|
| `<pattern>` | This parameter is also of type string. It is a regular expression pattern. The function will search for the first occurrence of this pattern within the <str> string.|
| `<repl>` | This is a string parameter as well. It contains the string that will replace the first part of <str> that matches the <pattern>.|

## Return Value

The function returns the result string after the replacement operation. The return type is Varchar. If no part of the <str> matches the <pattern>, the original <str> will be returned.

## Example

Replace the first space with a hyphen
 Explanation: In this example, the input string <str> is 'a b c', the regular expression pattern <pattern> is a single space ' ', and the replacement string <repl> is a hyphen '-'. The function searches for the first occurrence of a space in the string 'a b c' and replaces it with a hyphen. So the output is 'a-b c'.

```sql
mysql> SELECT regexp_replace_one('a b c', ' ', '-');

+-----------------------------------+
| regexp_replace_one('a b c', ' ', '-') |
+-----------------------------------+
| a-b c                             |
+-----------------------------------+
```

Replace the first matched group.Here, the input string <str> is 'a b b', the regular expression pattern <pattern> is '(b)', which is a capturing group that matches the character 'b'. The replacement string <repl> is '<\1>', where \1 refers to the first capturing group (in this case, the matched 'b'). The function finds the first occurrence of 'b' in the string 'a b b' and replaces it with '<b>'. Thus, the output is 'a <b> b'.


```sql
mysql> SELECT regexp_replace_one('a b b', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace_one('a b b', '(b)', '<\1>') |
+----------------------------------------+
| a <b> b                                |
+----------------------------------------+
```
Replace the first Chinese character.The input string <str> is a long string containing Chinese characters and English text. The regular expression pattern <pattern> is '\p{Han}', which is a Unicode character class that matches any Chinese character. The replacement string <repl> is '123'. The function searches for the first Chinese character in the string and replaces it with '123'. So the output is '123是一段中文This is a passage in English 1234567'.

```sql
mysql> select regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\\p{Han}', '123');
+------------------------------------------------------------------------------------------------+
| regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\p{Han}', '123')       |
+------------------------------------------------------------------------------------------------+
| 123是一段中文This is a passage in English 1234567                                              |
+------------------------------------------------------------------------------------------------+
```

Insert data into a table and perform replacementFirst, a table named test_table_for_regexp_replace_one is created with four columns: id (an integer), text_data (a string where the replacement will be performed), pattern (the regular expression pattern for matching), and repl (the replacement string).Then, ten rows of data are inserted into the table, each containing different values for the four columns.Finally, a SELECT statement is used to query the table. For each row, the REGEXP_REPLACE_ONE function is applied to the text_data column using the corresponding pattern and repl values. The result of the replacement is aliased as replaced_result. The rows are ordered by the id column.

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

Emoji one replace case

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


'str' is NULL,return NULL
```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, ' ', '-');
+------------------------------------+
| REGEXP_REPLACE_ONE(NULL, ' ', '-') |
+------------------------------------+
| NULL                               |
+------------------------------------+
```

'pattern' is NULL,return NULL

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', NULL, '-');
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', NULL, '-') |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```
'repl' is NULL return NULL

```sql
mysql> SELECT REGEXP_REPLACE_ONE('Hello World', ' ', NULL);
+----------------------------------------------+
| REGEXP_REPLACE_ONE('Hello World', ' ', NULL) |
+----------------------------------------------+
| NULL                                         |
+----------------------------------------------+
```

All parameters are NULL,return NULL

```sql
mysql> SELECT REGEXP_REPLACE_ONE(NULL, NULL, NULL);
+--------------------------------------+
| REGEXP_REPLACE_ONE(NULL, NULL, NULL) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

If the `pattern` is not allowed regexp regular,throw error

```sql
SELECT regexp_replace_one('a b b', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```