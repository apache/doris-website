---

{
    "title": "HLL_TO_BASE64",
    "language": "en"
}

---

## Description

Converts an input HLL to a base64-encoded string.

## Syntax

```sql
HLL_TO_BASE64(<hll_input>)
```

## Parameters

| Parameter    | Description                                          |
| ------------ | ---------------------------------------------------- |
| `<hll_input>` | The HyperLogLog (HLL) data to be converted to a base64-encoded string. |

## Return Value

A Base64 encoded string of the HLL.
Returns `NULL` if the HLL is `NULL`.

::: note

Due to the non-guaranteed order of elements in a HLL, the generated Base64 string may not always be the same for the same content. However, the decoded HLL from `hll_from_base64` will be the same.

:::

## Examples

```sql
select hll_to_base64(NULL);
```

```text
+---------------------+
| hll_to_base64(NULL) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select hll_to_base64(hll_empty());
```

```text
+----------------------------+
| hll_to_base64(hll_empty()) |
+----------------------------+
| AA==                       |
+----------------------------+
```

```sql
select hll_to_base64(hll_hash('abc'));
```

```text
+--------------------------------+
| hll_to_base64(hll_hash('abc')) |
+--------------------------------+
| AQEC5XSzrpDsdw==               |
+--------------------------------+
```

```sql
select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
```

```text
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
```

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```