---
{
    "title": "IS_IPV4_COMPAT",
    "language": "en"
}
---

## Description
This function takes an IPv6 address represented in numeric form as a binary string, as returned by INET6_ATON().INET6_ATON is also named IPV6_STRING_TO_NUM_OR_NULL.
- IPv4-compatible addresses have the form `::ipv4_address`

## Syntax
```sql
IS_IPV4_COMPAT(INET6_ATON(<ipv4_addr>))
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_addr>`      | An IPv4-compatible addresses, it is like '::ipv4_address'  |


## Return Value
Returns 1 if the argument is a valid IPv4-compatible IPv6 address, 0 otherwise.
- If input is NULL, the function returns NULL.


## Example
```sql
SELECT IS_IPV4_COMPAT(INET6_ATON('::ffff:10.0.5.9')) AS re1, IS_IPV4_COMPAT(INET6_ATON('::10.0.5.9')) AS re2;
```
```text
+------+------+
| re1  | re2  |
+------+------+
|    0 |    1 |
+------+------+
```
