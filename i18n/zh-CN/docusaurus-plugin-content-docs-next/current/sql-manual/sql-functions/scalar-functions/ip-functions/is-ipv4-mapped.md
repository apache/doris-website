---
{
    "title": "IS_IPV4_MAPPED",
    "language": "zh-CN",
    "description": "检查 IPv6 地址是否为 IPv4 映射地址。IPv4 映射地址是一种特殊的 IPv6 地址格式，用于在 IPv6 网络中表示 IPv4 地址。"
}
---

## is_ipv4_mapped

## 描述
检查 IPv6 地址是否为 IPv4 映射地址。IPv4 映射地址是一种特殊的 IPv6 地址格式，用于在 IPv6 网络中表示 IPv4 地址。

## 语法
```sql
IS_IPV4_MAPPED(<ipv6_address>)
```

### 参数
- `<ipv6_address>`：IPv6 地址的二进制表示（VARCHAR 类型，16 字节）

### 返回值
返回类型：TINYINT

返回值含义：1 表示是 IPv4 映射地址，0 表示不是 IPv4 映射地址

### 使用说明
- IPv4 映射地址的格式为 `::ffff:IPv4`，即前 10 个字节为 0，第 11-12 字节为 0xFFFF，后 4 个字节包含 IPv4 地址
- 输入必须是 16 字节的 IPv6 二进制数据
- 这种格式在 RFC 4291 中定义，是最常用的 IPv6 中表示 IPv4 地址的方式
- 输入参数为 NULL 时返回 NULL

## 举例

检查 IPv4 映射地址。
```sql
SELECT is_ipv4_mapped(INET6_ATON('::ffff:192.168.1.1')) as is_mapped;
+-----------+
| is_mapped |
+-----------+
| 1         |
+-----------+
```

检查非 IPv4 映射地址。
```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('2001:db8::1')) as standard_ipv6,
  is_ipv4_mapped(INET6_ATON('::192.168.1.1')) as ipv4_compat;
+--------------+------------+
| standard_ipv6| ipv4_compat|
+--------------+------------+
| 0            | 0          |
+--------------+------------+
```

检查边界值。
```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('::ffff:0.0.0.0')) as min_ip,
  is_ipv4_mapped(INET6_ATON('::ffff:255.255.255.255')) as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```

输入参数为 NULL 返回 0。
```sql
SELECT is_ipv4_mapped(NULL) as null_result;
+-------------+
| null_result |
+-------------+
|        NULL |
+-------------+
```

### Keywords

IS_IPV4_MAPPED

