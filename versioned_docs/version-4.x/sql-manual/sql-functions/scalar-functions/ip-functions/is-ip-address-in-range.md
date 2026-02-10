---
{
    "title": "IS_IP_ADDRESS_IN_RANGE",
    "language": "en",
    "description": "Checks if a specified IP address is within a given CIDR network range. Supports both IPv4 and IPv6 addresses."
}
---

## is_ip_address_in_range

## Description
Checks if a specified IP address is within a given CIDR network range. Supports both IPv4 and IPv6 addresses.

## Syntax
```sql
IS_IP_ADDRESS_IN_RANGE(<ip_address>, <cidr_range>)
```

### Parameters
- `<ip_address>`: IP address to check (IPv4, IPv6 type or string)
- `<cidr_range>`: CIDR network range (string format, such as "192.168.1.0/24")

### Return Value
Return Type: TINYINT

Return Value Meaning:
- Returns 1: indicates the IP address is within the specified CIDR range
- Returns 0: indicates the IP address is not within the specified CIDR range
- Returns NULL when input is NULL

### Usage Notes
- Supports checking both IPv4 and IPv6 addresses
- CIDR range must be in valid format (such as "192.168.1.0/24" or "2001:db8::/64")
- Supports inverted index optimization, can use index acceleration when CIDR parameter is constant
- Returns 0 for invalid CIDR formats
- Returns NULL when input parameter is NULL

## Examples

Check if IPv4 address is within specified network segment.
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

Check if IPv6 address is within specified network segment.
```sql
SELECT is_ip_address_in_range(INET6_ATON('2001:db8::100'), '2001:db8::/64') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

Check if multiple addresses are within specified network segment.
```sql
SELECT 
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_192_168_1,
  is_ip_address_in_range(to_ipv4('192.168.2.100'), '192.168.1.0/24') as in_192_168_2,
  is_ip_address_in_range(to_ipv4('10.0.0.1'), '192.168.1.0/24') as in_10_0_0;
+-------------+-------------+----------+
| in_192_168_1| in_192_168_2| in_10_0_0|
+-------------+-------------+----------+
| 1           | 0           | 0        |
+-------------+-------------+----------+
```

Check ranges with different CIDR prefix lengths.
```sql
SELECT 
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.0.0/16') as in_16,
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_24,
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.100/32') as in_32;
+--------+--------+--------+
| in_16  | in_24  | in_32  |
+--------+--------+--------+
| 1      | 1      | 1      |
+--------+--------+--------+
```

Invalid CIDR format returns 0.
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), 'invalid-cidr') as in_range;
+----------+
| in_range |
+----------+
| 0        |
+----------+
```

Input parameter as NULL returns NULL.
```sql
SELECT is_ip_address_in_range(NULL, '192.168.1.0/24') as null_ip;
+---------+
| null_ip |
+---------+
| NULL    |
+---------+

SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), NULL) as null_cidr;
+-----------+
| null_cidr |
+-----------+
| NULL      |
+-----------+

SELECT is_ip_address_in_range(NULL, NULL) as both_null;
+-----------+
| both_null |
+-----------+
| NULL      |
+-----------+
```

### Keywords

IS_IP_ADDRESS_IN_RANGE
