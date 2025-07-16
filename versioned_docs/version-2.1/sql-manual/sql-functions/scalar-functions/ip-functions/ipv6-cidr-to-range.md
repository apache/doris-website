---
{
    "title": "IPV6_CIDR_TO_RANGE",
    "language": "en"
}
---

## Description
Receive an IPv6 and an Int16 value containing CIDR. Returns a struct that contains two IPv6 fields representing the lower range (min) and higher range (max) of the subnet, respectively.

## Syntax
```sql
IPV6_CIDR_TO_RANGE(ip_v6, cidr)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ip_v6>`      | An IPv6 address of type String |
| `<cidr>`      | The cidr value |


## Return Value
Returns a struct that contains two IPv6 fields representing the lower range (min) and higher range (max) of the subnet, respectively.
- If input is NULL, the function returns NULL.


## Example
```sql
SELECT ipv6_cidr_to_range(to_ipv6('2001:0db8:0000:85a3:0000:0000:ac1f:8001'), 32), ipv6_cidr_to_range(NULL, NULL);
```
```text
+----------------------------------------------------------------------------+--------------------------------+
| ipv6_cidr_to_range(to_ipv6('2001:0db8:0000:85a3:0000:0000:ac1f:8001'), 32) | ipv6_cidr_to_range(NULL, NULL) |
+----------------------------------------------------------------------------+--------------------------------+
| {"min":"2001:db8::", "max":"2001:db8:ffff:ffff:ffff:ffff:ffff:ffff"}       | NULL                           |
+----------------------------------------------------------------------------+--------------------------------+
```


