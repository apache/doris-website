---
{
    "title": "BITMAP_FROM_STRING",
    "language": "en",
    "description": "Convert a string into a BITMAP. The string consists of a group of unsigned bigint numbers separated by commas."
}
---

## Description

Convert a string into a BITMAP. The string consists of a group of unsigned bigint numbers separated by commas. (The number values are between: 0 ~ 18446744073709551615)
For example, the string "0, 1, 2" will be converted into a Bitmap, where the 0th, 1st, and 2nd bits are set. When the input field is invalid, NULL is returned

## Syntax

```sql
 BITMAP_FROM_STRING(<str>)
```

## Parameters

| Parameter | Description                                                                                    |
|-----------|------------------------------------------------------------------------------------------------|
| `<str>`   | Array string, for example "0, 1, 2" string will be converted to a Bitmap with bits 0, 1, 2 set |  

## Return Value

Returns a BITMAP
- When the input field is invalid, the result is NULL

## Examples

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 2")) bts;
```

```text
+-------+
| bts   |
+-------+
| 0,1,2 |
+-------+
```

```sql
select bitmap_from_string("-1, 0, 1, 2") bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615")) bts;
```

```text
+--------------------------+
| bts                      |
+--------------------------+
| 0,1,18446744073709551615 |
+--------------------------+
```

