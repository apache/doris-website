---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "en"
}
---

## Description

Convert a base64 string (which can be converted by `bitmap_to_base64` function) to a BITMAP. Returns NULL when the input string is invalid.

## Syntax

```sql
 BITMAP_FROM_BASE64(<base64_str>)
```

## Parameters

| Parameter      | Description                                                     |
|----------------|-----------------------------------------------------------------|
| `<base64_str>` | base64 string (can be converted by `bitmap_to_base64` function) |

## Return Value

Returns a BITMAP
- When the input field is invalid, the result is NULL

## Examples


```sql
select bitmap_to_string(bitmap_from_base64("invalid")) bts;
```

```text
+------+
| bts  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AA==")) bts;
```

```text
+------+
| bts  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AQEAAAA=")) bts;
```

```text
+------+
| bts  |
+------+
| 1    |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) bts;
```

```text
+-----------+
| bts       |
+-----------+
| 1,9999999 |
+-----------+
```
