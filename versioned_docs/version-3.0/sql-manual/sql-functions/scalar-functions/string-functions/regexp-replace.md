---
{
    "title": "REGEXP_REPLACE",
    "language": "en"
}
---

## Description

Regular matching of STR strings, replacing the part hitting pattern with a new string.

- Character set matching requires the use of Unicode standard character classes. For example, to match Chinese, use `\p{Han}`.

## Syntax

```sql
REGEXP_REPLACE(<str>, <pattern>, <repl>)
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
mysql> SELECT regexp_replace('a b c', ' ', '-');
+-----------------------------------+
| regexp_replace('a b c', ' ', '-') |
+-----------------------------------+
| a-b-c                             |
+-----------------------------------+

mysql> SELECT regexp_replace('a b c', '(b)', '<\\1>');
+----------------------------------------+
| regexp_replace('a b c', '(b)', '<\1>') |
+----------------------------------------+
| a <b> c                                |
+----------------------------------------+

mysql> select regexp_replace('这是一段中文 This is a passage in English 1234567', '\\p{Han}+', '123');
+---------------------------------------------------------------------------------------------+
| regexp_replace('这是一段中文 This is a passage in English 1234567', '\p{Han}+', '123')       |
+---------------------------------------------------------------------------------------------+
| 123This is a passage in English 1234567                                                     |
+---------------------------------------------------------------------------------------------+
```