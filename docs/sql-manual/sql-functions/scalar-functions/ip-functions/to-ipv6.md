---
{
    "title": "TO_IPV6",
    "language": "en"
}
---

## to_ipv6

## Description
Takes the string form of an IPv6 address and returns a value of IPv6 type. The binary form of this value equals the binary form of the return value of the `ipv6_string_to_num` function.

## Syntax
```sql
TO_IPV6(<ipv6_str>)
```

### Parameters
- `<ipv6_str>`: String type IPv6 address

### Return Value
Return Type: IPv6

Return Value Meaning:
- Returns IPv6 type value
- Throws an exception when input is NULL
- Throws an exception for invalid IPv6 addresses or `NULL` input

### Usage Notes
- Equivalent to `to_ipv6` → `IPv6` type, suitable for scenarios where tables are created with `IPv6` columns

## Examples

Convert IPv6 text `2001:1b70:a1:610::b102:2` to `IPv6` type.
```sql
SELECT to_ipv6('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```

Input NULL throws an exception
```sql
SELECT to_ipv6(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv6 must be String, not NULL
```

Invalid IPv6 text throws an exception.
```sql
SELECT to_ipv6('not-an-ip');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### Keywords

TO_IPV6
