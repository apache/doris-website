---
{
    "title": "NGRAM_SEARCH",
    "language": "en",
    "description": "The NGRAMSEARCH function calculates the N-gram similarity between two strings. The similarity ranges from 0 to 1,"
}
---

## Description

The NGRAM_SEARCH function calculates the N-gram similarity between two strings. The similarity ranges from 0 to 1, where higher values indicate more similar strings.

N-gram decomposes a string into a set of consecutive N characters. The similarity calculation formula is: `2 * |intersection| / (|set1| + |set2|)`

Only ASCII characters are supported.

## Syntax

```sql
NGRAM_SEARCH(<text>, <pattern>, <gram_num>)
```

## Parameters

| Parameter | Description |
| ------------ | ----------------------------------------- |
| `<text>` | The text string to compare. Type: VARCHAR |
| `<pattern>` | Pattern string (must be constant). Type: VARCHAR |
| `<gram_num>` | The N value for N-gram (must be constant). Type: INT |

## Return Value

Returns DOUBLE type, the N-gram similarity between the two strings (between 0 and 1).

Special cases:
- If any parameter is NULL, returns NULL
- If string length is less than `<gram_num>`, returns 0
- `<pattern>` and `<gram_num>` must be constants
- Similarity of 1 does not necessarily mean strings are completely identical

## Examples

1. Basic usage: Calculate similarity
```sql
SELECT ngram_search('123456789', '12345', 3);
```
```text
+---------------------------------------+
| ngram_search('123456789', '12345', 3) |
+---------------------------------------+
|                                   0.6 |
+---------------------------------------+
```

2. High similarity example
```sql
SELECT ngram_search('abababab', 'babababa', 2);
```
```text
+-----------------------------------------+
| ngram_search('abababab', 'babababa', 2) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

3. String too short returns 0
```sql
SELECT ngram_search('ab', 'abc', 3);
```
```text
+----------------------------------+
| ngram_search('ab', 'abc', 3)     |
+----------------------------------+
|                                0 |
+----------------------------------+
```

4. NULL value handling
```sql
SELECT ngram_search(NULL, 'test', 2);
```
```text
+--------------------------------+
| ngram_search(NULL, 'test', 2)  |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

### Keywords

    NGRAM_SEARCH,NGRAM,SEARCH
