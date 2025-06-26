---
{
    "title": "IPV6_STRING_TO_NUM",
    "language": "en"
}
---

## Description
The reverse function of IPv6NumToString, it takes an IP address String and returns an IPv6 address in binary format.

## Syntax
```sql
IPV6_STRING_TO_NUM(<ipv6_string>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | An IPv6 address of type String  |

## Return Value
Returns an IPv6 address in binary format.
- Will return an error if the input string is not a valid IP address or `NULL`
- If the input string contains a valid IPv4 address, returns its IPv6 equivalent.

## Example
```sql
select hex(ipv6_string_to_num('1111::ffff')), hex(ipv6_string_to_num('192.168.0.1'));
```
```text
+---------------------------------------+----------------------------------------+
| hex(ipv6_string_to_num('1111::ffff')) | hex(ipv6_string_to_num('192.168.0.1')) |
+---------------------------------------+----------------------------------------+
| 1111000000000000000000000000FFFF      | 00000000000000000000FFFFC0A80001       |
+---------------------------------------+----------------------------------------+
```

```sql
select hex(ipv6_string_to_num('notaaddress'));
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (172.17.0.2)[CANCELLED][E33] Invalid IPv6 value
```
