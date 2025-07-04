---
{
    "title": "IPV4_CIDR_TO_RANGE",
    "language": "en"
}
---

## Description
Receive an IPv4 and an Int16 value containing CIDR. Returns a struct that contains two IPv4 fields representing the lower range (min) and higher range (max) of the subnet, respectively.

## Syntax
```sql
IPV4_CIDR_TO_RANGE(<ip_v4>, <cidr>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ip_v4>`      | An IPv4 address of type String |
| `<cidr>`      | The cidr value |


## Return Value
Returns a struct that contains two IPv4 fields representing the lower range (min) and higher range (max) of the subnet, respectively.
- If input is NULL, the function returns NULL.


## Example
```sql
SELECT ipv4_cidr_to_range(ipv4_string_to_num('192.168.5.2'), 16) as re1, ipv4_cidr_to_range(to_ipv4('192.168.5.2'), 16) as re2, ipv4_cidr_to_range(NULL, NULL) as re3;
```
```text
+------------------------------------------------+------------------------------------------------+------+
| re1                                            | re2                                            | re3  |
+------------------------------------------------+------------------------------------------------+------+
| {"min":"192.168.0.0", "max":"192.168.255.255"} | {"min":"192.168.0.0", "max":"192.168.255.255"} | NULL |
+------------------------------------------------+------------------------------------------------+------+
```
