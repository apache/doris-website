---
{
    "title": "IPV6_CIDR_TO_RANGE",
    "language": "zh-CN",
    "description": "根据 IPv6 地址和 CIDR 前缀长度，计算该网段的最小和最大 IPv6 地址，返回一个包含两个 IPv6 地址的结构体。"
}
---

## ipv6_cidr_to_range

## 描述
根据 IPv6 地址和 CIDR 前缀长度，计算该网段的最小和最大 IPv6 地址，返回一个包含两个 IPv6 地址的结构体。

## 语法
```sql
IPV6_CIDR_TO_RANGE(<ipv6_address>, <cidr_prefix>)
```

### 参数
- `<ipv6_address>`：IPv6 类型的地址或 IPv6 字符串
- `<cidr_prefix>`：CIDR 前缀长度（SMALLINT 类型，范围 0-128）

### 返回值
返回类型：STRUCT<min: IPv6, max: IPv6>

返回值含义：
- 返回一个结构体，包含两个字段：
  - `min`：网段的最小 IPv6 地址
  - `max`：网段的最大 IPv6 地址

### 使用说明
- CIDR 前缀长度必须在 0-128 范围内
- 支持 IPv6 类型和字符串类型的输入
- 计算基于网络掩码，将主机位全部置零得到最小地址，全部置一得到最大地址
- 支持常量参数和列参数的各种组合

## 举例

计算 /64 网段的地址范围。
```sql
SELECT ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 64) as range;
+----------------------------------------+
| range                                  |
+----------------------------------------+
| {"min": "2001:db8::", "max": "2001:db8::ffff:ffff:ffff:ffff"} |
+----------------------------------------+
```

计算 /48 网段的地址范围。
```sql
SELECT ipv6_cidr_to_range(INET6_ATON('2001:db8:1::1'), 48) as range;
+----------------------------------------+
| range                                  |
+----------------------------------------+
| {"min": "2001:db8:1::", "max": "2001:db8:1:ffff:ffff:ffff:ffff"} |
+----------------------------------------+
```

访问结构体中的具体字段。
```sql
SELECT 
  ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 64).min as min_ip,
  ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 64).max as max_ip;
+-------------+----------------------------------+
| min_ip      | max_ip                           |
+-------------+----------------------------------+
| 2001:db8::  | 2001:db8::ffff:ffff:ffff:ffff   |
+-------------+----------------------------------+
```

CIDR 前缀超出范围会抛出异常。
```sql
SELECT ipv6_cidr_to_range(INET6_ATON('2001:db8::1'), 129);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal cidr value '129'
```

### Keywords

IPV6_CIDR_TO_RANGE

