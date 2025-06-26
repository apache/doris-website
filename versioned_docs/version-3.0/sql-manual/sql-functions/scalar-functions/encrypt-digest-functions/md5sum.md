---
{
"title": "MD5SUM",
"language": "en"
}
---

## description

Calculates an MD5 128-bit checksum for the strings

## Syntax

```sql
MD5SUM( <str> [ , <str> ... ] )
```

## Parameters

|  parameter | description |
|---------| -- |
| `<str>` | The MD5 value to be calculated |

## Return Value

Returns the MD5 value of multiple strings

## Examples

```sql
select md5("abcd"),md5sum("ab","cd");
```

```text
+----------------------------------+----------------------------------+
| md5('abcd')                      | md5sum('ab', 'cd')               |
+----------------------------------+----------------------------------+
| e2fc714c4727ee9395f324cd2e7f331f | e2fc714c4727ee9395f324cd2e7f331f |
+----------------------------------+----------------------------------+
```