---
{
    "title": "BITMAP_MIN",
    "language": "en",
    "description": "Computes and returns the minimum value in a Bitmap."
}
---

## Description

Computes and returns the minimum value in a Bitmap.

## Syntax

```sql
BITMAP_MIN(<bitmap>)
```

## Parameters

| Parameter  | Description                     |
|------------|---------------------------------|
| `<bitmap>` | A Bitmap type column or expression |

## Return Value

The minimum value in the Bitmap.  
Returns `NULL` if the Bitmap is empty or is NULL value.

## Examples

To compute the minimum value in an empty Bitmap:

```sql
select bitmap_min(bitmap_from_string('')) value;
```

The result will be:

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```

To compute the minimum value in a Bitmap with multiple elements:

```sql
select bitmap_min(bitmap_from_string('1,9999999999')) value;
```

The result will be:

```text
+-------+
| value |
+-------+
|     1 |
+-------+
```

```sql
select bitmap_min(bitmap_empty()) res1,bitmap_min(NULL) res2;
```

The result will be:

```text
+------+------+
| res1 | res2 |
+------+------+
| NULL | NULL |
+------+------+
```
