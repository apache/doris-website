---
{
    "title": "STRLEFT",
    "language": "en"
}
---

## Description

The STRLEFT function returns a specified number of characters from the left side of a string. The length is measured in UTF8 characters.

## Alias

LEFT

## Syntax

```sql
STRLEFT(<str>, <len>)
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
- Returns empty string "" if len is less than or equal to 0
- Returns the entire string if len is greater than the string length

## Examples

1. Basic left extraction
```sql
SELECT STRLEFT('Hello doris', 5), LEFT('Hello doris', 5);
```
```text
+---------------------------+----------------------+
| STRLEFT('Hello doris', 5) | LEFT('Hello doris', 5) |
+---------------------------+----------------------+
| Hello                     | Hello                |
+---------------------------+----------------------+
```

2. Different extraction lengths
```sql
SELECT STRLEFT('Hello World', 3), STRLEFT('Hello World', 8);
```
```text
+----------------------------+----------------------------+
| STRLEFT('Hello World', 3)  | STRLEFT('Hello World', 8)  |
+----------------------------+----------------------------+
| Hel                        | Hello Wo                   |
+----------------------------+----------------------------+
```

3. NULL value handling
```sql
SELECT STRLEFT(NULL, 5), STRLEFT('Hello doris', NULL);
```
```text
+------------------+------------------------------+
| STRLEFT(NULL, 5) | STRLEFT('Hello doris', NULL) |
+------------------+------------------------------+
| NULL             | NULL                         |
+------------------+------------------------------+
```

4. Empty string and zero length
```sql
SELECT STRLEFT('', 5), STRLEFT('Hello World', 0);
```
```text
+------------------+----------------------------+
| STRLEFT('', 5)   | STRLEFT('Hello World', 0)  |
+------------------+----------------------------+
|                  |                            |
+------------------+----------------------------+
```

5. Negative length handling
```sql
SELECT STRLEFT('Hello doris', -5), STRLEFT('Hello doris', -1);
```
```text
+-----------------------------+----------------------------+
| STRLEFT('Hello doris', -5)  | STRLEFT('Hello doris', -1) |
+-----------------------------+----------------------------+
|                             |                            |
+-----------------------------+----------------------------+
```

6. Length exceeds string length
```sql
SELECT STRLEFT('ABC', 10), STRLEFT('short', 20);
```
```text
+--------------------+----------------------+
| STRLEFT('ABC', 10) | STRLEFT('short', 20) |
+--------------------+----------------------+
| ABC                | short                |
+--------------------+----------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT STRLEFT('ṭṛì ḍḍumai hello', 3), STRLEFT('ṭṛì ḍḍumai hello', 7);
```
```text
+---------------------------------+----------------------------------+
| STRLEFT('ṭṛì ḍḍumai hello', 3)  | STRLEFT('ṭṛì ḍḍumai hello', 7)  |
+---------------------------------+----------------------------------+
| ṭṛì                             | ṭṛì ḍḍu                          |
+---------------------------------+----------------------------------+
```

8. Number and ID prefix
```sql
SELECT STRLEFT('ID123456789', 5), STRLEFT('USER_987654321', 5);
```
```text
+----------------------------+------------------------------+
| STRLEFT('ID123456789', 5)  | STRLEFT('USER_987654321', 5) |
+----------------------------+------------------------------+
| ID123                      | USER_                        |
+----------------------------+------------------------------+
```

### Keywords

    STRLEFT, LEFT