---
{
    "title": "BITMAP_AND",
    "language": "en"
}
---

## Description

Computes the intersection of two or more input BITMAPs and returns a new BITMAP.

## Syntax

```sql
BITMAP_AND(<bitmap>, <bitmap>,[, <bitmap>...])
```

## Parameters

| Parameter  | Description                                                    |
|------------|----------------------------------------------------------------|
| `<bitmap>` | One of the original BITMAPs whose intersection is being sought |

## Return Value

Returns a BITMAP
- If the parameter has a NULL value, it returns NULL

## Examples

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) as res;
```

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty())) as res;
```

```text
+------+
| res  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
