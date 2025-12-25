---
{
    "title": "IPV6_STRING_TO_NUM_OR_NULL | Ip Functions",
    "language": "en",
    "description": "Alias for ipv6stringtonumornull."
}
---

# IPV6_STRING_TO_NUM_OR_NULL

## inet6_aton

Alias for `ipv6_string_to_num_or_null`.

## Description
Converts an IPv6 text address to a 16-byte binary representation.

## Syntax
```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```

### Parameters
- `<ipv6_string>`: String type IPv6 address

### Return Value
Return Type: VARCHAR (16-byte binary, nullable)

Return Value Meaning:
- Returns the 16-byte binary encoding of IPv6
- Returns `NULL` when input is NULL
- Returns `NULL` for invalid IPv6 strings
- If input is IPv4 text, returns equivalent IPv6 address (`::ffff:<ipv4>`)

### Usage Notes
- Behaves consistently with `ipv6_string_to_num_or_null`: returns `NULL` for invalid input
- Commonly used for compatibility with MySQL's `INET6_ATON` syntax

## Examples

Convert IPv6 text `1111::ffff` to 16-byte binary (displayed in hex).
```sql
select hex(ipv6_string_to_num_or_null('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 text is automatically mapped to IPv6 (`::ffff:<ipv4>`), then returned as 16-byte binary.
```sql
select hex(ipv6_string_to_num_or_null('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

Parameter as NULL returns NULL
```sql
select hex(ipv6_string_to_num_or_null(NULL)) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

Returns NULL for invalid input (no exception thrown).
```sql
select hex(ipv6_string_to_num_or_null('notaaddress')) as invalid;
+----------+
| invalid  |
+----------+
| NULL     |
+----------+
```

### Keywords

INET6_ATON, IPV6_STRING_TO_NUM_OR_NULL


