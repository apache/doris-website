---
{
    "title": "BITMAP_HASH64",
    "language": "en",
    "description": "Computes the 64-bit hash value of any input type and returns a Bitmap containing that hash value."
}
---

## Description

Computes the 64-bit hash value of any input type and returns a Bitmap containing that hash value.

## Syntax

```sql
BITMAP_HASH64(<expr>)
```

## Parameters

| Parameter | Description           |
|-----------|-----------------------|
| `<expr>`  | Any value or field expression |

## Return Value

Returns a Bitmap containing the 64-bit hash value of the parameter `<expr>`.
- If the parameter has a NULL value, it returns Empty Bitmap

## Examples

To compute the 64-bit hash of a value, you can use:

```sql
select bitmap_to_string(bitmap_hash64('hello'));
```

The result will be:

```text
+------------------------------------------+
| bitmap_to_string(bitmap_hash64('hello')) |
+------------------------------------------+
| 15231136565543391023                     |
+------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_hash64(NULL));
```

The result will be:

```text
+---------------------------------------+
| bitmap_to_string(bitmap_hash64(NULL)) |
+---------------------------------------+
|                                       |
+---------------------------------------+
```