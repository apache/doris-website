---
{
    "title": "REGEXP_EXTRACT_ALL",
    "language": "en"
}
---

## Description

Regularly matches a string `str` and extracts the first sub-pattern matching part of `pattern`. The pattern needs to exactly match a part of `str` in order to return an array of strings for the part of the pattern that needs to be matched. If there is no match or the pattern has no sub-pattern, the empty string is returned.

- Character set matching requires the use of Unicode standard character classes. For example, to match Chinese, use `\p{Han}`.

## Syntax

```sql
REGEXP_EXTRACT_ALL(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The column need to do regular matching.|
| `<pattern>` | Target pattern.|

## Return value

Value after extraction. It is `String` type.

## Example

```sql
mysql> SELECT regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)');
+--------------------------------------------------------------+
| regexp_extract_all('AbCdE', '([[:lower:]]+)C([[:lower:]]+)') |
+--------------------------------------------------------------+
| ['b']                                                        |
+--------------------------------------------------------------+

mysql> SELECT regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)');
+-----------------------------------------------------------------+
| regexp_extract_all('AbCdEfCg', '([[:lower:]]+)C([[:lower:]]+)') |
+-----------------------------------------------------------------+
| ['b','f']                                                       |
+-----------------------------------------------------------------+

mysql> SELECT regexp_extract_all('abc=111, def=222, ghi=333','("[^"]+"|\\w+)=("[^"]+"|\\w+)');
+--------------------------------------------------------------------------------+
| regexp_extract_all('abc=111, def=222, ghi=333', '("[^"]+"|\w+)=("[^"]+"|\w+)') |
+--------------------------------------------------------------------------------+
| ['abc','def','ghi']                                                            |
+--------------------------------------------------------------------------------+

mysql> select regexp_extract_all('这是一段中文This is a passage in English 1234567', '(\\p{Han}+)(.+)');
+------------------------------------------------------------------------------------------------+
| regexp_extract_all('这是一段中文This is a passage in English 1234567', '(\p{Han}+)(.+)')       |
+------------------------------------------------------------------------------------------------+
| ['这是一段中文']                                                                               |
+------------------------------------------------------------------------------------------------+
```
