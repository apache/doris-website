---
{
    "title": "TO_BITMAP",
    "language": "en",
    "description": "Converts an unsigned bigint to a Bitmap."
}
---

## Description

Converts an unsigned bigint to a Bitmap.

The input is an unsigned bigint with a value in the range 0 to 18446744073709551615, and the output is a Bitmap containing that element.

## Syntax

```sql
TO_BITMAP(<expr>)
```

## Parameters

| Parameter | Description                                        |
|-----------|----------------------------------------------------|
| `<expr>`  | An unsigned bigint with a range of 0 to 18446744073709551615 |

## Return Value

A Bitmap containing the corresponding bigint.  
Returns `NULL` if the input value is not within the specified range.

## Examples

To convert an integer to a Bitmap and count the number of elements in the Bitmap:

```sql
select bitmap_count(to_bitmap(10));
```

The result will be:

```text
+-----------------------------+
| bitmap_count(to_bitmap(10)) |
+-----------------------------+
|                           1 |
+-----------------------------+
```

To convert a negative integer to a Bitmap, which is outside the valid range, and convert it to a string:

```sql
select bitmap_to_string(to_bitmap(-1));
```

The result will be:

```text
+---------------------------------+
| bitmap_to_string(to_bitmap(-1)) |
+---------------------------------+
|                                 |
+---------------------------------+
```
