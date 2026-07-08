---
{
    "title": "LEVENSHTEIN",
    "language": "en",
    "description": "The LEVENSHTEIN function calculates the Levenshtein edit distance between two strings."
}
---

## Description

The `LEVENSHTEIN` function calculates the [Levenshtein edit distance](https://en.wikipedia.org/wiki/Edit_distance) between two strings.

The Levenshtein edit distance is the minimum number of single-character edits required to transform one string into another. Supported edit operations include:

- Insert a character
- Delete a character
- Substitute a character

This function calculates distance by UTF-8 characters, not by bytes. Therefore, multibyte characters such as Chinese characters are treated as one character.

:::note
Since 4.1.3
:::

## Alias

- `LEVENSHTEIN_DISTANCE`
- `EDIT_DISTANCE`

## Syntax

```sql
LEVENSHTEIN(<str1>, <str2>)
LEVENSHTEIN_DISTANCE(<str1>, <str2>)
EDIT_DISTANCE(<str1>, <str2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str1>` | The first string. Type: VARCHAR |
| `<str2>` | The second string. Type: VARCHAR |

## Return Value

Returns an INT value representing the Levenshtein edit distance between the two strings.

Special cases:

- If any argument is NULL, returns NULL.
- If the two strings are identical, returns 0.
- If one string is empty, returns the character count of the other string.
- This function is commutative, meaning `LEVENSHTEIN(a, b)` and `LEVENSHTEIN(b, a)` return the same result.

## Examples

1. Basic usage

```sql
SELECT levenshtein('kitten', 'sitting');
```

```text
+----------------------------------+
| levenshtein('kitten', 'sitting') |
+----------------------------------+
|                                3 |
+----------------------------------+
```

`kitten` can be transformed into `sitting` with 3 edits: substitute `k` with `s`, substitute `e` with `i`, and insert `g` at the end.

2. Identical strings

```sql
SELECT levenshtein('abc', 'abc');
```

```text
+---------------------------+
| levenshtein('abc', 'abc') |
+---------------------------+
|                         0 |
+---------------------------+
```

3. Empty string

```sql
SELECT levenshtein('', 'abc'), levenshtein('数据库', '');
```

```text
+------------------------+------------------------------+
| levenshtein('', 'abc') | levenshtein('数据库', '')    |
+------------------------+------------------------------+
|                      3 |                            3 |
+------------------------+------------------------------+
```

4. UTF-8 characters

```sql
SELECT levenshtein('你好世界', '你好世间');
```

```text
+---------------------------------------------+
| levenshtein('你好世界', '你好世间')         |
+---------------------------------------------+
|                                           1 |
+---------------------------------------------+
```

Replacing `界` with `间` requires 1 edit.

5. Adjacent transposition is counted as two edits

```sql
SELECT levenshtein('abcd', 'abdc');
```

```text
+-----------------------------+
| levenshtein('abcd', 'abdc') |
+-----------------------------+
|                           2 |
+-----------------------------+
```

Levenshtein distance does not treat adjacent character transposition as a single operation, so the distance between `abcd` and `abdc` is 2.

6. Use aliases

```sql
SELECT levenshtein_distance('abcd', 'abdc'), edit_distance('kitten', 'sitting');
```

```text
+--------------------------------------+------------------------------------+
| levenshtein_distance('abcd', 'abdc') | edit_distance('kitten', 'sitting') |
+--------------------------------------+------------------------------------+
|                                    2 |                                  3 |
+--------------------------------------+------------------------------------+
```

7. NULL arguments

```sql
SELECT levenshtein(NULL, 'abc'), levenshtein('abc', NULL);
```

```text
+--------------------------+--------------------------+
| levenshtein(NULL, 'abc') | levenshtein('abc', NULL) |
+--------------------------+--------------------------+
|                     NULL |                     NULL |
+--------------------------+--------------------------+
```
