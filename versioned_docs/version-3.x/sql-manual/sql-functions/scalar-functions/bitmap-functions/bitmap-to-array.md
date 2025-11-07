---
{
    "title": "BITMAP_TO_ARRAY",
    "language": "en"
}
---

## Description

Converts a Bitmap into an Array.

## Syntax

```sql
BITMAP_TO_ARRAY(<bitmap>)
```

## Parameters

| Parameter  | Description                     |
|------------|---------------------------------|
| `<bitmap>` | A Bitmap type column or expression |

## Return Value

An array containing all the bit positions in the Bitmap.  
Returns `NULL` if the Bitmap is `NULL`.

## Examples

To convert a `NULL` Bitmap to an array:

```sql
select bitmap_to_array(null);
```

The result will be:

```text
+------------------------+
| bitmap_to_array(NULL)  |
+------------------------+
| NULL                   |
+------------------------+
```

To convert an empty Bitmap to an array:

```sql
select bitmap_to_array(bitmap_empty());
```

The result will be:

```text
+---------------------------------+
| bitmap_to_array(bitmap_empty()) |
+---------------------------------+
| []                              |
+---------------------------------+
```

To convert a Bitmap with a single element to an array:

```sql
select bitmap_to_array(to_bitmap(1));
```

The result will be:

```text
+-------------------------------+
| bitmap_to_array(to_bitmap(1)) |
+-------------------------------+
| [1]                           |
+-------------------------------+
```

To convert a Bitmap with multiple elements to an array:

```sql
select bitmap_to_array(bitmap_from_string('1,2,3,4,5'));
```

The result will be:

```text
+--------------------------------------------------+
| bitmap_to_array(bitmap_from_string('1,2,3,4,5')) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                  |
+--------------------------------------------------+
```
