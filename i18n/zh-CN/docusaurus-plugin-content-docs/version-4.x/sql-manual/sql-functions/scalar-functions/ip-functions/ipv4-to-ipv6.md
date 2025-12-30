---
{
    "title": "IPV4_TO_IPV6",
    "language": "zh-CN",
    "description": "将 IPv4 地址转换为 IPv6 地址。转换后的 IPv6 地址是 IPv4 映射地址，格式为 ::ffff:IPv4。"
}
---

## ipv4_to_ipv6

## 描述
将 IPv4 地址转换为 IPv6 地址。转换后的 IPv6 地址是 IPv4 映射地址，格式为 `::ffff:IPv4`。

## 语法
```sql
IPV4_TO_IPV6(<ipv4_address>)
```

### 参数
- `<ipv4_address>`：IPv4 类型的地址

### 返回值
返回类型：IPv6

返回值含义：
- 返回对应的 IPv6 地址，格式为 `::ffff:IPv4`
- 这是标准的 IPv4 映射 IPv6 地址格式

### 使用说明
- 将 IPv4 地址嵌入到 IPv6 地址中，使用标准的 IPv4 映射格式
- 转换后的地址可以用于 IPv6 网络中的 IPv4 兼容性
- 支持所有有效的 IPv4 地址
- 输入参数为 NULL 时返回 NULL

## 举例

将 IPv4 地址转换为 IPv6 地址。
```sql
SELECT ipv4_to_ipv6(to_ipv4('192.168.1.1')) as ipv6_address;
+--------------------+
| ipv6_address       |
+--------------------+
| ::ffff:192.168.1.1 |
+--------------------+
```

转换多个 IPv4 地址。
```sql
SELECT 
  ipv4_to_ipv6(to_ipv4('10.0.0.1')) as private_ip,
  ipv4_to_ipv6(to_ipv4('8.8.8.8')) as public_ip;
+-----------------+----------------+
| private_ip      | public_ip      |
+-----------------+----------------+
| ::ffff:10.0.0.1 | ::ffff:8.8.8.8 |
+-----------------+----------------+
```

转换边界值 IPv4 地址。
```sql
SELECT 
  ipv4_to_ipv6(to_ipv4('0.0.0.0')) as min_ip,
  ipv4_to_ipv6(to_ipv4('255.255.255.255')) as max_ip;
+----------------+------------------------+
| min_ip         | max_ip                 |
+----------------+------------------------+
| ::ffff:0.0.0.0 | ::ffff:255.255.255.255 |
+----------------+------------------------+
```

输入参数为 NULL 返回 NULL。
```sql
SELECT ipv4_to_ipv6(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

### Keywords

IPV4_TO_IPV6

