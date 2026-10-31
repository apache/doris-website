---
{
    "title": "SPLIT_BY_STRING",
    "language": "en"
}
---

## split_by_string 

### description

#### Syntax

`ARRAY<STRING> split_by_string(STRING s, STRING separator)`

Splits a string into substrings separated by a string. It uses a constant string separator of multiple characters as the separator. If the string separator is empty, it will split the string s into an array of single characters.

#### Arguments

`separator` — The separator. Type: `String`

`s` — The string to split. Type: `String`

#### Returned value(s)

Returns an array of selected substrings. Empty substrings may be selected when:

A non-empty separator occurs at the beginning or end of the string;

There are multiple consecutive separators;

The original string s is empty.

Type: `Array(String)`

### example

```
select split_by_string('a1b1c1d','1');
+---------------------------------+
| split_by_string('a1b1c1d', '1') |
+---------------------------------+
| ['a', 'b', 'c', 'd']            |
+---------------------------------+

select split_by_string(',,a,b,c,',',');
+----------------------------------+
| split_by_string(',,a,b,c,', ',') |
+----------------------------------+
| ['', '', 'a', 'b', 'c', '']      |
+----------------------------------+

SELECT split_by_string(NULL,',');
+----------------------------+
| split_by_string(NULL, ',') |
+----------------------------+
| NULL                       |
+----------------------------+

select split_by_string('a,b,c,abcde',',');
+-------------------------------------+
| split_by_string('a,b,c,abcde', ',') |
+-------------------------------------+
| ['a', 'b', 'c', 'abcde']            |
+-------------------------------------+

select split_by_string('1,,2,3,,4,5,,abcde', ',,');
+---------------------------------------------+
| split_by_string('1,,2,3,,4,5,,abcde', ',,') |
+---------------------------------------------+
| ['1', '2,3', '4,5', 'abcde']                |
+---------------------------------------------+

select split_by_string(',,,,',',,');
+-------------------------------+
| split_by_string(',,,,', ',,') |
+-------------------------------+
| ['', '', '']                  |
+-------------------------------+

select split_by_string(',,a,,b,,c,,',',,');
+--------------------------------------+
| split_by_string(',,a,,b,,c,,', ',,') |
+--------------------------------------+
| ['', 'a', 'b', 'c', '']              |
+--------------------------------------+
```
### keywords

SPLIT_BY_STRING,SPLIT