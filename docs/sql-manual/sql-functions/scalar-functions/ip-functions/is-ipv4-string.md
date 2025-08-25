---
{
    "title": "IS_IPV4_STRING",
    "language": "en"
}
---

## is_ipv4_string

## Description
Checks if the input string is a valid IPv4 address format. Returns 1 if it is a valid IPv4 address, returns 0 if it is not.

## Syntax
```sql
IS_IPV4_STRING(<ipv4_str>)
```

### Parameters
- `<ipv4_str>`: String to check

### Return Value
Return Type: TINYINT

Return Value Meaning:
- Returns 1: indicates the input is a valid IPv4 address format
- Returns 0: indicates the input is not a valid IPv4 address format
- Returns NULL when input is NULL

### Usage Notes
- Only checks if the string format conforms to IPv4 address specification (A.B.C.D format)
- Does not perform actual IP address conversion, only format validation
- Supports NULL input, returns NULL

## Examples

Check valid IPv4 address format.
```sql
SELECT is_ipv4_string('192.168.1.1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

Check boundary value IPv4 addresses.
```sql
SELECT 
  is_ipv4_string('0.0.0.0') as min_ip,
  is_ipv4_string('255.255.255.255') as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```

Check invalid IPv4 address formats.
```sql
SELECT 
  is_ipv4_string('256.1.1.1') as invalid_range,
  is_ipv4_string('192.168.1') as missing_octet,
  is_ipv4_string('192.168.1.1.1') as extra_octet,
  is_ipv4_string('not-an-ip') as not_ip;
+---------------+----------------+--------------+--------+
| invalid_range | missing_octet | extra_octet | not_ip |
+---------------+----------------+--------------+--------+
| 0             | 0              | 0            | 0      |
+---------------+----------------+--------------+--------+
```

Check NULL input.
```sql
SELECT is_ipv4_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### Keywords

IS_IPV4_STRING

