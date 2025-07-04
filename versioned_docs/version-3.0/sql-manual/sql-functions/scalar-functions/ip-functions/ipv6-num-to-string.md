---
{
    "title": "IPV6_NUM_TO_STRING",
    "language": "en"
}
---

## Description
Takes an IPv6 address in binary format of type String. Returns the string of this address in text format.
- The IPv4 address mapped by IPv6 starts with ::ffff:111.222.33.

## Alias
- INET6_NTOA

## Syntax
```sql
IPV6_NUM_TO_STRING(<ipv6_num>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_num>`      | An IPv6 address in binary format of type String  |

## Return Value
Returns the string of the ipv6 address in text format.
- If the input string is not the binary encoding of a valid IPv6 address, `NULL` is returned.


## Example
```sql
select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr, ipv6_num_to_string("-23vno12i34nlfwlsj");
```
```text
+--------------+------------------------------------------+
| addr         | ipv6_num_to_string('-23vno12i34nlfwlsj') |
+--------------+------------------------------------------+
| 2a02:6b8::11 | NULL                                     |
+--------------+------------------------------------------+
```