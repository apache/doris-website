---
{
    "title": "REGEXP_REPLACE",
    "language": "en",
    "description": "Regular matching of STR strings, replacing the part hitting pattern with a new string."
}
---

## Description

Regular matching of STR strings, replacing the part hitting pattern with a new string.

It should be noted that when handling character set matching, Utf-8 standard character classes should be used. This ensures that functions can correctly identify and process various characters from different languages.

If the `pattern` is not allowed regexp regular,throw error;

Support character match classes : https://github.com/google/re2/wiki/Syntax

## Syntax

```sql
REGEXP_REPLACE(<str>, <pattern>, <repl>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | This parameter is of Varchar type. It represents the string on which the regular expression matching will be performed. It can be a literal string or a column from a table containing string values.|
| `<pattern>` | This parameter is of Varchar type. It is the regular expression pattern used to match the string. The pattern can include various regular expression metacharacters and constructs to define complex matching rules.|
| `<repl>` | This parameter is of Varchar type. It is the string that will replace the parts of the <str> that match the <pattern>. If you want to reference captured groups in the pattern, you can use backreferences like \1, \2, etc., where \1 refers to the first captured group, \2 refers to the second captured group, and so on.|

## Return Value

The function returns the result string after the replacement operation. The return value is of Varchar type. If no part of the <str> matches the <pattern>, the original <str> will be returned.

## Example

Basic replacement example.In this example, all spaces in the string 'a b c' are replaced with hyphens.

```sql
mysql> SELECT regexp_replace('a b c', ' ', '-');
+-----------------------------------+
| regexp_replace('a b c', ' ', '-') |
+-----------------------------------+
| a-b-c                             |
+-----------------------------------+
```
Using captured groups.Here, the character 'b' is captured by the group (b) in the pattern, and then it is replaced with <b> using the backreference \1 in the replacement string.

```sql
mysql> SELECT regexp_replace('a b c', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace('a b c', '(b)', '<\1>') |
+----------------------------------------+
| a <b> c                                |
+----------------------------------------+
```

Matching Chinese characters.This example replaces all consecutive Chinese characters in the string with '123'.

```sql
mysql> select regexp_replace('这是一段中文 This is a passage in English 1234567', '\\p{Han}+', '123');
+---------------------------------------------------------------------------------------------+
| regexp_replace('这是一段中文 This is a passage in English 1234567', '\p{Han}+', '123')       |
+---------------------------------------------------------------------------------------------+
| 123This is a passage in English 1234567                                                     |
+---------------------------------------------------------------------------------------------+
```

Insert and test cases.In this set of test cases, we create a table to store original strings, patterns, and replacement strings. Then we insert various test data and perform REGEXP_REPLACE operations on the original strings using the corresponding patterns and replacement strings. Finally, we retrieve and display the replaced strings.

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

Emoji replace

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

'str' is NULL,return NULL

```sql
mysql> SELECT REGEXP_REPLACE(NULL, ' ', '-');
+--------------------------------+
| REGEXP_REPLACE(NULL, ' ', '-') |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

'pattern' is NULL,return NULL

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', NULL, '-');
+------------------------------------------+
| REGEXP_REPLACE('Hello World', NULL, '-') |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

'repl' is NULL,return NULL

```sql
mysql> SELECT REGEXP_REPLACE('Hello World', ' ', NULL);
+------------------------------------------+
| REGEXP_REPLACE('Hello World', ' ', NULL) |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```

All parameters are NULL,return NULL

```sql
mysql> SELECT REGEXP_REPLACE(NULL, NULL, NULL);
+----------------------------------+
| REGEXP_REPLACE(NULL, NULL, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

If the `pattern` is not allowed regexp regular,throw error;

```sql
SELECT regexp_replace('a b c', '(b', '<\\1>');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[INVALID_ARGUMENT]Could not compile regexp pattern: (b
Error: missing ): (b

```