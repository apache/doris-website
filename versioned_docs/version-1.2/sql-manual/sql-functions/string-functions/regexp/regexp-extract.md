---
{
    "title": "REGEXP_EXTRACT",
    "language": "en"
}
---

## Description

The string STR is matched regularly and the POS matching part which conforms to pattern is extracted. Patterns need to match exactly some part of the STR to return to the matching part of the pattern.

- If there is no match, return an empty string.

- Character set matching requires the use of Unicode standard character classes. For example, to match Chinese, use `\p{Han}`.

## Syntax

```sql
REGEXP_EXTRACT(<str>, <pattern>, <pos>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | The column need to do regular matching.|
| `<pattern>` | Target pattern.|
| `<pos>` | The parameter used to specify the position in the string from which to start searching for the regular expression match. It is an integer value representing the character position in the string (starting from 1). `pos` must be specified. |

## Return Value

Matching part of the partern. It is `Varchar` type.

## Example

```sql
mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 1) |
+-------------------------------------------------------------+
| b                                                           |
+-------------------------------------------------------------+

mysql> SELECT regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2);
+-------------------------------------------------------------+
| regexp_extract('AbCdE', '([[:lower:]]+)C([[:lower:]]+)', 2) |
+-------------------------------------------------------------+
| d                                                           |
+-------------------------------------------------------------+

mysql> select regexp_extract('这是一段中文This is a passage in English 1234567', '(\\p{Han}+)(.+)', 2);
+-----------------------------------------------------------------------------------------------+
| regexp_extract('这是一段中文This is a passage in English 1234567', '(\p{Han}+)(.+)', 2)       |
+-----------------------------------------------------------------------------------------------+
| This is a passage in English 1234567                                                          |
+-----------------------------------------------------------------------------------------------+
```
