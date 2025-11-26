---
{
    "title": "IPV4_STRING_TO_NUM_OR_NULL",
    "language": "en"
}
---

## Description
Takes a string containing an IPv4 address in the format A.B.C.D (dot-separated numbers in decimal form). Returns a BIGINT number representing the corresponding IPv4 address in big endian.

## Alias
- INET_ATON

## Syntax
```sql
IPV4_STRING_TO_NUM_OR_NULL(<ipv4_string>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_string>`      | String type of ipv4, like 'A.B.C.D'  |

## Return Value
Returns a BIGINT number representing the corresponding IPv4 address in big endian.
- If the input string is not a valid IPv4 address, `NULL` is returned.

## Example
```sql
select ipv4_string_to_num_or_null('192.168.0.1'); 
```
```text
+-------------------------------------------+ 
| ipv4_string_to_num_or_null('192.168.0.1') | 
+-------------------------------------------+ 
| 3232235521                                | 
+-------------------------------------------+ 
```

```sql
select str, ipv4_string_to_num_or_null(str) from ipv4_str; 
```
```text
+-----------------+---------------------------------+ 
|str              | ipv4_string_to_num_or_null(str) | 
+-----------------+---------------------------------+ 
| 0.0.0.0         | 0                               | 
| 127.0.0.1       | 2130706433                      | 
| 255.255.255.255 | 4294967295                      | 
| invalid         | NULL                            | 
+-----------------+---------------------------------+ 
```
