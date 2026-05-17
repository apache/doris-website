---
{
    "title": "REPLACE",
    "language": "en",
    "description": "The REPLACE function is used to replace all occurrences of a specified substring in a string with a new substring."
}
---

## Description

The REPLACE function is used to replace all occurrences of a specified substring in a string with a new substring. This function replaces all matching instances of the substring in the string, performing a global replace operation.

**Difference from REPLACE_EMPTY function:**
- `REPLACE()` replaces the specified substring, including empty strings
- `REPLACE_EMPTY()` is specifically used to replace empty values or empty strings with a specified value

## Syntax

```sql
REPLACE(<str>, <old>, <new>)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<str>` | The source string where replacement will occur. Type: VARCHAR |
| `<old>` | The target substring to be replaced. If not found in str, no replacement occurs. Type: VARCHAR |
| `<new>` | The new substring used to replace old. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the new string after replacement.

Replacement rules:
- Replaces all matching old substrings in the string
- Replacement is case-sensitive
- If old is an empty string, returns the original string (no operation performed)
- If new is an empty string, effectively deletes all matching old substrings

Special cases:
- If any parameter is NULL, returns NULL
- If str is an empty string, returns an empty string
- If old is an empty string, returns the original str (no replacement)
- If old is not found in str, returns the original str

## Examples

1. Basic replacement operation
```sql
SELECT REPLACE('hello world', 'world', 'universe');
```
```text
+---------------------------------------------+
| REPLACE('hello world', 'world', 'universe') |
+---------------------------------------------+
| hello universe                              |
+---------------------------------------------+
```

2. Replace multiple matches
```sql
SELECT REPLACE('apple apple apple', 'apple', 'orange');
```
```text
+------------------------------------------------+
| REPLACE('apple apple apple', 'apple', 'orange') |
+------------------------------------------------+
| orange orange orange                           |
+------------------------------------------------+
```

3. Delete substring (replace with empty string)
```sql
SELECT REPLACE('banana', 'a', '');
```
```text
+---------------------------+
| REPLACE('banana', 'a', '') |
+---------------------------+
| bnn                       |
+---------------------------+
```

4. NULL value handling
```sql
SELECT REPLACE(NULL, 'old', 'new'), REPLACE('test', NULL, 'new'), REPLACE('test', 'old', NULL);
```
```text
+------------------------------+------------------------------+------------------------------+
| REPLACE(NULL, 'old', 'new')  | REPLACE('test', NULL, 'new') | REPLACE('test', 'old', NULL) |
+------------------------------+------------------------------+------------------------------+
| NULL                         | NULL                         | NULL                         |
+------------------------------+------------------------------+------------------------------+
```

5. UTF-8 character replacement
```sql
SELECT REPLACE('ṭṛì ḍḍumai test ṭṛì ḍḍumannàri', 'ṭṛì', 'replaced');
```
```text
+-----------------------------------------------------------+
| REPLACE('ṭṛì ḍḍumai test ṭṛì ḍḍumannàri', 'ṭṛì', 'replaced') |
+-----------------------------------------------------------+
| replaced ḍḍumai test replaced ḍḍumannàri                  |
+-----------------------------------------------------------+
```
