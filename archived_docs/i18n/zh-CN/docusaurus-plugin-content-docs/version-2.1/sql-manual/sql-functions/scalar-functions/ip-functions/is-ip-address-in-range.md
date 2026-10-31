---
{
    "title": "IS_IP_ADDRESS_IN_RANGE",
    "language": "zh-CN",
    "description": "判断 IP（IPv4 或 IPv6）地址是否包含在以 CIDR 表示法表示的网络中。"
}
---

## 描述
判断 IP（IPv4 或 IPv6）地址是否包含在以 CIDR 表示法表示的网络中。

## 语法
```sql
IS_IP_ADDRESS_IN_RANGE(ip_str, cidr_prefix)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ip_str>`      | 字符串类型的 ipv4 或者 ipv6 地址 |
| `<cidr_prefix>`      | cidr 前缀 |

## 返回值
如果 IP（IPv4 或 IPv6）地址是包含在以 CIDR 表示法表示的网络中，则返回 true，否则返回 false。
- 如果输入值为 NULL, 则返回 NULL

## 举例
```sql
SELECT is_ip_address_in_range('127.0.0.1', '127.0.0.0/8') as v4, is_ip_address_in_range('::ffff:192.168.0.1', '::ffff:192.168.0.4/128') as v6, is_ip_address_in_range('127.0.0.1', NULL) as nil;
```
```text
+------+------+------+
| v4   | v6   | nil  |
+------+------+------+
|    1 |    0 | NULL |
+------+------+------+
```
