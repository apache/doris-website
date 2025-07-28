---
{
    "title": "UNCOMPRESS",
    "language": "en"
}
---

## Description
The UNCOMPRESS function is used to COMPRESS binary data into strings or values, you need to make sure that the binary data needs to be the result of 'compress'.

## Syntax

```sql
UNCOMPRESS(<compressed_str>)
```

## Parameters

| Parameters                | Description   |
|--------------------|---------------|
| `<compressed_str>` | Compressed binary data, parameter type is varchar or string |


## Return Value

The return value is the same as the input `compressed_str` type

Special cases:
- `compressed_str` Returns NULL if the binary data is not compressed.

## Example

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
select uncompress(compress(abc));
```
```text 
+-------------------+
| uncompress('abc') |
+-------------------+
| NULL              |
+-------------------+
```