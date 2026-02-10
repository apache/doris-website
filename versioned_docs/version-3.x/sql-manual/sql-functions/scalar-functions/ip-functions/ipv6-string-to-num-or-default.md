---
{
    "title": "IPV6_STRING_TO_NUM_OR_DEFAULT",
    "language": "en",
    "description": "The reverse function of IPv6NumToString, it takes an IP address String and returns an IPv6 address in binary format."
}
---

## Description
The reverse function of IPv6NumToString, it takes an IP address String and returns an IPv6 address in binary format.


## Syntax
```sql
IPV6_STRING_TO_NUM_OR_DEFAULT(<ipv6_string>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | An IPv6 address of type String  |


## Return Value
Returns an IPv6 address in binary format.
- will return `0` if the input string is not a valid IP address
- If the input string contains a valid IPv4 address, returns its IPv6 equivalent.

## Example
```sql
select hex(ipv6_string_to_num_or_default('1111::ffff')) as r1,hex(ipv6_string_to_num_or_default('192.168.0.1')) as r2, hex(ipv6_string_to_num_or_default('notaaddress')) as r3;
```
```text
+----------------------------------+----------------------------------+----------------------------------+
| r1                               | r2                               | r3                               |
+----------------------------------+----------------------------------+----------------------------------+
| 1111000000000000000000000000FFFF | 00000000000000000000FFFFC0A80001 | 00000000000000000000000000000000 |
+----------------------------------+----------------------------------+----------------------------------+
```
