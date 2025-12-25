---
{
    "title": "IPV4_NUM_TO_STRING | Ip Functions",
    "language": "en",
    "description": "Takes a Int16, Int32, Int64 number. Interprets it as an IPv4 address in big endian."
}
---

## Description
Takes a Int16, Int32, Int64 number. Interprets it as an IPv4 address in big endian. Returns a string containing the corresponding IPv4 address in the format A.B.C.D (dot-separated numbers in decimal form)

## Alias
- INET_NTOA

## Syntax

```sql
IPV4_NUM_TO_STRING(<ipv4_num>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_num>`      | Int type converted from ipv4  |


## Return Value
Returns a string containing the corresponding IPv4 address in the format A.B.C.D (dot-separated numbers in decimal form), special case:
- Will return `NULL` if the input parameter is negative or larger than `4294967295`(num value of `'255.255.255.255'`)

## Example
```sql
select ipv4_num_to_string(3232235521);
```
```text
+--------------------------------+
| ipv4_num_to_string(3232235521) |
+--------------------------------+
| 192.168.0.1                    |
+--------------------------------+
```

```sql
select num,ipv4_num_to_string(num) from ipv4_bi;
```
```text
+------------+---------------------------+
| num        | ipv4_num_to_string(`num`) |
+------------+---------------------------+
|         -1 | NULL                      |
|          0 | 0.0.0.0                   |
| 2130706433 | 127.0.0.1                 |
| 4294967295 | 255.255.255.255           |
| 4294967296 | NULL                      |
+------------+---------------------------+
```

