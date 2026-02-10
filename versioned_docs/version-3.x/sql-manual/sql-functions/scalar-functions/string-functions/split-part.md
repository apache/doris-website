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

```sql
select split_part("hello world", " ", 1);
```

```text
+----------------------------------+
| split_part('hello world', ' ', 1) |
+----------------------------------+
| hello                            |
+----------------------------------+
```

```sql
SELECT split_part('apple,banana,cherry', ',', 0);
```

```text
+-------------------------------------------+
| split_part('apple,banana,cherry', ',', 0) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```
