---
{
    "title": "REGEXP_REPLACE_ONE",
    "language": "en"
}
---

## Description

Regular matching of STR strings, replacing the part hitting pattern with repl, replacing only the first match.

- Character set matching requires the use of Unicode standard character classes. For example, to match Chinese, use `\p{Han}`.

## Syntax

```sql
REGEXP_REPLACE_ONE(<str>, <pattern>, <repl>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The column need to do regular matching.|
| `<pattern>` | Target pattern.|
| `<repl>` | The string to replace the matched pattern.|

## Return Value

Result after doing replacement. It is `Varchar` type.

## Example

```sql
mysql> SELECT regexp_replace_one('a b c', ' ', '-');

+-----------------------------------+
| regexp_replace_one('a b c', ' ', '-') |
+-----------------------------------+
| a-b c                             |
+-----------------------------------+

mysql> SELECT regexp_replace_one('a b b', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace_one('a b b', '(b)', '<\1>') |
+----------------------------------------+
| a <b> b                                |
+----------------------------------------+

mysql> select regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\\p{Han}', '123');
+------------------------------------------------------------------------------------------------+
| regexp_replace_one('这是一段中文 This is a passage in English 1234567', '\p{Han}', '123')       |
+------------------------------------------------------------------------------------------------+
| 123是一段中文This is a passage in English 1234567                                              |
+------------------------------------------------------------------------------------------------+
```
