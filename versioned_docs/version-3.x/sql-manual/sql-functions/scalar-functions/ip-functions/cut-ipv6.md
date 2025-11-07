---
{
    "title": "CUT_IPV6",
    "language": "en"
}
---

## Description

Accept an IPv6 type address and return a string containing the address of the specified number of bytes removed in text format.


## Syntax
```sql
CUT_IPV6(<ipv6>, <cut_ipv6_bytes>, <cut_ipv4_bytes>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6>`      | An IPv6 type address |
| `<cut_ipv6_bytes>`     | The bytes you want to cut the ipv6         |
| `<cut_ipv4_bytes>`     | If the fist parameter is ipv4, The bytes you want to cut the ipv4           |

## Return Value
Return a value of text, which cut the ipv6 by specified bytes.

## Example

```sql
select cut_ipv6(to_ipv6('2001:0DB8:AC10:FE01:FEED:BABE:CAFE:F00D'), 10, 0);
```
```text
+---------------------------------------------------------------------+
| cut_ipv6(to_ipv6('2001:0DB8:AC10:FE01:FEED:BABE:CAFE:F00D'), 10, 0) |
+---------------------------------------------------------------------+
| 2001:db8:ac10::                                                     |
+---------------------------------------------------------------------+
```
