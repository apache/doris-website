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
| `<expr>`  | An unsigned bigint or numbers represented as strings with a range of 0 to 18446744073709551615 |

## Return Value

A Bitmap containing the corresponding bigint.  
Returns empty bitmap if the input value is not within the specified range.

## Examples

To convert an integer to a Bitmap and count the number of elements in the Bitmap:

```sql
select bitmap_to_string(to_bitmap(10)),bitmap_count(to_bitmap(10));
```

The result will be:

```text
+---------------------------------+-----------------------------+
| bitmap_to_string(to_bitmap(10)) | bitmap_count(to_bitmap(10)) |
+---------------------------------+-----------------------------+
| 10                              |                           1 |
+---------------------------------+-----------------------------+
```

```sql
select bitmap_to_string(to_bitmap("123")),bitmap_count(to_bitmap("123"));
```

The result will be:

```text
+------------------------------------+--------------------------------+
| bitmap_to_string(to_bitmap("123")) | bitmap_count(to_bitmap("123")) |
+------------------------------------+--------------------------------+
| 123                                |                              1 |
+------------------------------------+--------------------------------+
```

To convert a negative integer to a Bitmap, which is outside the valid range, and convert it to a string:

```sql
select bitmap_to_string(to_bitmap(-1)),bitmap_count(to_bitmap(-1));
```

The result will be:

```text
+---------------------------------+-----------------------------+
| bitmap_to_string(to_bitmap(-1)) | bitmap_count(to_bitmap(-1)) |
+---------------------------------+-----------------------------+
|                                 |                           0 |
+---------------------------------+-----------------------------+
```

```sql
select bitmap_to_string(to_bitmap("123ABC")),bitmap_count(to_bitmap("123ABC"));
```

The result will be:

```text
+---------------------------------------+-----------------------------------+
| bitmap_to_string(to_bitmap("123ABC")) | bitmap_count(to_bitmap("123ABC")) |
+---------------------------------------+-----------------------------------+
|                                       |                                 0 |
+---------------------------------------+-----------------------------------+
```


```sql
select bitmap_to_string(to_bitmap(NULL)),bitmap_count(to_bitmap(NULL));
```

The result will be:

```text
+-----------------------------------+-------------------------------+
| bitmap_to_string(to_bitmap(NULL)) | bitmap_count(to_bitmap(NULL)) |
+-----------------------------------+-------------------------------+
|                                   |                             0 |
+-----------------------------------+-------------------------------+
```