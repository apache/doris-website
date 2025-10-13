---
{
    "title": "TO_IPV4_OR_DEFAULT",
    "language": "en"
}
---

## Description
This function like ipv4_string_to_num that takes a string form of IPv4 address and returns value of IPv4 type, which is binary equal to value returned by ipv4_string_to_num.

## Syntax
```sql
TO_IPV4_OR_DEFAULT(<ipv4_str>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_str>`      | An IPv4 address of type String |


## Return Value
Returns value of IPv4 type.
- If the IPv4 address has an invalid format, returns 0.0.0.0 (0 as IPv4).


## Example
```sql
SELECT to_ipv4_or_default('255.255.255.255'), to_ipv4_or_default('.'), to_ipv4_or_default(NULL);
```
```text
+---------------------------------------+-------------------------+--------------------------+
| to_ipv4_or_default('255.255.255.255') | to_ipv4_or_default('.') | to_ipv4_or_default(NULL) |
+---------------------------------------+-------------------------+--------------------------+
| 255.255.255.255                       | 0.0.0.0                 | 0.0.0.0                  |
+---------------------------------------+-------------------------+--------------------------+
```
