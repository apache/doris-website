---
{
    "title": "COMPRESS",
    "language": "en"
}
---

## Description

The COMPRESS function compresses a string into binary data using the zlib compression algorithm. The compressed data can be decompressed back to the original string using the UNCOMPRESS function.

## Syntax

```sql
COMPRESS(<str>)
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<str>` | The string to be compressed. Type: VARCHAR |

## Return Value

Returns VARCHAR type, which is the compressed binary data (not human-readable).

Special cases:
- If the parameter is NULL, returns NULL
- If the input is an empty string `''`, returns an empty string `''`

## Examples

1. Basic usage: compression and decompression
```sql
SELECT uncompress(compress('hello'));
```
```text 
+-------------------------------+
| uncompress(compress('hello')) |
+-------------------------------+
| hello                         |
+-------------------------------+
```

2. Empty string handling
```sql
SELECT compress('');
```
```text 
+--------------+
| compress('') |
+--------------+
|              |
+--------------+
```

3. NULL value handling
```sql
SELECT compress(NULL);
```
```text 
+----------------+
| compress(NULL) |
+----------------+
| NULL           |
+----------------+
```

4. UTF-8 character test
```sql
SELECT uncompress(compress('ṭṛì'));
```
```text
+----------------------------------+
| uncompress(compress('ṭṛì'))      |
+----------------------------------+
| ṭṛì                              |
+----------------------------------+
```
