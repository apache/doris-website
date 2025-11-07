---
{
    "title": "String Functions Overview",
    "language": "en"
}
---

# String Functions Overview

String functions are built-in functions used to process and manipulate string data. They help perform various string operations, such as concatenation, splitting, replacement, searching, etc.

## UTF-8 Encoding Support

UTF-8 encoding is a variable-length character encoding that can represent almost all characters in the world, including Cyrillic, Greek, Chinese characters, emojis, and more.

In Doris string functions, UTF-8 encoding is supported unless specifically noted otherwise.

For example, the `substring` function can correctly handle UTF-8 encoded strings:

### ASCII Characters

```sql
mysql> SELECT substring('abc1', 2);
+----------------------+
| substring('abc1', 2) |
+----------------------+
| bc1                  |
+----------------------+
```

### Greek Letters

```sql
mysql> SELECT substring('αλφαβητον', 2, 4);
+---------------------------------------+
| substring('αλφαβητον', 2, 4)          |
+---------------------------------------+
| λφαβ                                  |
+---------------------------------------+
1 row in set (0.01 sec)
```

### Chinese Characters

```sql
mysql> SELECT substring('你好，世界', 2, 2);
+------------------------------------+
| substring('你好，世界', 2, 2)      |
+------------------------------------+
| 好，                               |
+------------------------------------+
```

### Emojis

```sql
mysql> SELECT substring('😊😊a😊 World!', 2, 3);
+-----------------------------------------+
| substring('😊😊a😊 World!', 2, 3)     |
+-----------------------------------------+
| 😊a😊                                  |
+-----------------------------------------+
```

## Performance Considerations

Since UTF-8 encoded characters have variable lengths, there may be performance impacts. Some functions provide both ASCII and UTF-8 versions for selection.

For example:
- The `length` function returns the byte length of a string
- The `char_length` function returns the character count of a string

```sql
mysql> select length('你好');
+------------------+
| length('你好')   |
+------------------+
|                6 |
+------------------+

mysql> select length('αλφαβητον');
+------------------------------+
| length('αλφαβητον')          |
+------------------------------+
|                           18 |
+------------------------------+

mysql> select char_length('你好');
+-----------------------+
| char_length('你好')   |
+-----------------------+
|                     2 |
+-----------------------+

mysql> select char_length('αλφαβητον');
+-----------------------------------+
| char_length('αλφαβητον')          |
+-----------------------------------+
|                                 9 |
+-----------------------------------+
```

## Special Notes

Some string functions that don't support UTF-8 encoding will be specifically mentioned in the documentation. For example, the `NGRAM_SEARCH` function only supports ASCII-encoded strings.

```sql
mysql> select ngram_search('abcab' , 'ab' , 2);
+----------------------------------+
| ngram_search('abcab' , 'ab' , 2) |
+----------------------------------+
|                              0.5 |
+----------------------------------+
```

For non-ASCII characters, `NGRAM_SEARCH` will still execute, but the results may not be as expected.

```sql
mysql> select ngram_search('αβγαβ' , 'αβ' , 2);
+-----------------------------------------+
| ngram_search('αβγαβ' , 'αβ' , 2)        |
+-----------------------------------------+
|                      0.6666666666666666 |
+-----------------------------------------+
```
