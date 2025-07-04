---
{
    "title": "BITMAP_MAX",
    "language": "en"
}
---

## Description

Computes and returns the maximum value in a Bitmap.

## Syntax

```sql
BITMAP_MAX(<bitmap>)
```

## Parameters

| Parameter  | Description                     |
|------------|---------------------------------|
| `<bitmap>` | A Bitmap type column or expression |

## Return Value

The maximum value in the Bitmap.  
Returns `NULL` if the Bitmap is empty.

## Examples

To compute the maximum value in an empty Bitmap:

```sql
select bitmap_max(bitmap_from_string('')) value;
```

The result will be:

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```

To compute the maximum value in a Bitmap with multiple elements:

```sql
select bitmap_max(bitmap_from_string('1,9999999999')) value;
```

The result will be:

```text
+------------+
| value      |
+------------+
| 9999999999 |
+------------+
```
