---
{
    "title": "TRIM_IN",
    "language": "en"
}
---


## Description

The TRIM_IN function is used to remove leading and trailing specified characters from a string. If no character set is specified, it removes leading and trailing spaces by default. When a character set is specified, it removes all specified characters from both ends (regardless of their order in the set).

The key feature of TRIM_IN is that it removes any combination of characters from the specified set, while the TRIM function removes characters based on exact string matching.

## Syntax

```sql
TRIM_IN(<str>[, <rhs>])
```

## Parameters

| Parameter | Description |
| --------- | ------------------------------------------------------------------------ |
| `<str>` | The string to be processed. Type: VARCHAR |
| `<rhs>` | Optional parameter, the set of characters to be removed. Type: VARCHAR |

## Return Value

Returns VARCHAR type, representing the processed string.

Special cases:
- If str is NULL, returns NULL
- If rhs is not specified, removes all leading and trailing spaces
- If rhs is specified, removes all characters from both ends that appear in rhs until encountering characters not in rhs

## Examples

1. Remove leading and trailing spaces
```sql
SELECT trim_in('   ab d   ') str;
```
```text
+------+
| str  |
+------+
| ab d |
+------+
```

2. Remove specified character set
```sql
SELECT trim_in('ababccaab', 'ab') str;
```
```text
+------+
| str  |
+------+
| cc   |
+------+
```

3. Comparison with TRIM function
```sql
SELECT trim_in('ababccaab', 'ab'), trim('ababccaab', 'ab');
```
```text
+-----------------------------+--------------------------+
| trim_in('ababccaab', 'ab')  | trim('ababccaab', 'ab')  |
+-----------------------------+--------------------------+
| cc                          | ababccaab                |
+-----------------------------+--------------------------+
```

4. Character set order does not matter
```sql
SELECT trim_in('abcHelloabc', 'cba');
```
```text
+--------------------------------+
| trim_in('abcHelloabc', 'cba')  |
+--------------------------------+
| Hello                          |
+--------------------------------+
```

5. UTF-8 character support
```sql
SELECT trim_in('+++ṭṛì ḍḍumai+++', '+');
```
```text
+--------------------------------------+
| trim_in('+++ṭṛì ḍḍumai+++', '+')    |
+--------------------------------------+
| ṭṛì ḍḍumai                           |
+--------------------------------------+
```

6. NULL value handling
```sql
SELECT trim_in(NULL, 'abc');
```
```text
+-----------------------+
| trim_in(NULL, 'abc')  |
+-----------------------+
| NULL                  |
+-----------------------+
```

7. Empty character handling
```sql
SELECT trim_in('', 'abc'), trim_in('abc', '');
```
```text
+--------------------+--------------------+
| trim_in('', 'abc') | trim_in('abc', '') |
+--------------------+--------------------+
|                    | abc                |
+--------------------+--------------------+
```

### Keywords

    TRIM_IN, TRIM