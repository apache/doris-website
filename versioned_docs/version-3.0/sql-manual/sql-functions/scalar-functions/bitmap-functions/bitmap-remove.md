---
{
    "title": "BITMAP_REMOVE",
    "language": "en"
}
---

## Description

Removes a specified value from a Bitmap column.

## Syntax

```sql
BITMAP_REMOVE(<bitmap>, <value>)
```

## Parameters

| Parameter   | Description    |
|-------------|----------------|
| `<bitmap>`  | The Bitmap value |
| `<value>`   | The value to remove |

## Return Value

Returns the Bitmap after removing the specified value.

Returns the original Bitmap if the value to be removed does not exist;  
Returns `NULL` if the value to be removed is `NULL`.

## Examples

To remove a value from a Bitmap:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```

The result will be:

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

To remove a `NULL` value from a Bitmap:

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```

The result will be:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
