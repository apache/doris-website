---
{
    "title": "TO_IPV6",
    "language": "en"
}
---

## Description
Convert a string form of IPv6 address to IPv6 type, which is binary equal to value returned by ipv6_string_to_num.

## Syntax
```sql
TO_IPV6(<ipv6_str>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_str>`      | An IPv6 address of type String |


## Return Value
Returns value of IPv6 type.
- If the IPv6 address has an invalid format, throw an exception


## Example
```sql
SELECT to_ipv6('::'),to_ipv6('2001:1b70:a1:610::b102:2');
```
```text
+---------------+-------------------------------------+
| to_ipv6('::') | to_ipv6('2001:1b70:a1:610::b102:2') |
+---------------+-------------------------------------+
| ::            | 2001:1b70:a1:610::b102:2            |
+---------------+-------------------------------------+
```
