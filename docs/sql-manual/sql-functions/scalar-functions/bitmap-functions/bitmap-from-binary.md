---
{
    "title": "BITMAP_FROM_BINARY",
    "language": "en",
    "description": "Converts the raw serialized bytes of a Doris Bitmap (VARBINARY) into a BITMAP, so Hive, Parquet, or ORC binary columns read directly. Bad input returns NULL."
}
---

## Description

Converts the raw serialized bytes of a Doris Bitmap into a BITMAP. The input is a VARBINARY value holding the byte format produced by `bitmap_to_binary`, by the Hive UDFs (`to_bitmap` / `bitmap_union`) from the Doris Hive UDF jar, or by Spark Load. Returns `NULL` when the input bytes are invalid or truncated.

## Syntax

```sql
BITMAP_FROM_BINARY(<binary>)
```

## Parameters

| Parameter  | Description                                                                                                       |
|------------|-------------------------------------------------------------------------------------------------------------------|
| `<binary>` | A VARBINARY value containing the serialized bytes of a Doris Bitmap, e.g. a Hive `binary` column read through a Catalog, or the output of `bitmap_to_binary` |

## Return Value

Returns a BITMAP.
Returns `NULL` if the input bytes are invalid or truncated (for example, an unknown type code, a cut-off payload, or an empty value).

## Examples

To convert a `NULL` input:

```sql
select bitmap_to_string(bitmap_from_binary(null));
```

The result will be:

```text
+--------------------------------------------+
| bitmap_to_string(bitmap_from_binary(null)) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+
```

To convert the binary form of an empty Bitmap (the bytes of an empty Bitmap can be produced with `bitmap_to_binary(bitmap_empty())`):

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_empty())));
```

The result will be:

```text
+------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_empty()))) |
+------------------------------------------------------------------------+
|                                                                        |
+------------------------------------------------------------------------+
```

To convert the binary form of a Bitmap with a single element:

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(to_bitmap(1))));
```

The result will be:

```text
+----------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(to_bitmap(1)))) |
+----------------------------------------------------------------------+
| 1                                                                    |
+----------------------------------------------------------------------+
```

To convert the binary form of a Bitmap with multiple elements:

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3"))));
```

The result will be:

```text
+------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3")))) |
+------------------------------------------------------------------------------------------+
| 0,1,2,3                                                                                  |
+------------------------------------------------------------------------------------------+
```

Bitmaps containing values beyond the 32-bit range are also supported:

```sql
select bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3, 4294967296"))));
```

The result will be:

```text
+------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(bitmap_to_binary(bitmap_from_string("0, 1, 2, 3, 4294967296")))) |
+------------------------------------------------------------------------------------------------------+
| 0,1,2,3,4294967296                                                                                   |
+------------------------------------------------------------------------------------------------------+
```

Invalid or truncated bytes yield `NULL` instead of an error:

```sql
select bitmap_to_string(bitmap_from_binary(sub_binary(bitmap_to_binary(to_bitmap(1)), 1, 3)));
```

The result will be:

```text
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_binary(sub_binary(bitmap_to_binary(to_bitmap(1)), 1, 3))) |
+----------------------------------------------------------------------------------------+
| NULL                                                                                   |
+----------------------------------------------------------------------------------------+
```
