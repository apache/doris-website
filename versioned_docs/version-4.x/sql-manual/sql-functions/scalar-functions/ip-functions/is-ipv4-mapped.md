---
{
    "title": "IS_IPV4_MAPPED",
    "language": "en",
    "description": "Checks if an IPv6 address is an IPv4-mapped address."
}
---

## is_ipv4_mapped

## Description
Checks if an IPv6 address is an IPv4-mapped address. IPv4-mapped addresses are a special IPv6 address format used to represent IPv4 addresses in IPv6 networks.

## Syntax
```sql
IS_IPV4_MAPPED(<ipv6_address>)
```

### Parameters
- `<ipv6_address>`: Binary representation of IPv6 address (VARCHAR type, 16 bytes)

### Return Value
Return Type: TINYINT

Return Value Meaning: 1 indicates it is an IPv4-mapped address, 0 indicates it is not an IPv4-mapped address

### Usage Notes
- IPv4-mapped address format is `::ffff:IPv4`, where the first 10 bytes are 0, bytes 11-12 are 0xFFFF, and the last 4 bytes contain the IPv4 address
- Input must be 16-byte IPv6 binary data
- This format is defined in RFC 4291 and is the most commonly used way to represent IPv4 addresses in IPv6
- Returns NULL when input parameter is NULL

## Examples

Check IPv4-mapped address.
```sql
SELECT is_ipv4_mapped(INET6_ATON('::ffff:192.168.1.1')) as is_mapped;
+-----------+
| is_mapped |
+-----------+
| 1         |
+-----------+
```

Check non-IPv4-mapped addresses.
```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('2001:db8::1')) as standard_ipv6,
  is_ipv4_mapped(INET6_ATON('::192.168.1.1')) as ipv4_compat;
+--------------+------------+
| standard_ipv6| ipv4_compat|
+--------------+------------+
| 0            | 0          |
+--------------+------------+
```

Check boundary values.
```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('::ffff:0.0.0.0')) as min_ip,
  is_ipv4_mapped(INET6_ATON('::ffff:255.255.255.255')) as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```

Input parameter as NULL returns NULL.
```sql
SELECT is_ipv4_mapped(NULL) as null_result;
+-------------+
| null_result |
+-------------+
|        NULL |
+-------------+
```

### Keywords

IS_IPV4_MAPPED
