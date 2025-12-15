---
{
    "title": "IS_IPV4_COMPAT",
    "language": "en"
}
---

## is_ipv4_compat

## Description
Checks if an IPv6 address is an IPv4-compatible address. IPv4-compatible addresses are a special IPv6 address format used to represent IPv4 addresses in IPv6 networks.

## Syntax
```sql
IS_IPV4_COMPAT(<ipv6_address>)
```

### Parameters
- `<ipv6_address>`: Binary representation of IPv6 address (VARCHAR type, 16 bytes)

### Return Value
Return Type: TINYINT

Return Value Meaning: 1 indicates it is an IPv4-compatible address, 0 indicates it is not an IPv4-compatible address

### Usage Notes
- IPv4-compatible address format is `::IPv4`, where the first 12 bytes are 0 and the last 4 bytes contain the IPv4 address
- Input must be 16-byte IPv6 binary data
- This format is defined in RFC 4291 for IPv6 transition period
- The last 4 bytes cannot be 0, so `::0.0.0.0` is not a valid IPv4-compatible address, as 0.0.0.0 is not an IPv4 unicast address and does not satisfy the RFC 4291 IPv4-Mapped IPv6 Address definition
- Returns NULL when input parameter is NULL

## Examples

Check IPv4-compatible address.
```sql
SELECT is_ipv4_compat(INET6_ATON('::192.168.1.1')) as is_compat;
+-----------+
| is_compat |
+-----------+
| 1         |
+-----------+
```

Check non-IPv4-compatible addresses.
```sql
SELECT 
  is_ipv4_compat(INET6_ATON('2001:db8::1')) as standard_ipv6,
  is_ipv4_compat(INET6_ATON('::ffff:192.168.1.1')) as ipv4_mapped,
  is_ipv4_compat(INET6_ATON('::0.0.0.0')) as zero_ip;
+--------------+------------+---------+
| standard_ipv6| ipv4_mapped| zero_ip |
+--------------+------------+---------+
| 0            | 0          | 0       |
+--------------+------------+---------+
```

Check boundary values.
```sql
SELECT 
  is_ipv4_compat(INET6_ATON('::0.0.0.0')) as min_ip,
  is_ipv4_compat(INET6_ATON('::255.255.255.255')) as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 0      | 1      |
+--------+--------+
```

Input parameter as NULL returns NULL.
```sql
SELECT is_ipv4_compat(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

### Keywords

IS_IPV4_COMPAT
