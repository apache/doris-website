---
{
    "title": "SPLIT_PART",
    "language": "en",
    "description": "The SPLITPART function splits a string into multiple parts according to the specified separator and return one of the parts."
}
---

## Description

The SPLIT_PART function splits a string into multiple parts according to the specified separator and return one of the parts.

## Syntax

```sql
SPLIT_PART ( <str>, <separator>, <part_index> )
```

## Parameters

| Parameter      | Description                                           |
|----------------|-------------------------------------------------------|
| `<str>`        | The string to be split                                |
| `<separator>`  | The string used for splitting                         |
| `<part_index>` | The index of the part to be returned. Starting from 1 |

## Return Value

Returns the specified part of the string split according to the delimiter. Special cases:

- If any of the parameters is NULL, NULL is returned.
- When `<part_index>` is 0, NULL is returned.

## Examples

1. Basic string splitting
```sql
SELECT SPLIT_PART('hello world', ' ', 1);
```
```text
+----------------------------------+
| SPLIT_PART('hello world', ' ', 1) |
+----------------------------------+
| hello                            |
+----------------------------------+
```

2. Get second part
```sql
SELECT SPLIT_PART('apple,banana,cherry', ',', 2);
```
```text
+-------------------------------------------+
| SPLIT_PART('apple,banana,cherry', ',', 2) |
+-------------------------------------------+
| banana                                    |
+-------------------------------------------+
```

3. Index is 0 (returns NULL)
```sql
SELECT SPLIT_PART('apple,banana,cherry', ',', 0);
```
```text
+-------------------------------------------+
| SPLIT_PART('apple,banana,cherry', ',', 0) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

4. Negative index (count from end)
```sql
SELECT SPLIT_PART('apple,banana,cherry', ',', -1), SPLIT_PART('apple,banana,cherry', ',', -2);
```
```text
+--------------------------------------------+--------------------------------------------+
| SPLIT_PART('apple,banana,cherry', ',', -1) | SPLIT_PART('apple,banana,cherry', ',', -2) |
+--------------------------------------------+--------------------------------------------+
| cherry                                     | banana                                     |
+--------------------------------------------+--------------------------------------------+
```

5. Index out of range
```sql
SELECT SPLIT_PART('apple,banana', ',', 5), SPLIT_PART('apple,banana', ',', -5);
```
```text
+-----------------------------------+------------------------------------+
| SPLIT_PART('apple,banana', ',', 5) | SPLIT_PART('apple,banana', ',', -5) |
+-----------------------------------+------------------------------------+
|                                   |                                    |
+-----------------------------------+------------------------------------+
```

6. NULL value handling
```sql
SELECT SPLIT_PART(NULL, ',', 1), SPLIT_PART('test', NULL, 1), SPLIT_PART('test', ',', NULL);
```
```text
+---------------------------+-----------------------------+-------------------------------+
| SPLIT_PART(NULL, ',', 1)  | SPLIT_PART('test', NULL, 1) | SPLIT_PART('test', ',', NULL) |
+---------------------------+-----------------------------+-------------------------------+
| NULL                      | NULL                        | NULL                          |
+---------------------------+-----------------------------+-------------------------------+
```

7. Empty string handling
```sql
SELECT SPLIT_PART('', ',', 1), SPLIT_PART('test', '', 2);
```
```text
+------------------------+---------------------------+
| SPLIT_PART('', ',', 1) | SPLIT_PART('test', '', 2) |
+------------------------+---------------------------+
| NULL                   |                           |
+------------------------+---------------------------+
```

8. Separator doesn't exist
```sql
SELECT SPLIT_PART('hello world', '|', 1), SPLIT_PART('hello world', '|', 2);
```
```text
+-----------------------------------+-----------------------------------+
| SPLIT_PART('hello world', '|', 1) | SPLIT_PART('hello world', '|', 2) |
+-----------------------------------+-----------------------------------+
| NULL                              | NULL                              |
+-----------------------------------+-----------------------------------+
```

9. Consecutive separators
```sql
SELECT SPLIT_PART('a,,c', ',', 1), SPLIT_PART('a,,c', ',', 2), SPLIT_PART('a,,c', ',', 3);
```
```text
+----------------------------+----------------------------+----------------------------+
| SPLIT_PART('a,,c', ',', 1) | SPLIT_PART('a,,c', ',', 2) | SPLIT_PART('a,,c', ',', 3) |
+----------------------------+----------------------------+----------------------------+
| a                          |                            | c                          |
+----------------------------+----------------------------+----------------------------+
```

10. UTF-8 character handling
```sql
SELECT SPLIT_PART('ṭṛì ḍḍumai ṭṛì', ' ', 2);
```
```text
+--------------------------------------+
| SPLIT_PART('ṭṛì ḍḍumai ṭṛì', ' ', 2) |
+--------------------------------------+
| ḍḍumai                               |
+--------------------------------------+
```

### Keywords

    SPLIT_PART, SPLIT
