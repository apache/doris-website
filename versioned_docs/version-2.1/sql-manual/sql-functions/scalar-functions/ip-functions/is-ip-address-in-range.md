---
{
    "title": "IS_IP_ADDRESS_IN_RANGE",
    "language": "en",
    "description": "Determine whether the IP (IPv4 or IPv6) address is included in the network represented by CIDR notation."
}
---

## Description
Determine whether the IP (IPv4 or IPv6) address is included in the network represented by CIDR notation.

## Syntax
```sql
IS_IP_ADDRESS_IN_RANGE(ip_str, cidr_prefix)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ip_str>`      | An IPv4 or IPv6 address of type String |
| `<cidr_prefix>`      | The cidr prefix |


## Return Value
If the address is included in the network represented by CIDR notation, returns true; otherwise, return false.
- If input is NULL, the function returns NULL.


## Example
```sql
SELECT is_ip_address_in_range('127.0.0.1', '127.0.0.0/8') as v4, is_ip_address_in_range('::ffff:192.168.0.1', '::ffff:192.168.0.4/128') as v6, is_ip_address_in_range('127.0.0.1', NULL) as nil;
```
```text
+------+------+------+
| v4   | v6   | nil  |
+------+------+------+
|    1 |    0 | NULL |
+------+------+------+
```

