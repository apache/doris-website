---
{
    "title": "BITMAP_SUBSET_IN_RANGE",
    "language": "en",
    "description": "Returns a subset of the Bitmap within the specified range (excluding the range end)."
}
---

## Description

Returns a subset of the Bitmap within the specified range (excluding the range end).

## Syntax

```sql
BITMAP_SUBSET_IN_RANGE(<bitmap>, <range_start_include>, <range_end_exclude>)
```

## Parameters

| Parameter             | Description                   |
|-----------------------|-------------------------------|
| `<bitmap>`            | The Bitmap value              |
| `<range_start_include>` | The start of the range (inclusive) |
| `<range_end_exclude>`   | The end of the range (exclusive)   |

## Return Value

A subset Bitmap within the specified range.
- If the parameter has a NULL value or invalid range, it returns NULL

## Examples

To get a subset of a Bitmap within the range 0 to 9:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 0, 9)) value;
```

The result will be:

```text
+-----------+
| value     |
+-----------+
| 1,2,3,4,5 |
+-----------+
```

To get a subset of a Bitmap within the range 2 to 3:

```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, 3)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| 2     |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, NULL)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```


```sql
select bitmap_to_string(bitmap_subset_in_range(bitmap_from_string('1,2,3,4,5'), 2, -10000)) value;
```

The result will be:

```text
+-------+
| value |
+-------+
| NULL  |
+-------+
```

