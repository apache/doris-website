---
{
  "title": "IS_IPV4_STRING",
  "language": "ja",
  "description": "IPv4形式のアドレスが有効なIPv4アドレスかどうかを判定する。"
}
---
## 説明
IPv4形式のアドレスが有効なIPv4アドレスかどうかを判定します。

## 構文

```sql
IS_IPV4_STRING(<ipv4_str>)
```
## パラメータ
| パラメータ | 説明                                      |
|-----------|--------------------------------------------------|
| `<ipv4_str>`      | String型のIPv4アドレス |


## 戻り値
正しくフォーマットされ有効なIPv4アドレスの場合、trueを返します。そうでない場合、falseを返します。
- 入力がNULLの場合、関数はNULLを返します。


## 例

```sql
CREATE TABLE `test_is_ipv4_string` (
      `id` int,
      `ip_v4` string
    ) ENGINE=OLAP
    DISTRIBUTED BY HASH(`id`) BUCKETS 4
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
    );
    
insert into test_is_ipv4_string values(0, NULL), (1, '0.0.0.'), (2, ''), (3, '.'), (4, '255.255.255.255');

select id, ip_v4, is_ipv4_string(ip_v4) from test_is_ipv4_string order by id;
```
```text
+------+-----------------+-----------------------+
| id   | ip_v4           | is_ipv4_string(ip_v4) |
+------+-----------------+-----------------------+
|    0 | NULL            |                  NULL |
|    1 | 0.0.0.          |                     0 |
|    2 |                 |                     0 |
|    3 | .               |                     0 |
|    4 | 255.255.255.255 |                     1 |
+------+-----------------+-----------------------+
```
