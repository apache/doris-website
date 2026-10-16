---
{
    "title": "MULTI_MATCH_ANY",
    "language": "en",
    "description": "Checks whether a string matches any regular expression in an array."
}
---

<a id="multi_match_any"></a>

## Description

Checks whether `<haystack>` matches any regular expression in `<patterns>`. Matching is case-sensitive by default. Returns `0` rather than `NULL` when either argument is `NULL`.

## Syntax

```sql
MULTI_MATCH_ANY(<haystack>, <patterns>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<haystack>` | Input string, of type `STRING`. |
| `<patterns>` | Regular expressions, of type `ARRAY<STRING>`. Pattern elements should be non-NULL strings. |

## Return Value

Returns `TINYINT`: `1` when any expression matches, otherwise `0`. Returns `0` for an empty pattern array and when either argument is `NULL`.

This function uses the Hyperscan/VectorScan regular expression engine. Invalid or unsupported patterns raise an error. A constant input string cannot be combined with a non-constant pattern-array column; that combination raises an argument error.

## Example {#example}

```sql
SELECT multi_match_any('Hello, World!', ['hello', '!', 'world']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', ['A', 'bcd']) AS matched;
```

```text
0
```

Regular expressions perform pattern matching rather than literal substring searches:

```sql
SELECT multi_match_any('abc123', ['[0-9]+', '^xyz']) AS matched;
```

```text
1
```

```sql
SELECT multi_match_any('abc', CAST([] AS ARRAY<STRING>)) AS empty_patterns,
       multi_match_any(CAST(NULL AS STRING), ['a']) AS null_text,
       multi_match_any('abc', CAST(NULL AS ARRAY<STRING>)) AS null_patterns;
```

```text
0    0    0
```

## keywords

MULTI_MATCH, MATCH, ANY
