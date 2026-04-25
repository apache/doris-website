---
{
    "title": "IPV4",
    "language": "zh-CN",
    "description": "IPv4 类型，以 UInt32 的形式存储在 4 个字节中，用于表示 IPv4 地址。 取值范围是 ['0.0.0.0', '255.255.255.255']。"
}
---

## IPV4

## 描述

IPv4 类型，以 UInt32 的形式存储在 4 个字节中，用于表示 IPv4 地址。
取值范围是 ['0.0.0.0', '255.255.255.255']。

`超出取值范围或者格式非法的输入将返回NULL`

## 举例
    
建表示例如下：

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

插入数据示例：

```
insert into ipv4_test values(1, '0.0.0.0');
insert into ipv4_test values(2, '127.0.0.1');
insert into ipv4_test values(3, '59.50.185.152');
insert into ipv4_test values(4, '255.255.255.255');
insert into ipv4_test values(5, '255.255.255.256'); // invalid data
```

查询数据示例：

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
