---
{
    "title": "IPV4_TO_IPV6",
    "language": "en"
}
---

## Description
Convert ipv4 type address to ipv6 type address.

## Syntax
```sql
IPV4_TO_IPV6(<ipv4>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4>`      | An IPv4 type address  |

## Return Value
Returns the converted IPv6 type address.

## Example
```sql
select ipv6_num_to_string(ipv4_to_ipv6(to_ipv4('192.168.0.1')));
```
```text
+----------------------------------------------------------+
| ipv6_num_to_string(ipv4_to_ipv6(to_ipv4('192.168.0.1'))) |
+----------------------------------------------------------+
| ::ffff:192.168.0.1                                       |
+----------------------------------------------------------+
```
