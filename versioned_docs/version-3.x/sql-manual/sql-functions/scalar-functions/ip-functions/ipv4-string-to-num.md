---
{
    "title": "IPV4_STRING_TO_NUM",
    "language": "en"
}
---

## Description
Takes a string containing an IPv4 address in the format A.B.C.D (dot-separated numbers in decimal form). Returns a BIGINT number representing the corresponding IPv4 address in big endian.

## Syntax
```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_string>`      | String type of ipv4, like 'A.B.C.D'  |

## Return Value
Returns a BIGINT number representing the corresponding IPv4 address in big endian.
- If the input string is not a valid IPv4 address or `NULL`, an error is returned

## Example
```sql
select ipv4_string_to_num('192.168.0.1'); 
```
```text
+-----------------------------------+ 
| ipv4_string_to_num('192.168.0.1') | 
+-----------------------------------+ 
| 3232235521                        | 
+-----------------------------------+ 
```

```sql
select ipv4_string_to_num('invalid');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (172.17.0.2)[CANCELLED][INVALID_ARGUMENT][E33] Invalid IPv4 value
```
