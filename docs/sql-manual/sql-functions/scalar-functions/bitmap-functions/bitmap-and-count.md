---
{
    "title": "BITMAP_AND_COUNT",
    "language": "en"
}
---

## Description

Computes the intersection of two or more input BITMAPs and returns the number of intersections.

## Syntax

```sql
BITMAP_AND_COUNT(<bitmap>, <bitmap>,[, <bitmap>...])
```

## Parameters

| Parameter  | Description                                                    |
|------------|----------------------------------------------------------------|
| `<bitmap>` | One of the original BITMAPs whose intersection is being sought |

## Return Value

Returns an integer
- If the parameter has a NULL value, it returns 0

## Examples

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    2 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty()) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

