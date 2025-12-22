---
{
    "title": "IPV4_TO_IPV6",
    "language": "en",
    "description": "Converts an IPv4 address to an IPv6 address. The converted IPv6 address is an IPv4-mapped address in the format ::ffff:IPv4."
}
---

## ipv4_to_ipv6

## Description
Converts an IPv4 address to an IPv6 address. The converted IPv6 address is an IPv4-mapped address in the format `::ffff:IPv4`.

## Syntax
```sql
IPV4_TO_IPV6(<ipv4_address>)
```

### Parameters
- `<ipv4_address>`: IPv4 type address

### Return Value
Return Type: IPv6

Return Value Meaning:
- Returns the corresponding IPv6 address in the format `::ffff:IPv4`
- This is the standard IPv4-mapped IPv6 address format

### Usage Notes
- Embeds the IPv4 address into an IPv6 address using the standard IPv4-mapped format
- The converted address can be used for IPv4 compatibility in IPv6 networks
- Supports all valid IPv4 addresses
- Returns NULL when input parameter is NULL

## Examples

Convert IPv4 address to IPv6 address.
```sql
SELECT ipv4_to_ipv6(to_ipv4('192.168.1.1')) as ipv6_address;
+--------------------+
| ipv6_address       |
+--------------------+
| ::ffff:192.168.1.1 |
+--------------------+
```

Convert multiple IPv4 addresses.
```sql
SELECT 
  ipv4_to_ipv6(to_ipv4('10.0.0.1')) as private_ip,
  ipv4_to_ipv6(to_ipv4('8.8.8.8')) as public_ip;
+-----------------+----------------+
| private_ip      | public_ip      |
+-----------------+----------------+
| ::ffff:10.0.0.1 | ::ffff:8.8.8.8 |
+-----------------+----------------+
```

Convert boundary value IPv4 addresses.
```sql
SELECT 
  ipv4_to_ipv6(to_ipv4('0.0.0.0')) as min_ip,
  ipv4_to_ipv6(to_ipv4('255.255.255.255')) as max_ip;
+----------------+------------------------+
| min_ip         | max_ip                 |
+----------------+------------------------+
| ::ffff:0.0.0.0 | ::ffff:255.255.255.255 |
+----------------+------------------------+
```

Input parameter as NULL returns NULL.
```sql
SELECT ipv4_to_ipv6(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

### Keywords

IPV4_TO_IPV6
