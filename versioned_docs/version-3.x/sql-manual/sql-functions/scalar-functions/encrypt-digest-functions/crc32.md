---
{
    "title": "CRC32",
    "language": "en",
    "description": "Use CRC32 to compute the result."
}
---

## Description

Use CRC32 to compute the result.

## Syntax

```sql
CRC32( <str> )
```
## Parameters

| parameter | description |
| -- | -- |
| `<str>` | The value to be used for CRC calculation |

## Return Value

Returns the Cyclic Redundancy Check value of this string.

## Examples

```sql
select crc32("abc"),crc32("中国");
```
```text
+--------------+-----------------+
| crc32('abc') | crc32('中国')   |
+--------------+-----------------+
|    891568578 |       737014929 |
+--------------+-----------------+
```
