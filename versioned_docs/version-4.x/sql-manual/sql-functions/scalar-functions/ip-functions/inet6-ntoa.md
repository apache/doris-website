---
{
    "title": "IPV6_NUM_TO_STRING | Ip Functions",
    "language": "en",
    "description": "Alias for ipv6numtostring.",
    "sidebar_label": "IPV6_NUM_TO_STRING"
}
---

# IPV6_NUM_TO_STRING

## inet6_ntoa

Alias for `ipv6_num_to_string`.

## Description
Converts an IPv6 address to its standard text representation, returning the string of this address in text format.

## Syntax
```sql
IPV6_NUM_TO_STRING(<ipv6_num>)
```

### Parameters
- `<ipv6_num>`: Value of IPv6 type column, or binary string of length 16

### Return Value
Return Type: VARCHAR

Return Value Meaning:
- Returns IPv6 text representation
- Returns NULL when input parameter is NULL
- Returns `NULL` for invalid input (such as empty strings, binary strings not of length 16, etc.)

### Usage Notes
- Behaves consistently with `ipv6_num_to_string`: binary input not of length 16 will return NULL
- Commonly used for compatibility with MySQL's `INET6_NTOA` syntax

## Examples

Convert 16-byte binary (constructed via `unhex`) to IPv6 text.
```sql
select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr;
+--------------+
| addr         |
+--------------+
| 2a02:6b8::11 |
+--------------+
```

Parameter as NULL returns NULL
```sql
select ipv6_num_to_string(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

Invalid binary input (not 16 bytes) returns NULL.
```sql
select ipv6_num_to_string('-23vno12i34nlfwlsj') as invalid;
+----------+
| invalid  |
+----------+
| NULL     |
+----------+
```

### Keywords

INET6_NTOA, IPV6_NUM_TO_STRING


