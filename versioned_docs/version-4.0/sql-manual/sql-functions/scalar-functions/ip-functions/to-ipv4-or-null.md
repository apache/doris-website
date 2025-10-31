---
{
    "title": "TO_IPV4_OR_NULL",
    "language": "en"
}
---

## to_ipv4_or_null

## Description
Takes the string form of an IPv4 address and returns a value of IPv4 type. For invalid input or NULL input, returns NULL.

## Syntax
```sql
TO_IPV4_OR_NULL(<ipv4_str>)
```

### Parameters
- `<ipv4_str>`: String type IPv4 address

### Return Value
Return Type: IPv4

Return Value Meaning:
- Returns IPv4 type value, whose binary form is equivalent to the return value of `ipv4_string_to_num`
- Returns NULL when input is NULL or invalid IPv4 address

### Usage Notes
- Equivalent to `to_ipv4_or_null` → `IPv4` type, suitable for scenarios where tables are created with `IPv4` columns
- Does not throw exceptions for invalid input, instead returns NULL

## Examples

Convert IPv4 text `255.255.255.255` to `IPv4` type.
```sql
SELECT to_ipv4_or_null('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

Input NULL returns NULL.
```sql
SELECT to_ipv4_or_null(NULL) as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

Invalid IPv4 text returns NULL.
```sql
SELECT to_ipv4_or_null('256.1.1.1') as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

### Keywords

TO_IPV4_OR_NULL
