---
{
    "title": "STRRIGHT",
    "language": "en",
    "description": "The STRRIGHT function returns a specified number of characters from the right side of a string. The length is measured in UTF8 characters."
}
---

## Description

The STRRIGHT function returns a specified number of characters from the right side of a string. The length is measured in UTF8 characters.

## Alias

RIGHT

## Syntax

```sql
STRRIGHT(<str>, <len>)
```

## Parameters
| Parameter | Description                                   |
| --------- | --------------------------------------------- |
| `<str>` | The string to extract from. Type: VARCHAR     |
| `<len>` | The number of characters to return. Type: INT |

## Return Value

Returns VARCHAR type, representing the extracted substring.

Special cases:
- Returns NULL if any argument is NULL
- If len is negative, returns the substring starting from the abs(len)th character from the right
- Returns the entire string if len is greater than the string length

## Examples

1. Basic right extraction
```sql
SELECT STRRIGHT('Hello doris', 5), RIGHT('Hello doris', 5);
```
```text
+----------------------------+------------------------+
| STRRIGHT('Hello doris', 5) | RIGHT('Hello doris', 5) |
+----------------------------+------------------------+
| doris                      | doris                  |
+----------------------------+------------------------+
```

2. Different extraction lengths
```sql
SELECT STRRIGHT('Hello World', 3), STRRIGHT('Hello World', 8);
```
```text
+-----------------------------+-----------------------------+
| STRRIGHT('Hello World', 3)  | STRRIGHT('Hello World', 8)  |
+-----------------------------+-----------------------------+
| rld                         | lo World                    |
+-----------------------------+-----------------------------+
```

3. NULL value handling
```sql
SELECT STRRIGHT(NULL, 5), STRRIGHT('Hello doris', NULL);
```
```text
+-------------------+-------------------------------+
| STRRIGHT(NULL, 5) | STRRIGHT('Hello doris', NULL) |
+-------------------+-------------------------------+
| NULL              | NULL                          |
+-------------------+-------------------------------+
```

4. Empty string and zero length
```sql
SELECT STRRIGHT('', 5), STRRIGHT('Hello World', 0);
```
```text
+-------------------+-----------------------------+
| STRRIGHT('', 5)   | STRRIGHT('Hello World', 0)  |
+-------------------+-----------------------------+
|                   |                             |
+-------------------+-----------------------------+
```

5. Negative length handling
```sql
SELECT STRRIGHT('Hello doris', -7), STRRIGHT('Hello doris', -5);
```
```text
+-----------------------------+-----------------------------+
| STRRIGHT('Hello doris', -7) | STRRIGHT('Hello doris', -5) |
+-----------------------------+-----------------------------+
| doris                       | o doris                     |
+-----------------------------+-----------------------------+
```

6. Length exceeds string length
```sql
SELECT STRRIGHT('ABC', 10), STRRIGHT('short', 20);
```
```text
+---------------------+-----------------------+
| STRRIGHT('ABC', 10) | STRRIGHT('short', 20) |
+---------------------+-----------------------+
| ABC                 | short                 |
+---------------------+-----------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT STRRIGHT('ṭṛì ḍḍumai hello', 5), STRRIGHT('ṭṛì ḍḍumai hello', 11);
```
```text
+----------------------------------+-----------------------------------+
| STRRIGHT('ṭṛì ḍḍumai hello', 5)  | STRRIGHT('ṭṛì ḍḍumai hello', 11) |
+----------------------------------+-----------------------------------+
| hello                            | ḍumai hello                       |
+----------------------------------+-----------------------------------+
```

8. Numeric string handling
```sql
SELECT STRRIGHT('123456789', 3), STRRIGHT('ID_987654321', 6);
```
```text
+----------------------------+-------------------------------+
| STRRIGHT('123456789', 3)   | STRRIGHT('ID_987654321', 6)   |
+----------------------------+-------------------------------+
| 789                        | 654321                        |
+----------------------------+-------------------------------+
```

9. Email domain extraction
```sql
SELECT STRRIGHT('user@example.com', 11), STRRIGHT('admin@company.org.cn', 14);
```
```text
+----------------------------------+--------------------------------------+
| STRRIGHT('user@example.com', 11) | STRRIGHT('admin@company.org.cn', 14) |
+----------------------------------+--------------------------------------+
| example.com                      | company.org.cn                      |
+----------------------------------+--------------------------------------+
```

### Keywords

    STRRIGHT, RIGHT