---
{
    "title": "IPV6_STRING_TO_NUM",
    "language": "en"
}
---

## ipv6_string_to_num

## Description
The reverse function of IPv6NumToString, it accepts an IP address string and returns the IPv6 address in binary format.

## Syntax
```sql
IPV6_STRING_TO_NUM(<ipv6_string>)
```

### Parameters
- `<ipv6_string>`: String type IPv6 address

### Return Value
Return Type: VARCHAR (16-byte binary)

Return Value Meaning:
- Returns the 16-byte binary encoding of IPv6
- Throws an exception when input is NULL
- Throws an exception for invalid IP addresses or `NULL` input
- If input is valid IPv4 text, returns equivalent IPv6 address (`::ffff:<ipv4>`)

### Usage Notes
- Supports standard IPv6 text (including abbreviated and `::` omitted forms)
- If input is valid IPv4 text, converts and returns IPv6's IPv4-Mapped representation
- Does not support extended forms like CIDR, ports, square brackets, etc.

## Examples

Convert IPv6 text `1111::ffff` to 16-byte binary (displayed in hex).
```sql
select hex(ipv6_string_to_num('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 text is automatically mapped to IPv6 (`::ffff:<ipv4>`), then returned as 16-byte binary.
```sql
select hex(ipv6_string_to_num('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

Input NULL throws an exception
```sql
select hex(ipv6_string_to_num(NULL));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv6 value like '::' first
```

Invalid input throws an exception.
```sql
select hex(ipv6_string_to_num('notaaddress'));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### Keywords

IPV6_STRING_TO_NUM
