---
{
    "title": "IPV6_STRING_TO_NUM_OR_DEFAULT",
    "language": "en"
}
---

## ipv6_string_to_num_or_default

## Description
The reverse function of IPv6NumToString, it accepts an IP address string and returns the IPv6 address in binary format.

## Syntax
```sql
IPV6_STRING_TO_NUM_OR_DEFAULT(<ipv6_string>)
```

### Parameters
- `<ipv6_string>`: String type IPv6 address

### Return Value
Return Type: VARCHAR (16-byte binary)

Return Value Meaning:
- Returns the 16-byte binary encoding of IPv6
- Returns 16-byte binary of all zeros when input is NULL
- Returns 16-byte binary of all zeros for invalid IP addresses (no exception thrown)
- If input is valid IPv4 text, returns equivalent IPv6 address (`::ffff:<ipv4>`)

### Usage Notes
- This function does not throw exceptions, invalid input uniformly returns 16-byte binary of all zeros
- Supports IPv6 text abbreviation; IPv4 text will be mapped to IPv6 representation
- Suitable for fault-tolerant batch conversion

## Examples

Convert IPv6 text `1111::ffff` to 16-byte binary (displayed in hex).
```sql
select hex(ipv6_string_to_num_or_default('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 text is automatically mapped to IPv6 (`::ffff:<ipv4>`), then returned as 16-byte binary.
```sql
select hex(ipv6_string_to_num_or_default('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

Parameter as NULL returns 16-byte binary of all zeros
```sql
select hex(ipv6_string_to_num_or_default(NULL)) as null_result;
+----------------------------------+
| null_result                      |
+----------------------------------+
| 00000000000000000000000000000000 |
+----------------------------------+
```

Invalid input returns 16-byte binary of all zeros (no exception thrown).
```sql
select hex(ipv6_string_to_num_or_default('notaaddress')) as invalid;
+----------------------------------+
| invalid                          |
+----------------------------------+
| 00000000000000000000000000000000 |
+----------------------------------+
```

### Keywords

IPV6_STRING_TO_NUM_OR_DEFAULT
