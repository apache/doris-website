---
{
    "title": "IS_IPV6_STRING",
    "language": "en"
}
---

## is_ipv6_string

## Description
Checks if the input string is a valid IPv6 address format. Returns 1 if it is a valid IPv6 address, returns 0 if it is not.

## Syntax
```sql
IS_IPV6_STRING(<ipv6_str>)
```

### Parameters
- `<ipv6_str>`: String to check

### Return Value
Return Type: TINYINT

Return Value Meaning:
- Returns 1: indicates the input is a valid IPv6 address format
- Returns 0: indicates the input is not a valid IPv6 address format
- Returns NULL when input is NULL

### Usage Notes
- Only checks if the string format conforms to IPv6 address specification
- Does not perform actual IP address conversion, only format validation
- Supports NULL input, returns NULL

## Examples

Check valid IPv6 address format.
```sql
SELECT is_ipv6_string('2001:db8::1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

Check various IPv6 address formats.
```sql
SELECT 
  is_ipv6_string('::1') as localhost,
  is_ipv6_string('2001:db8::1') as standard,
  is_ipv6_string('2001:db8:0:0:0:0:0:1') as expanded;
+-----------+----------+----------+
| localhost | standard | expanded |
+-----------+----------+----------+
| 1         | 1        | 1        |
+-----------+----------+----------+
```

Check invalid IPv6 address formats.
```sql
SELECT 
  is_ipv6_string('2001:db8::1::2') as double_colon,
  is_ipv6_string('2001:db8:1') as too_short,
  is_ipv6_string('2001:db8:1:2:3:4:5:6:7') as too_long,
  is_ipv6_string('not-an-ipv6') as not_ipv6;
+--------------+-----------+----------+----------+
| double_colon | too_short | too_long | not_ipv6 |
+--------------+-----------+----------+----------+
| 0            | 0         | 0        | 0        |
+--------------+-----------+----------+----------+
```

Check NULL input.
```sql
SELECT is_ipv6_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### Keywords

IS_IPV6_STRING
