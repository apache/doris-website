---
{
    "title": "IS_IPV6_STRING",
    "language": "en",
    "description": "Determine whether an IPv6-type address is a valid IPv6 address."
}
---

## Description
Determine whether an IPv6-type address is a valid IPv6 address.

## Syntax
```sql
IS_IPV6_STRING(<ipv6_str>)
```

## Parameters
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_str>`      | An IPv6 address of type String |


## Return Value
If it is a correctly formatted and valid IPv6 address, return true; On the contrary, return false.
- If input is NULL, the function returns NULL.


## Example
```sql
CREATE TABLE `test_is_ipv6_string` (
      `id` int,
      `ip_v6` string
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(`id`) BUCKETS 4
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
    );
    
insert into test_is_ipv6_string values(0, NULL), (1, '::'), (2, ''), (3, '2001:1b70:a1:610::b102:2'), (4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg');

select id, ip_v6, is_ipv6_string(ip_v6) from test_is_ipv6_string order by id;
```
```text
+------+------------------------------------------+-----------------------+
| id   | ip_v6                                    | is_ipv6_string(ip_v6) |
+------+------------------------------------------+-----------------------+
|    0 | NULL                                     |                  NULL |
|    1 | ::                                       |                     1 |
|    2 |                                          |                     0 |
|    3 | 2001:1b70:a1:610::b102:2                 |                     1 |
|    4 | ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg |                     0 |
+------+------------------------------------------+-----------------------+
```
