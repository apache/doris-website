---
{
    "title": "BITMAP_COUNT",
    "language": "en"
}
---

## Description

Count the number of elements in the input BITMAP

## Syntax

```sql
BITMAP_COUNT(<bitmap>)
```

## Parameters

| Parameter  | Description |
|------------|-------------|
| `<bitmap>` | a BITMAP    |

## Return Value

Returns an integer

## Examples

```sql
select bitmap_count(to_bitmap(1)) cnt;
```

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

