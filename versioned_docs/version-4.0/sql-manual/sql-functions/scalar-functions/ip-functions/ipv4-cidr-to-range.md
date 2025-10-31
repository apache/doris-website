---
{
    "title": "IPV4_CIDR_TO_RANGE",
    "language": "en"
}
---

## ipv4_cidr_to_range

## Description
Calculates the minimum and maximum IPv4 addresses for a network segment based on an IPv4 address and CIDR prefix length, returning a struct containing two IPv4 addresses.

## Syntax
```sql
IPV4_CIDR_TO_RANGE(<ipv4_address>, <cidr_prefix>)
```

### Parameters
- `<ipv4_address>`: IPv4 type address
- `<cidr_prefix>`: CIDR prefix length (SMALLINT type, range 0-32)

### Return Value
Return Type: STRUCT<min: IPv4, max: IPv4>

Return Value Meaning:
- Returns a struct containing two fields:
  - `min`: Minimum IPv4 address of the network segment
  - `max`: Maximum IPv4 address of the network segment

### Usage Notes
- CIDR prefix length must be within the range 0-32
- Calculation is based on network mask, setting all host bits to zero for minimum address and all host bits to one for maximum address
- Supports various combinations of constant parameters and column parameters

## Examples

Calculate address range for /24 network segment.
```sql
SELECT ipv4_cidr_to_range(INET_ATON('192.168.1.1'), 24) as range;
+----------------------------------------+
| range                                  |
+----------------------------------------+
| {"min": "192.168.1.0", "max": "192.168.1.255"} |
+----------------------------------------+
```

Calculate address range for /16 network segment.
```sql
SELECT ipv4_cidr_to_range(INET_ATON('10.0.0.1'), 16) as range;
+----------------------------------------+
| range                                  |
+----------------------------------------+
| {"min": "10.0.0.0", "max": "10.255.255.255"} |
+----------------------------------------+
```

Access specific fields in the struct.
```sql
SELECT 
  ipv4_cidr_to_range(INET_ATON('172.16.1.1'), 24).min as min_ip,
  ipv4_cidr_to_range(INET_ATON('172.16.1.1'), 24).max as max_ip;
+-------------+-------------+
| min_ip      | max_ip      |
+-------------+-------------+
| 172.16.1.0  | 172.16.1.255 |
+-------------+-------------+
```

CIDR prefix out of range throws an exception.
```sql
SELECT ipv4_cidr_to_range(INET_ATON('192.168.1.1'), 33);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal cidr value '33'
```

### Keywords

IPV4_CIDR_TO_RANGE
