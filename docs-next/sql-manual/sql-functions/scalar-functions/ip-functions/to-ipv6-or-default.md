---
{
    "title": "TO_IPV6_OR_DEFAULT",
    "language": "en",
    "description": "Takes the string form of an IPv6 address and returns a value of IPv6 type. For invalid input or NULL input, returns the default value ::."
}
---

## to_ipv6_or_default

## Description
Takes the string form of an IPv6 address and returns a value of IPv6 type. For invalid input or NULL input, returns the default value `::`.

## Syntax
```sql
TO_IPV6_OR_DEFAULT(<ipv6_str>)
```

### Parameters
- `<ipv6_str>`: String type IPv6 address

### Return Value
Return Type: IPv6

Return Value Meaning:
- Returns IPv6 type value, whose binary form equals the binary form of the return value of the `ipv6_string_to_num` function
- Returns `::` when input is NULL or invalid IPv6 address

### Usage Notes
- Equivalent to `to_ipv6_or_default` → `IPv6` type, suitable for scenarios where tables are created with `IPv6` columns
- Does not throw exceptions for invalid input, instead returns the default value `::`

## Examples

Convert IPv6 text `2001:1b70:a1:610::b102:2` to `IPv6` type.
```sql
SELECT to_ipv6_or_default('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```

Input NULL returns default value `::`.
```sql
SELECT to_ipv6_or_default(NULL) as v6;
+----+
| v6 |
+----+
| :: |
+----+
```

Invalid IPv6 text returns default value `::`.
```sql
SELECT to_ipv6_or_default('not-an-ip') as v6;
+----+
| v6 |
+----+
| :: |
+----+
```

### Keywords

TO_IPV6_OR_DEFAULT
