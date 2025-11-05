---
{
    "title": "IPV6_CIDR_TO_RANGE",
    "language": "en"
}
---

## ipv6_cidr_to_range

## Description
Calculates the minimum and maximum IPv6 addresses for a network segment based on an IPv6 address and CIDR prefix length, returning a struct containing two IPv6 addresses.

## Syntax
```sql
IPV6_CIDR_TO_RANGE(<ipv6_address>, <cidr_prefix>)
```

### Parameters
- `<ipv6_address>`: IPv6 type address or IPv6 string
- `<cidr_prefix>`: CIDR prefix length (SMALLINT type, range 0-128)

### Return Value
Return Type: STRUCT<min: IPv6, max: IPv6>

Return Value Meaning:
- Returns a struct containing two fields:
  - `min`: Minimum IPv6 address of the network segment
  - `max`: Maximum IPv6 address of the network segment

### Usage Notes
- CIDR prefix length must be within the range 0-128
- Supports both IPv6 type and string type input
- Calculation is based on network mask, setting all host bits to zero for minimum address and all host bits to one for maximum address
- Supports various combinations of constant parameters and column parameters

## Examples

Calculate address range for /64 network segment.
```sql
SELECT ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 64) as range;
+----------------------------------------+
| range                                  |
+----------------------------------------+
| {"min": "2001:db8::", "max": "2001:db8::ffff:ffff:ffff:ffff"} |
+----------------------------------------+
```

Calculate address range for /48 network segment.
```sql
SELECT ipv6_cidr_to_range(INET6_ATON('2001:db8:1::1'), 48) as range;
+----------------------------------------+
| range                                  |
+----------------------------------------+
| {"min": "2001:db8:1::", "max": "2001:db8:1:ffff:ffff:ffff:ffff"} |
+----------------------------------------+
```

Access specific fields in the struct.
```sql
SELECT 
  ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 64).min as min_ip,
  ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 64).max as max_ip;
+-------------+----------------------------------+
| min_ip      | max_ip                           |
+-------------+----------------------------------+
| 2001:db8::  | 2001:db8::ffff:ffff:ffff:ffff   |
+-------------+----------------------------------+
```

CIDR prefix out of range throws an exception.
```sql
SELECT ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 129);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal cidr value '129'
```

### Keywords

IPV6_CIDR_TO_RANGE
