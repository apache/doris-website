---
{
    "title": "BITMAP_CONTAINS",
    "language": "en"
}
---

## Description

Calculates whether the input value is in the BITMAP and returns a boolean value.

## Syntax

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```

## Parameters

| Parameter  | Description                             |
|------------|-----------------------------------------|
| `<bitmap>` | BITMAP collection                       |
| `<bitint>` | The integer to be checked for existence |

## Return Value

Returns a boolean
- If the parameter is NULL, returns NULL

## Examples

```sql
select bitmap_contains(to_bitmap(1),2) cnt1, bitmap_contains(to_bitmap(1),1) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
|    0 |    1 |
+------+------+
```

```sql
select bitmap_contains(NULL,2) cnt1, bitmap_contains(to_bitmap(1),NULL) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
| NULL | NULL |
+------+------+
```
