---
{
    "title": "TO_IPV6_OR_DEFAULT",
    "language": "en"
}
---

## Description
Convert a string form of IPv6 address to IPv6 type.

## Syntax
```sql
TO_IPV6_OR_DEFAULT(<ipv6_str>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_str>`      | An IPv6 address of type String |


## Return Value
Returns value of IPv6 type.
- If the IPv6 address has an invalid format, returns :: (0 as IPv6).


## Example
```sql
SELECT to_ipv6_or_default('.'), to_ipv6_or_default('2001:1b70:a1:610::b102:2');
```
```text
+-------------------------+------------------------------------------------+
| to_ipv6_or_default('.') | to_ipv6_or_default('2001:1b70:a1:610::b102:2') |
+-------------------------+------------------------------------------------+
| ::                      | 2001:1b70:a1:610::b102:2                       |
+-------------------------+------------------------------------------------+
```
