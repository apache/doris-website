---
{
    "title": "TO_IPV4",
    "language": "en",
    "description": "This function like ipv4stringtonum that takes a string form of IPv4 address and returns value of IPv4 type,"
}
---

## Description
This function like ipv4_string_to_num that takes a string form of IPv4 address and returns value of IPv4 type, which is binary equal to value returned by ipv4_string_to_num.

## Syntax
```sql
TO_IPV4(<ipv4_str>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_str>`      | An IPv4 address of type String |


## Return Value
Returns value of IPv4 type, which is binary equal to value returned by ipv4_string_to_num.
- If the IPv4 address has an invalid format, throw an exception


## Example
```sql
SELECT to_ipv4('255.255.255.255');
```
```text
+----------------------------+
| to_ipv4('255.255.255.255') |
+----------------------------+
| 255.255.255.255            |
+----------------------------+
```
