---
{
    "title": "DAMERAU_LEVENSHTEIN_DISTANCE",
    "language": "en",
    "description": "The DAMERAU_LEVENSHTEIN_DISTANCE function calculates the Damerau-Levenshtein edit distance between two strings."
}
---

## Description

The `DAMERAU_LEVENSHTEIN_DISTANCE` function calculates the [Damerau-Levenshtein edit distance](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance) between two strings.

The Damerau-Levenshtein edit distance is the minimum number of single-character edits required to transform one string into another. Supported edit operations include:

- Insert a character
- Delete a character
- Substitute a character
- Transpose two adjacent characters

Compared with `LEVENSHTEIN`, `DAMERAU_LEVENSHTEIN_DISTANCE` treats adjacent character transposition as a single edit operation, so it is more suitable for handling input errors caused by reversed character order. For example, `abcd` and `abdc` only require transposing the adjacent `c` and `d`, so the Damerau-Levenshtein distance is 1, while the Levenshtein distance is 2.

This function calculates distance by UTF-8 characters, not by bytes. Therefore, multibyte characters such as Chinese characters are treated as one character.

## Syntax

```sql
DAMERAU_LEVENSHTEIN_DISTANCE(<str1>, <str2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str1>` | The first string. Type: VARCHAR |
| `<str2>` | The second string. Type: VARCHAR |

## Return Value

Returns an INT value representing the Damerau-Levenshtein edit distance between the two strings.

Special cases:

- If any argument is NULL, returns NULL.
- If the two strings are identical, returns 0.
- If one string is empty, returns the character count of the other string.
- This function is commutative, meaning `DAMERAU_LEVENSHTEIN_DISTANCE(a, b)` and `DAMERAU_LEVENSHTEIN_DISTANCE(b, a)` return the same result.
- If the input is too large and causes the internal distance matrix to exceed the limit, the function returns an error.

## Examples

1. Basic usage

```sql
SELECT damerau_levenshtein_distance('kitten', 'sitting');
```

```text
+---------------------------------------------------+
| damerau_levenshtein_distance('kitten', 'sitting') |
+---------------------------------------------------+
|                                                 3 |
+---------------------------------------------------+
```

2. Adjacent character transposition

```sql
SELECT damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+----------------------------------------------+
| damerau_levenshtein_distance('abcd', 'abdc') |
+----------------------------------------------+
|                                            1 |
+----------------------------------------------+
```

`abcd` can be transformed into `abdc` by transposing the adjacent `c` and `d`, so the distance is 1.

3. Difference from `LEVENSHTEIN`

```sql
SELECT levenshtein('abcd', 'abdc'), damerau_levenshtein_distance('abcd', 'abdc');
```

```text
+-----------------------------+----------------------------------------------+
| levenshtein('abcd', 'abdc') | damerau_levenshtein_distance('abcd', 'abdc') |
+-----------------------------+----------------------------------------------+
|                           2 |                                            1 |
+-----------------------------+----------------------------------------------+
```

`LEVENSHTEIN` does not support transposition, so it requires 2 edits. `DAMERAU_LEVENSHTEIN_DISTANCE` supports adjacent transposition, so it only requires 1 edit.

4. UTF-8 characters

```sql
SELECT damerau_levenshtein_distance('你好', '好你');
```

```text
+--------------------------------------------------+
| damerau_levenshtein_distance('你好', '好你')     |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```

`你` and `好` are two UTF-8 characters, and transposing adjacent characters requires 1 edit.

5. Insert, delete, and substitute

```sql
SELECT
    damerau_levenshtein_distance('', 'abc'),
    damerau_levenshtein_distance('数据库', '数据'),
    damerau_levenshtein_distance('flaw', 'lawn');
```

```text
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
| damerau_levenshtein_distance('', 'abc') | damerau_levenshtein_distance('数据库', '数据')      | damerau_levenshtein_distance('flaw', 'lawn') |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
|                                       3 |                                                   1 |                                            2 |
+-----------------------------------------+-----------------------------------------------------+----------------------------------------------+
```

6. Full Damerau-Levenshtein distance example

```sql
SELECT damerau_levenshtein_distance('CA', 'ABC');
```

```text
+-------------------------------------------+
| damerau_levenshtein_distance('CA', 'ABC') |
+-------------------------------------------+
|                                         2 |
+-------------------------------------------+
```

This function calculates the full Damerau-Levenshtein distance. For `CA` and `ABC`, the minimum edit distance is 2.

7. NULL arguments

```sql
SELECT damerau_levenshtein_distance(NULL, 'abc'), damerau_levenshtein_distance('abc', NULL);
```

```text
+-------------------------------------------+-------------------------------------------+
| damerau_levenshtein_distance(NULL, 'abc') | damerau_levenshtein_distance('abc', NULL) |
+-------------------------------------------+-------------------------------------------+
|                                      NULL |                                      NULL |
+-------------------------------------------+-------------------------------------------+
```

8. Input too large

```sql
SELECT damerau_levenshtein_distance(repeat('a', 4096), repeat('b', 4096));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]damerau_levenshtein_distance distance matrix is too large: 16793604 cells exceeds limit 16777216
```
