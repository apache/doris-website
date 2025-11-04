---
{
    "title": "CUT_IPV6",
    "language": "en"
}
---

## cut_ipv6

## Description
Cuts a specified number of bytes from the end of an IPv6 address based on its type (IPv4-mapped or pure IPv6), and returns the truncated IPv6 address string.

## Syntax
```sql
CUT_IPV6(<ipv6_address>, <bytes_to_cut_for_ipv6>, <bytes_to_cut_for_ipv4>)
```

### Parameters
- `<ipv6_address>`: IPv6 type address
- `<bytes_to_cut_for_ipv6>`: Number of bytes to cut for pure IPv6 addresses (TINYINT type)
- `<bytes_to_cut_for_ipv4>`: Number of bytes to cut for IPv4-mapped addresses (TINYINT type)

### Return Value
Return Type: VARCHAR

Return Value Meaning:
- Returns the truncated IPv6 address string
- If input is an IPv4-mapped address, uses the `bytes_to_cut_for_ipv4` parameter
- If input is a pure IPv6 address, uses the `bytes_to_cut_for_ipv6` parameter
- Returns NULL if any of the three parameters `<ipv6_address>`, `<bytes_to_cut_for_ipv6>`, `<bytes_to_cut_for_ipv4>` is NULL

### Usage Notes
- Automatically detects whether the IPv6 address is an IPv4-mapped address (format `::ffff:IPv4`)
- Selects the appropriate number of bytes to cut based on the address type
- Cutting operation starts from the end of the address, setting the specified number of bytes to zero
- Parameter values cannot exceed 16 (total bytes in an IPv6 address)

## Examples

Cut trailing bytes from a pure IPv6 address.
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 4) as cut_result;
+------------------+
| cut_result       |
+------------------+
| 2001:db8::       |
+------------------+
```

Cut trailing bytes from an IPv4-mapped address.
```sql
SELECT cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 4) as cut_result;
+----------------+
| cut_result     |
+----------------+
| ::ffff:0.0.0.0 |
+----------------+
```

Use different cutting parameters.
```sql
SELECT 
  cut_ipv6(to_ipv6('2001:db8::1'), 8, 4) as ipv6_cut_8,
  cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 8) as ipv4_cut_8;
+------------+------------+
| ipv6_cut_8 | ipv4_cut_8 |
+------------+------------+
| 2001:db8:: | ::         |
+------------+------------+
```

Parameters as NULL return NULL
```sql 
select cut_ipv6(NULL, NULL, NULL);
+----------------------------+
| cut_ipv6(NULL, NULL, NULL) |
+----------------------------+
| NULL                       |
+----------------------------+

select cut_ipv6(to_ipv6("::"), NULL, 0);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), NULL, 0) |
+----------------------------------+
| NULL                             |
+----------------------------------+

select cut_ipv6(to_ipv6("::"), 4, NULL);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), 4, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

Parameter values out of range will throw an exception.
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 17, 4);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 2 TINYINT of function cut_ipv6

SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 122);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 3 TINYINT of function cut_ipv6
```

### Keywords

CUT_IPV6


