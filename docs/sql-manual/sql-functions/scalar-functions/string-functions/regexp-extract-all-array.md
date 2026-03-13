---
{
    "title": "REGEXP_EXTRACT_ALL_ARRAY",
    "language": "en",
    "description": "Extracts all matches of the first capturing group as a string array."
}
---

<version since="dev">

</version>

## Description

Extracts every non-overlapping match of the first capturing group in `<pattern>` from `<str>`, returning a string array in match order. Returns `NULL` if either argument is `NULL`.

## Syntax

```sql
REGEXP_EXTRACT_ALL_ARRAY(<str>, <pattern>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<str>` | Input string, of type `STRING`. |
| `<pattern>` | Regular expression, of type `STRING`. The first capturing group is extracted; a third group-index argument is not supported. |

## Return Value

Returns `ARRAY<STRING>`. Returns an empty array `[]` if there is no match or no capturing group. Returns `NULL` if either argument is `NULL`. An invalid regular expression raises an error.

The default engine uses RE2 syntax and case-sensitive matching. The session variable `enable_extended_regex` enables advanced regular expression features; see [REGEXP_EXTRACT_ALL](./regexp-extract-all.md). This function returns an array, while `REGEXP_EXTRACT_ALL` returns a formatted string.

## Example

```sql
SELECT regexp_extract_all_array('id=12,id=34', 'id=([0-9]+)') AS result;
```

```text
["12", "34"]
```

Use `(?i)` for case-insensitive matching:

```sql
SELECT regexp_extract_all_array('Hello hello HELLO', '(?i)(hello)') AS result;
```

```text
["Hello", "hello", "HELLO"]
```

```sql
SELECT regexp_extract_all_array('abc', '([0-9]+)') AS no_match,
       regexp_extract_all_array('abc', 'abc') AS no_capture_group;
```

```text
[]    []
```

```sql
SELECT regexp_extract_all_array(NULL, '(a)') AS null_input,
       regexp_extract_all_array('a', NULL) AS null_pattern;
```

```text
NULL    NULL
```

The result can be passed directly to array functions:

```sql
SELECT array_size(regexp_extract_all_array('a1b2', '([0-9])')) AS matches;
```

```text
2
```
