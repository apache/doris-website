---
{
  "title": "IPv6",
  "language": "ja",
  "description": "IPv6型、16バイトのUInt128形式で保存され、IPv6アドレスを表現するために使用される。値の範囲は['::',"
}
---
## IPV6

### description

IPv6型は、IPv6アドレスを表現するために使用され、16バイトのUInt128形式で格納されます。
値の範囲は['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']です。

`値の範囲を超える入力や無効な形式の入力はNULLを返します`

### example

テーブル作成例：

```
CREATE TABLE ipv6_test (
  `id` int,
  `ip_v6` ipv6
) ENGINE=OLAP
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```
データ挿入例:

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```
データ選択の例:

```
mysql> select * from ipv6_test order by id;
+------+-----------------------------------------+
| id   | ip_v6                                   |
+------+-----------------------------------------+
|    1 | ::                                      |
|    2 | 2001:16a0:2:200a::2                     |
|    3 | ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff |
|    4 | NULL                                    |
+------+-----------------------------------------+
```
### keywords

IPV6
