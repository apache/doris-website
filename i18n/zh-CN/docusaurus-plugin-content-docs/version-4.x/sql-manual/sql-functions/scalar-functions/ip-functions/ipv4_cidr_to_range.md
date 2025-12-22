---
{
    "title": "IPV4_CIDR_TO_RANGE",
    "language": "zh-CN",
    "description": "根据 IPv4 地址和 CIDR 前缀长度，计算该网段的最小和最大 IPv4 地址，返回一个包含两个 IPv4 地址的结构体。"
}
---

## ipv4_cidr_to_range

## 描述
根据 IPv4 地址和 CIDR 前缀长度，计算该网段的最小和最大 IPv4 地址，返回一个包含两个 IPv4 地址的结构体。

## 语法
```sql
IPV4_CIDR_TO_RANGE(<ipv4_address>, <cidr_prefix>)
```

### 参数
- `<ipv4_address>`：IPv4 类型的地址
- `<cidr_prefix>`：CIDR 前缀长度（SMALLINT 类型，范围 0-32）

### 返回值
返回类型：STRUCT<min: IPv4, max: IPv4>

返回值含义：
- 返回一个结构体，包含两个字段：`min`：网段的最小 IPv4 地址，`max`：网段的最大 IPv4 地址
- `<ipv4_address>` `<cidr_prefix>` 输入参数任意一个为NULL， 返回NULL

### 使用说明
- CIDR 前缀长度必须在 0-32 范围内
- 计算基于网络掩码，将主机位全部置零得到最小地址，全部置一得到最大地址
- 支持常量参数和列参数的各种组合

## 举例

计算 /24 网段的地址范围。
```sql
SELECT ipv4_cidr_to_range(to_ipv4('192.168.1.1'), 24);
+------------------------------------------------+
| ipv4_cidr_to_range(to_ipv4('192.168.1.1'), 24) |
+------------------------------------------------+
| {"min":"192.168.1.0", "max":"192.168.1.255"}   |
+------------------------------------------------+
```

计算 /16 网段的地址范围。
```sql
SELECT ipv4_cidr_to_range(to_ipv4('10.0.0.1'), 16);
+---------------------------------------------+
| ipv4_cidr_to_range(to_ipv4('10.0.0.1'), 16) |
+---------------------------------------------+
| {"min":"10.0.0.0", "max":"10.0.255.255"}    |
+---------------------------------------------+
```

访问结构体中的具体字段。
```sql
 SELECT  
    struct_element( ipv4_cidr_to_range(to_ipv4('172.16.1.1'), 24), "min")  as min_ip, 
    struct_element( ipv4_cidr_to_range(to_ipv4('172.16.1.1'), 24), "max")  as max_ip;
+------------+--------------+
| min_ip     | max_ip       |
+------------+--------------+
| 172.16.1.0 | 172.16.1.255 |
+------------+--------------+
```

参数为NULL 返回 NULL
```sql
select ipv4_cidr_to_range(NULL, NULL);
+--------------------------------+
| ipv4_cidr_to_range(NULL, NULL) |
+--------------------------------+
| NULL                           |
+--------------------------------+

select ipv4_cidr_to_range(NULL, 24);
+------------------------------+
| ipv4_cidr_to_range(NULL, 24) |
+------------------------------+
| NULL                         |
+------------------------------+

select ipv4_cidr_to_range(to_ipv4('192.168.1.1'), NULL);
+--------------------------------------------------+
| ipv4_cidr_to_range(to_ipv4('192.168.1.1'), NULL) |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+
```


CIDR 前缀超出范围会抛出异常。
```sql
SELECT ipv4_cidr_to_range(to_ipv4('192.168.1.1'), 33);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal cidr value '33'
```

### Keywords

IPV4_CIDR_TO_RANGE

