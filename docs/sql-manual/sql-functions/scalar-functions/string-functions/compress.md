---
{
    "title": "COMPRESS",
    "language": "en"
}
---

## Description
The COMPRESS function is used to compress strings or values into binary data. The compressed data can be decompressed using the UNCOMPRESS function.

## Syntax

```sql
COMPRESS(<uncompressed_str>)
```

## Parameters

| Parameters                | Description            |
|--------------------|---------------|
| `<uncompressed_str>` | Uncompressed raw string, parameter type is varchar or string   |


## Return Value

The return string is of the same type as the input `uncompressed_str`  

The return string is an unreadable compressed byte stream.  
Special cases:
- `uncompressed_str` Return empty string(`''`) when the input is empty string(`''`)

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
select compress('');
```
```text 
+--------------+
| compress('') |
+--------------+
|              |
+--------------+
```