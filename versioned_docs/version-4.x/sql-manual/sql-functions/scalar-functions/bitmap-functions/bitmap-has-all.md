---
{
    "title": "BITMAP_HAS_ALL",
    "language": "en"
}
---

## Description

Determines whether one Bitmap contains all the elements of another Bitmap.

## Syntax

```sql
BITMAP_HAS_ALL(<bitmap1>, <bitmap2>)
```

## Parameters

| Parameter   | Description       |
|-------------|-------------------|
| `<bitmap1>` | The first Bitmap  |
| `<bitmap2>` | The second Bitmap |

## Return Value

Returns `true` if `<bitmap1>` contains all the elements of `<bitmap2>`;  
Returns `true` if `<bitmap2>` contains no elements;  
Otherwise, returns `false`.
- If the parameter has a NULL value, it returns NULL

## Examples

To check if one Bitmap contains all elements of another Bitmap:

```sql
select bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) as res;
```

The result will be:

```text
+------+
| res  |
+------+
|    1 |
+------+
```

To check if an empty Bitmap contains all elements of another Bitmap:

```sql
select bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) as res;
```

The result will be:

```text
+------+
| res  |
+------+
|    0 |
+------+
```


```sql
select bitmap_has_all(bitmap_empty(), NULL) as res;
```

The result will be:

```text
+------+
| res  |
+------+
| NULL |
+------+
```
