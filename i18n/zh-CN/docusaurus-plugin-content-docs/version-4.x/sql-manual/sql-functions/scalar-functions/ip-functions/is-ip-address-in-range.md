---
{
    "title": "IS_IP_ADDRESS_IN_RANGE",
    "language": "zh-CN",
    "description": "检查指定的 IP 地址是否在给定的 CIDR 网段范围内。支持 IPv4 和 IPv6 地址。"
}
---

## is_ip_address_in_range

## 描述
检查指定的 IP 地址是否在给定的 CIDR 网段范围内。支持 IPv4 和 IPv6 地址。

## 语法
```sql
IS_IP_ADDRESS_IN_RANGE(<ip_address>, <cidr_range>)
```

### 参数
- `<ip_address>`：要检查的 IP 地址（IPv4、IPv6 类型或字符串）
- `<cidr_range>`：CIDR 网段范围（字符串格式，如 "192.168.1.0/24"）

### 返回值
返回类型：TINYINT

返回值含义：
- 返回 1：表示 IP 地址在指定的 CIDR 范围内
- 返回 0：表示 IP 地址不在指定的 CIDR 范围内
- 输入 NULL 时返回 0

### 使用说明
- 支持 IPv4 和 IPv6 地址的检查
- CIDR 范围必须是有效的格式（如 "192.168.1.0/24" 或 "2001:db8::/64"）
- 支持倒排索引优化，当 CIDR 参数为常量时可以使用索引加速查询
- 对于无效的 CIDR 格式，返回 0
- 输入参数为 NULL 时返回 NULL

## 举例

检查 IPv4 地址是否在指定网段内。
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

检查 IPv6 地址是否在指定网段内。
```sql
SELECT is_ip_address_in_range(INET6_ATON('2001:db8::100'), '2001:db8::/64') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

检查多个地址是否在指定网段内。
```sql
SELECT 
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_192_168_1,
  is_ip_address_in_range(to_ipv4('192.168.2.100'), '192.168.1.0/24') as in_192_168_2,
  is_ip_address_in_range(to_ipv4('10.0.0.1'), '192.168.1.0/24') as in_10_0_0;
+-------------+-------------+----------+
| in_192_168_1| in_192_168_2| in_10_0_0|
+-------------+-------------+----------+
| 1           | 0           | 0        |
+-------------+-------------+----------+
```

检查不同 CIDR 前缀长度的范围。
```sql
SELECT 
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.0.0/16') as in_16,
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_24,
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.100/32') as in_32;
+--------+--------+--------+
| in_16  | in_24  | in_32  |
+--------+--------+--------+
| 1      | 1      | 1      |
+--------+--------+--------+
```

无效的 CIDR 格式返回 0。
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), 'invalid-cidr') as in_range;
+----------+
| in_range |
+----------+
| 0        |
+----------+
```

输入参数为 NULL 返回 NULL。
```sql
SELECT is_ip_address_in_range(NULL, '192.168.1.0/24') as null_ip;
+---------+
| null_ip |
+---------+
| NULL    |
+---------+

SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), NULL) as null_cidr;
+-----------+
| null_cidr |
+-----------+
| NULL      |
+-----------+

SELECT is_ip_address_in_range(NULL, NULL) as both_null;
+-----------+
| both_null |
+-----------+
| NULL      |
+-----------+
```

### Keywords

IS_IP_ADDRESS_IN_RANGE

