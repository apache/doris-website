---
{
    "title": "TO_IPV4_OR_DEFAULT",
    "language": "en",
    "description": "Takes the string form of an IPv4 address and returns a value of IPv4 type. For invalid input or NULL input, returns the default value 0.0.0.0."
}
---

## to_ipv4_or_default

## Description
Takes the string form of an IPv4 address and returns a value of IPv4 type. For invalid input or NULL input, returns the default value `0.0.0.0`.

## Syntax
```sql
TO_IPV4_OR_DEFAULT(<ipv4_str>)
```

### Parameters
- `<ipv4_str>`: String type IPv4 address

### Return Value
Return Type: IPv4

Return Value Meaning:
- Returns IPv4 type value, whose binary form is equivalent to the return value of `ipv4_string_to_num`
- Returns `0.0.0.0` when input is NULL or invalid IPv4 address

### Usage Notes
- Equivalent to `to_ipv4_or_default` → `IPv4` type, suitable for scenarios where tables are created with `IPv4` columns
- Does not throw exceptions for invalid input, instead returns the default value `0.0.0.0`

## Examples

Convert IPv4 text `255.255.255.255` to `IPv4` type.
```sql
SELECT to_ipv4_or_default('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

Input NULL returns default value `0.0.0.0`.
```sql
SELECT to_ipv4_or_default(NULL) as v4;
+---------+
| v4      |
+---------+
| 0.0.0.0 |
+---------+
```

Invalid IPv4 text returns default value `0.0.0.0`.
```sql
SELECT to_ipv4_or_default('256.1.1.1') as v4;
+---------+
| v4      |
+---------+
| 0.0.0.0 |
+---------+
```

### Keywords

TO_IPV4_OR_DEFAULT
