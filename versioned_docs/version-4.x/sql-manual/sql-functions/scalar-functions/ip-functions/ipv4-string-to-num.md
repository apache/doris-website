---
{
    "title": "IPV4_STRING_TO_NUM",
    "language": "en",
    "description": "Takes a string containing an IPv4 address in A.B.C.D format (dot-separated decimal numbers)."
}
---

## ipv4_string_to_num

## Description
Takes a string containing an IPv4 address in A.B.C.D format (dot-separated decimal numbers). Returns the the numeric value of the address in network byte order (big endian) integer corresponding IPv4 address.

## Syntax
```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```

### Parameters
- `<ipv4_string>`: IPv4 string address (format A.B.C.D)

### Return Value
Return Type: BIGINT

Return Value Meaning:
- Returns the the numeric value of the address in network byte order (big endian) integer representation of the corresponding IPv4 address
- Throws an exception for invalid IPv4 strings or `NULL` input

### Usage Notes
- Only supports standard IPv4 text, does not support CIDR (like `/24`), ports (like `:80`), or other extended formats
- Does not perform implicit trimming or type conversion, strings with leading/trailing whitespace are considered invalid
- Commonly used with `inet_ntoa`, `to_ipv4` for mutual conversion

## Examples

Convert IPv4 text `192.168.0.1` to the corresponding the the numeric value of the address in network byte order (big endian) integer.
```sql
select ipv4_string_to_num('192.168.0.1');
+-----------------------------------+
| ipv4_string_to_num('192.168.0.1') |
+-----------------------------------+
| 3232235521                        |
+-----------------------------------+
```

IPv4 boundary values (minimum and maximum).
```sql
select
  ipv4_string_to_num('0.0.0.0')             as min_v4,
  ipv4_string_to_num('255.255.255.255')     as max_v4;
+--------+-----------+
| min_v4| max_v4    |
+--------+-----------+
| 0      | 4294967295|
+--------+-----------+
```

Invalid input triggers exceptions (segment value out of range/contains whitespace/NULL).
```sql
select ipv4_string_to_num('256.0.0.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(' 1.1.1.1 ');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv4 value like '0.0.0.0' first
```

Mutual conversion examples with `inet_ntoa`/`ipv4_num_to_string` and `to_ipv4`: IPv4 text → integer → IPv4 text → IPv4 type.
```sql
-- Step 1: IPv4 text to integer
SELECT ipv4_string_to_num('192.168.1.1') as ipv4_int;
+------------+
| ipv4_int   |
+------------+
| 3232235777 |
+------------+

-- Step 2: Integer back to IPv4 text
SELECT ipv4_num_to_string(ipv4_string_to_num('192.168.1.1')) as back_to_text;
+----------------+
| back_to_text   |
+----------------+
| 192.168.1.1    |
+----------------+

-- Step 3: IPv4 text to IPv4 type
SELECT to_ipv4(ipv4_num_to_string(ipv4_string_to_num('192.168.1.1'))) as ipv4_type;
+-------------+
| ipv4_type   |
+-------------+
| 192.168.1.1 |
+-------------+
```

### Keywords

IPV4_STRING_TO_NUM
