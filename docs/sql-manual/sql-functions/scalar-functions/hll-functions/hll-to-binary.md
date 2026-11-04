---
{
    "title": "HLL_TO_BINARY",
    "language": "en",
    "description": "Converts an HLL into its raw serialized bytes as VARBINARY, ready for Hive binary columns or Parquet and ORC files. Byte-level counterpart of hll_to_base64."
}
---

## Description

Converts an HLL into its raw serialized bytes and returns them as a VARBINARY value.

This is the byte-level counterpart of `hll_to_base64`. The binary form is more compact than the Base64 representation and is the recommended form when exporting HLLs into binary file formats such as Parquet or ORC, or into Hive `binary` columns.

## Syntax

```sql
HLL_TO_BINARY(<hll>)
```

## Parameters

| Parameter | Description                    |
|-----------|--------------------------------|
| `<hll>`   | An HLL type column or expression |

## Return Value

Returns a VARBINARY value containing the serialized bytes of the HLL.
Returns `NULL` if the HLL is `NULL`.

## Examples

To convert a `NULL` HLL to its binary form:

```sql
select hll_to_binary(NULL);
```

The result will be:

```text
+---------------------+
| hll_to_binary(NULL) |
+---------------------+
| NULL                |
+---------------------+
```

To convert an empty HLL to its binary form, displayed with `to_base64_binary`:

```sql
select to_base64_binary(hll_to_binary(hll_empty()));
```

The result will be:

```text
+----------------------------------------------+
| to_base64_binary(hll_to_binary(hll_empty())) |
+----------------------------------------------+
| AA==                                         |
+----------------------------------------------+
```

To convert an HLL with one element to its binary form, displayed with `to_base64_binary`:

```sql
select to_base64_binary(hll_to_binary(hll_hash('abc')));
```

The result will be:

```text
+--------------------------------------------------+
| to_base64_binary(hll_to_binary(hll_hash('abc'))) |
+--------------------------------------------------+
| AQEC5XSzrpDsdw==                                 |
+--------------------------------------------------+
```

The round trip with `hll_from_binary` preserves the HLL contents:

```sql
select hll_cardinality(hll_from_binary(hll_to_binary(hll_hash('abc'))));
```

The result will be:

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_binary(hll_to_binary(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```
