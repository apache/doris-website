---
{
    "title": "UNCOMPRESS",
    "language": "en",
    "description": "The UNCOMPRESS function decompresses binary data into strings or values. You must ensure the binary data is the result of the COMPRESS function."
}
---

## Description
The UNCOMPRESS function decompresses binary data into strings or values. You must ensure the binary data is the result of the `COMPRESS` function.

## Syntax

```sql
UNCOMPRESS(<compressed_str>)
```

## Parameters

| Parameter          | Description            |
|--------------------|------------------------|
| `<compressed_str>` | Compressed binary data, parameter type is varchar or string |

## Return Value

The return value type is the same as the input `compressed_str` type.

Special cases:
- Returns NULL if `compressed_str` is not binary data obtained from `COMPRESS`.


## Examples

``` sql
select uncompress(compress('abc'));
```
```text 
+-----------------------------+
| uncompress(compress('abc')) |
+-----------------------------+
| abc                         |
+-----------------------------+
```
```sql
select uncompress(compress(''));
```
```text 
+--------------------------+
| uncompress(compress('')) |
+--------------------------+
|                          |
+--------------------------+
```
```sql
select uncompress('abc');
```
```text 
+-------------------+
| uncompress('abc') |
+-------------------+
| NULL              |
+-------------------+
```

### Keywords

    UNCOMPRESS, COMPRESS
