---
{
    "title": "SOUNDEX",
    "language": "en"
}
---

## Description

The SOUNDEX function computes the [Soundex encoding](https://en.wikipedia.org/wiki/Soundex) of a string. Soundex is a phonetic algorithm that encodes English words into codes representing their pronunciation, so words with similar pronunciation will have the same encoding.

Encoding rule: Returns a 4-character code consisting of one uppercase letter followed by three digits (e.g., S530).

## Syntax

```sql
SOUNDEX(<expr>)
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<expr>` | The string to compute Soundex encoding for (only supports ASCII characters). Type: VARCHAR |

## Return Value

Returns VARCHAR(4) type, representing the Soundex encoding of the string.

Special cases:
- If the argument is NULL, returns NULL
- If the string is empty or contains no letters, returns an empty string
- Only processes ASCII letters, ignoring other characters
- Non-ASCII characters will cause the function to throw an error

## Examples

1. Basic usage: word encoding
```sql
SELECT soundex('Doris');
```
```text
+------------------+
| soundex('Doris') |
+------------------+
| D620             |
+------------------+
```

2. Words with similar pronunciation have the same encoding
```sql
SELECT soundex('Smith'), soundex('Smyth');
```
```text
+------------------+------------------+
| soundex('Smith') | soundex('Smyth') |
+------------------+------------------+
| S530             | S530             |
+------------------+------------------+
```

3. Empty string processing
```sql
SELECT soundex('');
```
```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```

4. NULL value handling

```sql
SELECT soundex(NULL);
```

```text
+---------------+
| soundex(NULL) |
+---------------+
| NULL          |
+---------------+
```

5. Empty string returns empty string

```sql
SELECT soundex('');
```

```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```

6. Non-letter characters only return empty string

```sql
SELECT soundex('123@*%');
```

```text
+-------------------+
| soundex('123@*%') |
+-------------------+
|                   |
+-------------------+
```

7. Ignoring non-letter characters

```sql
SELECT soundex('R@b-e123rt'), soundex('Robert');
```

```text
+-----------------------+-------------------+
| soundex('R@b-e123rt') | soundex('Robert') |
+-----------------------+-------------------+
| R163                  | R163              |
+-----------------------+-------------------+
```

9. Non-ASCII characters only error example

```sql
SELECT soundex('你好');  
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Not Supported: Not Supported: soundex only supports ASCII, but got: 你
```

```sql
SELECT soundex('Apache Doris 你好');
```

```text
+--------------------------------+
| soundex('Apache Doris 你好')   |
+--------------------------------+
| A123                           |
+--------------------------------+
```

### Keywords

    SOUNDEX
