---
{
    "title": "TO_IPV4",
    "language": "en"
}
---

## to_ipv4

## Description
Takes the string form of an IPv4 address and returns a value of IPv4 type.

## Syntax
```sql
TO_IPV4(<ipv4_str>)
```

### Parameters
- `<ipv4_str>`: String type IPv4 address

### Return Value
Return Type: IPv4

Return Value Meaning:
- Returns IPv4 type value, whose binary form is equivalent to the return value of `ipv4_string_to_num`
- Throws an exception when input is NULL
- Throws an exception for invalid IPv4 addresses or `NULL` input

### Usage Notes
- Equivalent to `to_ipv4` → `IPv4` type, suitable for scenarios where tables are created with `IPv4` columns

## Examples

Convert IPv4 text `255.255.255.255` to `IPv4` type.
```sql
SELECT to_ipv4('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

Input NULL throws an exception
```sql
SELECT to_ipv4(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv4 must be String, not NULL
```

Invalid IPv4 text throws an exception.
```sql
SELECT to_ipv4('256.1.1.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value '256.1.1.1'
```

### Keywords

TO_IPV4
