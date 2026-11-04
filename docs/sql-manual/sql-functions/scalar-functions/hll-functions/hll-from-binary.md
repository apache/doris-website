---
{
    "title": "HLL_FROM_BINARY",
    "language": "en",
    "description": "Converts the raw serialized bytes of a Doris HLL (VARBINARY) into an HLL, so Hive, Parquet, or ORC binary columns read directly. Invalid input returns NULL."
}
---

## Description

Converts the raw serialized bytes of a Doris HLL into an HLL. The input is a VARBINARY value holding the byte format produced by `hll_to_binary` or by the Hive UDFs (`to_hll` / `hll_union`) from the Doris Hive UDF jar. Returns `NULL` when the input bytes are invalid or truncated.

## Syntax

```sql
HLL_FROM_BINARY(<binary>)
```

## Parameters

| Parameter  | Description                                                                                                       |
|------------|-------------------------------------------------------------------------------------------------------------------|
| `<binary>` | A VARBINARY value containing the serialized bytes of a Doris HLL, e.g. a Hive `binary` column read through a Catalog, or the output of `hll_to_binary` |

## Return Value

Returns an HLL.
Returns `NULL` if the input bytes are invalid or truncated (for example, an unknown type code, a cut-off payload, or an empty value).

## Examples

To convert a `NULL` input, note that `hll_cardinality` of `NULL` is `0`:

```sql
select hll_cardinality(hll_from_binary(NULL));
```

The result will be:

```text
+----------------------------------------+
| hll_cardinality(hll_from_binary(NULL)) |
+----------------------------------------+
|                                      0 |
+----------------------------------------+
```

To convert the binary form of an empty HLL, displayed with `to_base64_binary`:

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

To convert the binary form of an HLL with one element:

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

Invalid or truncated bytes yield `NULL` instead of an error:

```sql
select hll_from_binary(sub_binary(hll_to_binary(hll_hash('abc')), 1, 2)) is null;
```

The result will be:

```text
+---------------------------------------------------------------------------+
| hll_from_binary(sub_binary(hll_to_binary(hll_hash('abc')), 1, 2)) is null |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+
```
