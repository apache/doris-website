---
{
"title": "MD5",
"language": "en"
}
---

## description

Calculates an MD5 128-bit checksum for the string

## Syntax

```sql
MD5( <str> )
```

## Parameters

| parameter | description |
| -- | -- |
| `<str>` | The MD5 value to be calculated |

## Return Value

Returns the MD5 value of a string.

## Examples

```sql
select md5("abc");
```

```text
+----------------------------------+
| md5('abc')                       |
+----------------------------------+
| 900150983cd24fb0d6963f7d28e17f72 |
+----------------------------------+
```
