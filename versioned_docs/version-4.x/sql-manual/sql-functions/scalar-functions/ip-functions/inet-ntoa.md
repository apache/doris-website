---
{
    "title": "IPV4_NUM_TO_STRING | Ip Functions",
    "language": "en",
    "description": "Alias for ipv4numtostring."
}
---

# IPV4_NUM_TO_STRING

## inet_ntoa
Alias for `ipv4_num_to_string`.

## Description
Accepts an IPv4 address of type Int8, Int16, Int32, or Int64 in an integer that represents the numeric value of the address in network byte order (big endian) and returns the corresponding IPv4 string representation in A.B.C.D format (dot-separated decimal numbers).

## Syntax
```sql
IPV4_NUM_TO_STRING(<ipv4_num>)
```

### Parameters
- `<ipv4_num>`: Integer value converted from IPv4 address (supports Int8/Int16/Int32/Int64)

### Return Value
Return Type: VARCHAR

Return Value Meaning:
- Returns the text form of IPv4 (A.B.C.D)
- Returns NULL when output parameter is NULL
- Returns `NULL` for negative numbers or input exceeding `4294967295`

### Usage Notes
- Behaves consistently with `ipv4_num_to_string`: does not accept out-of-range values; negative numbers and values greater than 4294967295 return `NULL`
- Commonly used for compatibility with MySQL's `INET_NTOA` syntax

## Examples

Convert integer `3232235521` to IPv4 text.
```sql
select ipv4_num_to_string(3232235521);
+--------------------------------+
| ipv4_num_to_string(3232235521) |
+--------------------------------+
| 192.168.0.1                    |
+--------------------------------+
```

IPv4 numeric boundary values (minimum and maximum).
```sql
select ipv4_num_to_string(0) as min_v4, ipv4_num_to_string(4294967295) as max_v4;
+---------+---------------+
| min_v4 | max_v4        |
+---------+---------------+
| 0.0.0.0| 255.255.255.255|
+---------+---------------+
```

Parameter as NULL returns NULL
```sql
select ipv4_num_to_string(NULL);
+--------------------------+
| ipv4_num_to_string(NULL) |
+--------------------------+
| NULL                     |
+--------------------------+
```

Returns NULL for invalid numeric input (no exception thrown).
```sql
select ipv4_num_to_string(-1);
+--------------------------+
| ipv4_num_to_string(-1)   |
+--------------------------+
| NULL                     |
+--------------------------+
```

```sql
select ipv4_num_to_string(4294967296);
+--------------------------------+
| ipv4_num_to_string(4294967296) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

### Keywords

INET_NTOA, IPV4_NUM_TO_STRING


