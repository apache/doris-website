---
{
    "title": "IPV4",
    "language": "ja",
    "description": "IPv4 型は、IPv4 アドレスを表すために使用され、4 バイトの UInt32 形式で格納されます。値の範囲は ['0.0.0.0', '255.255.255.255'] です。"
}
---

## IPV4

### 説明

IPv4 型は、IPv4 アドレスを表すために使用され、4 バイトの UInt32 形式で格納されます。
値の範囲は ['0.0.0.0', '255.255.255.255'] です。

`Inputs that exceed the value range or have invalid format will return NULL`（値の範囲外または形式が無効な入力は NULL を返します）

### 例

テーブルの作成例：

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

データの挿入例：

```
insert into ipv4_test values(1, '0.0.0.0');
insert into ipv4_test values(2, '127.0.0.1');
insert into ipv4_test values(3, '59.50.185.152');
insert into ipv4_test values(4, '255.255.255.255');
insert into ipv4_test values(5, '255.255.255.256'); // invalid data
```

データの検索例：

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

### キーワード

IPV4
