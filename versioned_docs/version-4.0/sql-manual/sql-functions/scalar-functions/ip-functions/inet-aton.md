---
{
    "title": "inet_aton",
    "language": "en"
}
---

## inet_aton

Alias for `ipv4_string_to_num_or_null`.

## Description
Converts an IPv4 text address (A.B.C.D) to the corresponding an integer that represents the numeric value of the address in network byte order (big endian)

## Syntax
```sql
IPV4_STRING_TO_NUM_OR_NULL(<ipv4_string>)
```

### Parameters
- `<ipv4_string>`: IPv4 string address (format A.B.C.D)

### Return Value
Return Type: BIGINT

Return Value Meaning:
- Returns an integer that represents the numeric value of the address in network byte order (big endian) representation of the corresponding IPv4 address
- Returns `NULL` when input is NULL
- Returns `NULL` for invalid IPv4 strings

### Usage Notes
- Behaves consistently with `ipv4_string_to_num_or_null`: returns `NULL` for invalid input
- Commonly used for compatibility with MySQL's `INET_ATON` syntax

## Examples

Convert IPv4 text `192.168.0.1` to the corresponding the the numeric value of the address in network byte order (big endian) integer.
```sql
select ipv4_string_to_num_or_null('192.168.0.1');
+-------------------------------------------+
| ipv4_string_to_num_or_null('192.168.0.1') |
+-------------------------------------------+
|                                3232235521 |
+-------------------------------------------+
```

IPv4 boundary values (minimum and maximum).
```sql
select ipv4_string_to_num_or_null('0.0.0.0') as min_v4,
       ipv4_string_to_num_or_null('255.255.255.255') as max_v4;
+--------+------------+
| min_v4 | max_v4     |
+--------+------------+
|      0 | 4294967295 |
+--------+------------+
```

Parameter as NULL returns NULL
```sql
select ipv4_string_to_num_or_null(NULL);
+----------------------------------+
| ipv4_string_to_num_or_null(NULL) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

Returns NULL for invalid input (no exception thrown).
```sql
select ipv4_string_to_num_or_null('256.0.0.1');
+-----------------------------------------+
| ipv4_string_to_num_or_null('256.0.0.1') |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

```sql
select ipv4_string_to_num_or_null(' 1.1.1.1 ');
+-----------------------------------------+
| ipv4_string_to_num_or_null(' 1.1.1.1 ') |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

```sql
select ipv4_string_to_num_or_null('invalid');
+---------------------------------------+
| ipv4_string_to_num_or_null('invalid') |
+---------------------------------------+
|                                  NULL |
+---------------------------------------+
```

### Keywords

INET_ATON, IPV4_STRING_TO_NUM_OR_NULL

