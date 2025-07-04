---
{
    "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
    "language": "en"
}
---

## Description

Perform a NOT operation on two BITMAPs and return the result. The first input parameter is called `base BITMAP` and the second is called `exclude BITMAP`.

## Alias

- BITMAP_ANDNOT

## Syntax

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description                      |
|-------------|----------------------------------|
| `<bitmap1>` | `Base BITMAP` to be negated      |
| `<bitmap2>` | `Exclusion BITMAP` to be negated |

## Return Value

Returns a BITMAP.
- If the parameter has a null value, returns NULL

## Examples

```sql
select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
```

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')));
```

```text
+--------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'))) |
+--------------------------------------------------------------------------------------------+
| 1,2                                                                                        |
+--------------------------------------------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty()));
```

```text
+-------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_empty())) |
+-------------------------------------------------------------------------------+
| 1,2,3                                                                         |
+-------------------------------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL));
```

```text
+---------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), NULL)) |
+---------------------------------------------------------------------+
| NULL                                                                |
+---------------------------------------------------------------------+
```
