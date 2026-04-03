---
{
  "title": "IPV4",
  "description": "IPv4型は、4バイトのUInt32の形式で格納され、IPv4アドレスを表現するために使用されます。値の範囲は['0.0.0.0', '255.255.255.255']です。",
  "language": "ja"
}
---
## IPV4

### description

IPv4型は、IPv4アドレスを表現するために使用される、4バイトのUInt32形式で格納される型です。
値の範囲は['0.0.0.0', '255.255.255.255']です。

`値の範囲を超える入力や無効な形式の入力はNULLを返します`

### example

table作成例：

```
CREATE TABLE ipv4_test (
  `id` int,
  `ip_v4` ipv4
) ENGINE=OLAP
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```
データ挿入例:

```
insert into ipv4_test values(1, '0.0.0.0');
insert into ipv4_test values(2, '127.0.0.1');
insert into ipv4_test values(3, '59.50.185.152');
insert into ipv4_test values(4, '255.255.255.255');
insert into ipv4_test values(5, '255.255.255.256'); // invalid data
```
データ選択例:

```
mysql> select * from ipv4_test order by id;
+------+-----------------+
| id   | ip_v4           |
+------+-----------------+
|    1 | 0.0.0.0         |
|    2 | 127.0.0.1       |
|    3 | 59.50.185.152   |
|    4 | 255.255.255.255 |
|    5 | NULL            |
+------+-----------------+
```
### keywords

IPV4
