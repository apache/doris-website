---
{
    "title": "BITMAP_TO_STRING",
    "language": "en",
    "description": "Converts a Bitmap into a comma-separated string containing all the set bit positions."
}
---

## Description

Converts a Bitmap into a comma-separated string containing all the set bit positions.

## Syntax

```sql
BITMAP_TO_STRING(<bitmap>)
```

## Parameters

| Parameter  | Description                     |
|------------|---------------------------------|
| `<bitmap>` | A Bitmap type column or expression |

## Return Value

A string containing all the set bit positions in the Bitmap, separated by commas.  
Returns `NULL` if the Bitmap is `NULL`.

## Examples

To convert a `NULL` Bitmap to a string:

```sql
select bitmap_to_string(null);
```

The result will be:

```text
+------------------------+
| bitmap_to_string(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

To convert an empty Bitmap to a string:

```sql
select bitmap_to_string(bitmap_empty());
```

The result will be:

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

To convert a Bitmap with a single element to a string:

```sql
select bitmap_to_string(to_bitmap(1));
```

The result will be:

```text
+--------------------------------+
| bitmap_to_string(to_bitmap(1)) |
+--------------------------------+
| 1                              |
+--------------------------------+
```

To convert a Bitmap with multiple elements to a string:

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
```

The result will be:

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
| 1,2                                                     |
+---------------------------------------------------------+
```
