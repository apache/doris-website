---
{
    "title": "CONCAT_WS",
    "language": "en",
    "description": "The CONCATWS function (Concatenate With Separator) concatenates multiple strings or arrays using a specified separator. Unlike the CONCAT function,"
}
---

## Description

The CONCAT_WS function (Concatenate With Separator) concatenates multiple strings or arrays using a specified separator. Unlike the CONCAT function, CONCAT_WS automatically skips NULL values (but not empty strings) and inserts a separator between non-NULL values. This function supports both string arguments and array arguments modes, and is very useful in scenarios such as generating CSV formats, path joining, and tag lists.

## Syntax

```sql
-- String mode
CONCAT_WS(<sep>, <str> [, <str> ...])

-- Array mode  
CONCAT_WS(<sep>, <array> [, <array> ...])
```

## Parameters

| Parameter    | Description              |
|-------|-----------------|
| `<sep>` | Separator string used to join parts. Type: VARCHAR |
| `<str>` | String arguments to be concatenated. Type: VARCHAR |
| `<array>` | Array arguments to be concatenated, array elements must be string type. Type: ARRAY&lt;VARCHAR&gt; |

## Return Value

Returns VARCHAR type, representing the concatenated string with separators.

Concatenation rules:
- Uses the first argument as the separator to join subsequent arguments
- Automatically skips NULL values, but preserves empty strings
- Supports string arguments or array arguments, but cannot be mixed
- Supports UTF-8 multi-byte characters as separators and content

Special cases:
- If the separator is NULL, returns NULL
- If all arguments to be concatenated are NULL, returns an empty string
- In array mode, skips NULL elements in arrays, but preserves empty string elements
- When NULL arrays are included in multiple array arguments, returns an empty string
- Mixing string arguments and array arguments is not allowed

## Examples

1. Basic string concatenation
```sql
SELECT CONCAT_WS(',', 'apple', 'banana', 'orange'), CONCAT_WS('-', 'hello', 'world');
```
```text
+-------------------------------------------+----------------------------------+
| CONCAT_WS(',', 'apple', 'banana', 'orange') | CONCAT_WS('-', 'hello', 'world') |
+-------------------------------------------+----------------------------------+
| apple,banana,orange                       | hello-world                      |
+-------------------------------------------+----------------------------------+
```

2. NULL separator handling
```sql
SELECT CONCAT_WS(NULL, 'd', 'is'), CONCAT_WS('or', 'd', NULL, 'is');
```
```text
+----------------------------+----------------------------------+
| CONCAT_WS(NULL, 'd', 'is') | CONCAT_WS('or', 'd', NULL, 'is') |
+----------------------------+----------------------------------+
| NULL                       | doris                            |
+----------------------------+----------------------------------+
```

3. Empty string handling (preserves empty strings)
```sql
SELECT CONCAT_WS('|', 'hello', '', 'world', NULL), CONCAT_WS(',', '', 'test', '');
```
```text
+--------------------------------------------+-------------------------------+
| CONCAT_WS('|', 'hello', '', 'world', NULL) | CONCAT_WS(',', '', 'test', '') |
+--------------------------------------------+-------------------------------+
| hello||world                               | ,test,                        |
+--------------------------------------------+-------------------------------+
```

4. All NULL values
```sql
SELECT CONCAT_WS('x', NULL, NULL), CONCAT_WS('-', NULL, NULL, NULL);
```
```text
+----------------------------+---------------------------------+
| CONCAT_WS('x', NULL, NULL) | CONCAT_WS('-', NULL, NULL, NULL) |
+----------------------------+---------------------------------+
|                            |                                 |
+----------------------------+---------------------------------+
```

5. Array mode basic usage
```sql
SELECT CONCAT_WS('or', ['d', 'is']), CONCAT_WS('-', ['apple', 'banana', 'cherry']);
```
```text
+------------------------------+--------------------------------------------+
| CONCAT_WS('or', ['d', 'is']) | CONCAT_WS('-', ['apple', 'banana', 'cherry']) |
+------------------------------+--------------------------------------------+
| doris                        | apple-banana-cherry                        |
+------------------------------+--------------------------------------------+
```

6. NULL values in arrays
```sql
SELECT CONCAT_WS('or', ['d', NULL, 'is']), CONCAT_WS(',', [NULL, 'a', 'b', NULL, 'c']);
```
```text
+------------------------------------+------------------------------------------+
| CONCAT_WS('or', ['d', NULL, 'is']) | CONCAT_WS(',', [NULL, 'a', 'b', NULL, 'c']) |
+------------------------------------+------------------------------------------+
| doris                              | a,b,c                                    |
+------------------------------------+------------------------------------------+
```

7. Multiple array concatenation
```sql
SELECT CONCAT_WS('-', ['a', 'b'], ['c', NULL], ['d']), CONCAT_WS('|', ['x'], ['y', 'z']);
```
```text
+------------------------------------------------+----------------------------------+
| CONCAT_WS('-', ['a', 'b'], ['c', NULL], ['d']) | CONCAT_WS('|', ['x'], ['y', 'z']) |
+------------------------------------------------+----------------------------------+
| a-b-c-d                                        | x|y|z                            |
+------------------------------------------------+----------------------------------+
```

8. NULL array in multiple arrays
```sql
SELECT CONCAT_WS('-', ['a', 'b'], NULL, ['c', NULL], ['d']);
```
```text
+-----------------------------------------------------+
| CONCAT_WS('-', ['a', 'b'], NULL, ['c', NULL], ['d']) |
+-----------------------------------------------------+
|                                                     |
+-----------------------------------------------------+
```

9. UTF-8 multi-byte character handling
```sql
SELECT CONCAT_WS('x', 'ṭṛì', 'ḍḍumai'), CONCAT_WS('→', ['ṭṛì', 'ḍḍumai', 'hello']);
```
```text
+-------------------------------+----------------------------------------------+
| CONCAT_WS('x', 'ṭṛì', 'ḍḍumai') | CONCAT_WS('→', ['ṭṛì', 'ḍḍumai', 'hello']) |
+-------------------------------+----------------------------------------------+
| ṭṛìxḍḍumai                    | ṭṛì→ḍḍumai→hello                          |
+-------------------------------+----------------------------------------------+
```

10. CSV format generation and path joining
```sql
SELECT CONCAT_WS(',', 'Name', 'Age', 'City'), CONCAT_WS('/', 'home', 'user', 'documents', 'file.txt');
```
```text
+------------------------------------+--------------------------------------------------------+
| CONCAT_WS(',', 'Name', 'Age', 'City') | CONCAT_WS('/', 'home', 'user', 'documents', 'file.txt') |
+------------------------------------+--------------------------------------------------------+
| Name,Age,City                      | home/user/documents/file.txt                          |
+------------------------------------+--------------------------------------------------------+
```
