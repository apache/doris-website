---
{
    "title": "ENDS_WITH",
    "language": "en"
}
---

## Description

The ENDS_WITH function checks whether a string ends with the specified suffix.

## Syntax

```sql
ENDS_WITH(<str>, <suffix>)
```

## Parameters

| Parameter | Description |
|----------|--------------|
| `str`    | The main string to check. Type: VARCHAR |
| `suffix` | The suffix string to match. Type: VARCHAR |

## Return Value

Returns BOOLEAN type (displayed as TINYINT in Doris, where 1 represents true and 0 represents false).

Matching rules:
- Exact suffix match, case-sensitive
- Empty suffix matches any string (returns true)
- Supports correct matching of UTF-8 multi-byte characters
- Suffix length cannot exceed main string length (unless suffix is empty)

Special cases:
- If either parameter is NULL, returns NULL
- If suffix is an empty string, returns true (any string ends with an empty string)
- If main string is empty but suffix is not, returns false
- If both are empty strings, returns true

## Examples

1. Basic suffix matching
```sql
SELECT ENDS_WITH('Hello doris', 'doris'), ENDS_WITH('Hello doris', 'Hello');
```
```text
+-----------------------------------+-----------------------------------+
| ENDS_WITH('Hello doris', 'doris') | ENDS_WITH('Hello doris', 'Hello') |
+-----------------------------------+-----------------------------------+
|                                 1 |                                 0 |
+-----------------------------------+-----------------------------------+
```

2. Case sensitivity
```sql
SELECT ENDS_WITH('Hello World', 'world'), ENDS_WITH('Hello World', 'World');
```
```text
+-----------------------------------+-----------------------------------+
| ENDS_WITH('Hello World', 'world') | ENDS_WITH('Hello World', 'World') |
+-----------------------------------+-----------------------------------+
|                                 0 |                                 1 |
+-----------------------------------+-----------------------------------+
```

3. NULL value handling
```sql
SELECT ENDS_WITH(NULL, 'test'), ENDS_WITH('test', NULL);
```
```text
+--------------------------+--------------------------+
| ENDS_WITH(NULL, 'test')  | ENDS_WITH('test', NULL)  |
+--------------------------+--------------------------+
| NULL                     | NULL                     |
+--------------------------+--------------------------+
```

4. Empty string handling
```sql
SELECT ENDS_WITH('hello', ''), ENDS_WITH('', 'world');
```
```text
+-------------------------+--------------------------+
| ENDS_WITH('hello', '')  | ENDS_WITH('', 'world')   |
+-------------------------+--------------------------+
|                       1 |                        0 |
+-------------------------+--------------------------+
```

5. Complete string matching
```sql
SELECT ENDS_WITH('test', 'test'), ENDS_WITH('testing', 'test');
```
```text
+---------------------------+------------------------------+
| ENDS_WITH('test', 'test') | ENDS_WITH('testing', 'test') |
+---------------------------+------------------------------+
|                         1 |                            1 |
+---------------------------+------------------------------+
```

6. File extension check
```sql
SELECT ENDS_WITH('document.pdf', '.pdf'), ENDS_WITH('image.jpg', '.png');
```
```text
+------------------------------------+----------------------------------+
| ENDS_WITH('document.pdf', '.pdf')  | ENDS_WITH('image.jpg', '.png')   |
+------------------------------------+----------------------------------+
|                                  1 |                                0 |
+------------------------------------+----------------------------------+
```

7. UTF-8 multi-byte characters
```sql
SELECT ENDS_WITH('hello ṭṛì ḍḍumai', 'ḍḍumai'), ENDS_WITH('hello ṭṛì ḍḍumai', 'ṭṛì');
```
```text
+------------------------------------------+---------------------------------------+
| ENDS_WITH('hello ṭṛì ḍḍumai', 'ḍḍumai') | ENDS_WITH('hello ṭṛì ḍḍumai', 'ṭṛì')  |
+------------------------------------------+---------------------------------------+
|                                        1 |                                     0 |
+------------------------------------------+---------------------------------------+
```

8. URL path check
```sql
SELECT ENDS_WITH('https://example.com/api', '/api'), ENDS_WITH('https://example.com/', '.html');
```
```text
+--------------------------------------------+---------------------------------------------+
| ENDS_WITH('https://example.com/api', '/api') | ENDS_WITH('https://example.com/', '.html') |
+--------------------------------------------+---------------------------------------------+
|                                          1 |                                           0 |
+--------------------------------------------+---------------------------------------------+
```

9. Numeric string suffix
```sql
SELECT ENDS_WITH('123456789', '789'), ENDS_WITH('123456789', '456');
```
```text
+--------------------------------+--------------------------------+
| ENDS_WITH('123456789', '789')  | ENDS_WITH('123456789', '456')  |
+--------------------------------+--------------------------------+
|                              1 |                              0 |
+--------------------------------+--------------------------------+
```

10. Email domain check
```sql
SELECT ENDS_WITH('user@gmail.com', '.com'), ENDS_WITH('admin@company.org', '.com');
```
```text
+------------------------------------+--------------------------------------+
| ENDS_WITH('user@gmail.com', '.com') | ENDS_WITH('admin@company.org', '.com') |
+------------------------------------+--------------------------------------+
|                                  1 |                                    0 |
+------------------------------------+--------------------------------------+
```