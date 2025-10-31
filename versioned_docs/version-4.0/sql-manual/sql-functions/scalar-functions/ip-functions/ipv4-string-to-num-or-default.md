---
{
    "title": "IPV4_STRING_TO_NUM_OR_DEFAULT",
    "language": "en"
}
---

## ipv4_string_to_num_or_default

## Description
Takes a string containing an IPv4 address in A.B.C.D format (dot-separated decimal numbers). Returns a BIGINT number representing the corresponding the numeric value of the address in network byte order (big endian) IPv4 address.

## Syntax
```sql
IPV4_STRING_TO_NUM_OR_DEFAULT(<ipv4_string>)
```

### Parameters
- `<ipv4_string>`: IPv4 string address (format A.B.C.D)

### Return Value
Return Type: BIGINT

Return Value Meaning:
- Returns the the numeric value of the address in network byte order (big endian) integer representation of the corresponding IPv4 address
- Returns `0` for invalid IPv4 strings or `NULL` input

### Usage Notes
- This function does not throw exceptions, invalid input uniformly returns 0 (corresponding to `0.0.0.0`)
- Leading/trailing whitespace in input strings is not allowed
- Commonly used in fault-tolerant conversion scenarios, such as cleaning dirty data

## Examples

Convert IPv4 text `192.168.0.1` to the corresponding the numeric value of the address in network byte order (big endian) integer.
```sql
select ipv4_string_to_num_or_default('192.168.0.1');
+----------------------------------------------+
| ipv4_string_to_num_or_default('192.168.0.1') |
+----------------------------------------------+
|                                   3232235521 |
+----------------------------------------------+
```

IPv4 boundary values (minimum and maximum).
```sql
select
  ipv4_string_to_num_or_default('0.0.0.0')         as min_v4,
  ipv4_string_to_num_or_default('255.255.255.255') as max_v4;
+--------+-----------+
| min_v4| max_v4    |
+--------+-----------+
| 0      | 4294967295|
+--------+-----------+
```

Returns 0 for invalid input (no exception thrown).
```sql
select ipv4_string_to_num_or_default('256.0.0.1');
+--------------------------------------------+
| ipv4_string_to_num_or_default('256.0.0.1') |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+

select ipv4_string_to_num_or_default(' 1.1.1.1 ');
+--------------------------------------------+
| ipv4_string_to_num_or_default(' 1.1.1.1 ') |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+

select ipv4_string_to_num_or_default(NULL);
+-------------------------------------+
| ipv4_string_to_num_or_default(NULL) |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

### Keywords

IPV4_STRING_TO_NUM_OR_DEFAULT
