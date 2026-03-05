---
{
    "title": "IPV6",
    "language": "zh-CN",
    "description": "IPv6 类型，以 UInt128 的形式存储在 16 个字节中，用于表示 IPv6 地址。 取值范围是 ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']。"
}
---

## IPV6

## 描述

IPv6 类型，以 UInt128 的形式存储在 16 个字节中，用于表示 IPv6 地址。
取值范围是 ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']。

`超出取值范围或者格式非法的输入将返回NULL`

## 举例
    
建表示例如下：

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

插入数据示例：

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```

查询数据示例：

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
