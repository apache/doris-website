---
{
  "title": "IS_IPV6_STRING",
  "description": "IPv6タイプのアドレスが有効なIPv6アドレスかどうかを判定します。",
  "language": "ja"
}
---
## 説明
IPv6形式のアドレスが有効なIPv6アドレスかどうかを判定します。

## 構文

```sql
IS_IPV6_STRING(<ipv6_str>)
```
## パラメータ
| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<ipv6_str>`      | String型のIPv6アドレス |


## Return Value
正しい形式で有効なIPv6アドレスの場合、trueを返します。そうでない場合、falseを返します。
- 入力がNULLの場合、関数はNULLを返します。


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
