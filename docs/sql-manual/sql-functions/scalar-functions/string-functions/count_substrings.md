---
{
    "title": "COUNT_SUBSTRINGS",
    "language": "en"
}
---

## Description

The COUNT_SUBSTRINGS function counts the number of occurrences of a specified substring within a string. Note: The current implementation continues searching after shifting by the length of the substring when a match is found. For example, when str='ccc' and pattern='cc', the result returned is 1.

## Syntax

```sql
COUNT_SUBSTRINGS(<str>, <pattern>[, <start_pos>])
```

## Parameters
| Parameter     | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `<str>`       | The string to be searched. Type: STRING                            |
| `<pattern>`   | The substring to match. Type: STRING                               |
| `<start_pos>` | Position (1-based) at which the search starts. Type: INT. Optional |

## Return Value

Returns an INT type, representing the number of times the substring appears in the string.

Special cases:
- If str is NULL, returns NULL
- If pattern is an empty string, returns 0
- If str is an empty string, returns 0
- If start_pos is less than or equal to 0 or exceeds the string length, returns 0

## Examples

1. Basic usage
```sql
SELECT count_substrings('a1b1c1d', '1');
```
```text
+----------------------------------+
| count_substrings('a1b1c1d', '1') |
+----------------------------------+
|                                3 |
+----------------------------------+
```

2. Case with consecutive commas
```sql
SELECT count_substrings(',,a,b,c,', ',');
```
```text
+-----------------------------------+
| count_substrings(',,a,b,c,', ',') |
+-----------------------------------+
|                                 5 |
+-----------------------------------+
```

3. Case with overlapping substrings
```sql
SELECT count_substrings('ccc', 'cc');
```
```text
+--------------------------------+
| count_substrings('ccc', 'cc')  |
+--------------------------------+
|                              1 |
+--------------------------------+
```

4. NULL value handling
```sql
SELECT count_substrings(NULL, ',');
```
```text
+-----------------------------+
| count_substrings(NULL, ',') |
+-----------------------------+
|                        NULL |
+-----------------------------+
```

5. Empty string handling
```sql
SELECT count_substrings('a,b,c,abcde', '');
```
```text
+-------------------------------------+
| count_substrings('a,b,c,abcde', '') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

6. Using the start position parameter
```sql
SELECT count_substrings('ṭṛì ḍḍumai ṭṛì ti ḍḍumannàri', 'ḍḍu', 1), 
       count_substrings('ṭṛì ḍḍumai ṭṛì ti ḍḍumannàri', 'ḍḍu', 6);
```
```text
+-----------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
| count_substrings('ṭṛì ḍḍumai ṭṛì ti ḍḍumannàri', 'ḍḍu', 1)                        | count_substrings('ṭṛì ḍḍumai ṭṛì ti ḍḍumannàri', 'ḍḍu', 6)                        |
+-----------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
|                                                                                 2 |                                                                                 1 |
+-----------------------------------------------------------------------------------+-----------------------------------------------------------------------------------+
```

7. Start position out of range
```sql
SELECT count_substrings('éèêëìíîïðñòó éèêëìíîïðñòó', 'éèê', 0), 
       count_substrings('éèêëìíîïðñòó éèêëìíîïðñòó', 'éèê', 30);
```
```text
+------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------+
| count_substrings('éèêëìíîïðñòó éèêëìíîïðñòó', 'éèê', 0)                            | count_substrings('éèêëìíîïðñòó éèêëìíîïðñòó', 'éèê', 30)                            |
+------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------+
|                                                                                  0 |                                                                                   0 |
+------------------------------------------------------------------------------------+-------------------------------------------------------------------------------------+
```