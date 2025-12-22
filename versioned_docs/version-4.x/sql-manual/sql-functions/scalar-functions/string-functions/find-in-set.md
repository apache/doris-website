---
{
    "title": "FIND_IN_SET",
    "language": "en",
    "description": "Returns the position of the first occurrence of string str in the comma-separated string list strlist (counting starts from 1)."
}
---

## Description

Returns the position of the first occurrence of string str in the comma-separated string list strlist (counting starts from 1). This function is implemented in MySQL-compatible mode and is used to find specific strings in comma-separated value lists.

## Syntax

```sql
FIND_IN_SET(<str>, <strlist>)
```

## Parameters

| Parameter | Description |
|-------------|----------|
| `<str>`     | The target string to search for. Type: VARCHAR |
| `<strlist>` | The comma-separated string list to search in for str. Type: VARCHAR |

## Return Value

Returns INT type, representing the position of str in strlist (counting starts from 1).

Search rules:
- Exact match: Returns position only when str exactly matches a substring in strlist
- Position counting starts from 1
- Returns the position of the first match

Special cases:
- If str is an empty string, returns 0
- If strlist is an empty string, returns 0
- If no match is found, returns 0
- If any parameter is NULL, returns NULL
- If str contains a comma, it cannot be matched correctly (because comma is the delimiter)
- Matching is case-sensitive

## Examples

1. Basic search
```sql
SELECT FIND_IN_SET('b', 'a,b,c');
```
```text
+---------------------------+
| FIND_IN_SET('b', 'a,b,c') |
+---------------------------+
|                         2 |
+---------------------------+
```

2. Find first element
```sql
SELECT FIND_IN_SET('apple', 'apple,banana,cherry');
```
```text
+------------------------------------------+
| FIND_IN_SET('apple', 'apple,banana,cherry') |
+------------------------------------------+
|                                        1 |
+------------------------------------------+
```

3. Find last element
```sql
SELECT FIND_IN_SET('cherry', 'apple,banana,cherry');
```
```text
+-------------------------------------------+
| FIND_IN_SET('cherry', 'apple,banana,cherry') |
+-------------------------------------------+
|                                         3 |
+-------------------------------------------+
```

4. No match found
```sql
SELECT FIND_IN_SET('orange', 'apple,banana,cherry');
```
```text
+--------------------------------------------+
| FIND_IN_SET('orange', 'apple,banana,cherry') |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+
```

5. NULL value handling
```sql
SELECT FIND_IN_SET(NULL, 'a,b,c'), FIND_IN_SET('b', NULL);
```
```text
+---------------------------+-------------------------+
| FIND_IN_SET(NULL, 'a,b,c') | FIND_IN_SET('b', NULL) |
+---------------------------+-------------------------+
|                      NULL |                    NULL |
+---------------------------+-------------------------+
```

6. Empty string handling
```sql
SELECT FIND_IN_SET('', 'a,b,c'), FIND_IN_SET('a', '');
```
```text
+-------------------------+-----------------------+
| FIND_IN_SET('', 'a,b,c') | FIND_IN_SET('a', '') |
+-------------------------+-----------------------+
|                       0 |                     0 |
+-------------------------+-----------------------+
```

7. String containing comma (cannot match correctly)
```sql
SELECT FIND_IN_SET('a,b', 'a,b,c,d');
```
```text
+------------------------------+
| FIND_IN_SET('a,b', 'a,b,c,d') |
+------------------------------+
|                            0 |
+------------------------------+
```

8. Case-sensitive matching
```sql
SELECT FIND_IN_SET('B', 'a,b,c'), FIND_IN_SET('b', 'A,B,C');
```
```text
+---------------------------+---------------------------+
| FIND_IN_SET('B', 'a,b,c') | FIND_IN_SET('b', 'A,B,C') |
+---------------------------+---------------------------+
|                         0 |                         0 |
+---------------------------+---------------------------+
```

9. Partial match will not succeed
```sql
SELECT FIND_IN_SET('ap', 'apple,banana,cherry');
```
```text
+---------------------------------------+
| FIND_IN_SET('ap', 'apple,banana,cherry') |
+---------------------------------------+
|                                     0 |
+---------------------------------------+
```

10. Numeric string search
```sql
SELECT FIND_IN_SET('2', '1,2,3,10,20');
```
```text
+--------------------------------+
| FIND_IN_SET('2', '1,2,3,10,20') |
+--------------------------------+
|                              2 |
+--------------------------------+
```
