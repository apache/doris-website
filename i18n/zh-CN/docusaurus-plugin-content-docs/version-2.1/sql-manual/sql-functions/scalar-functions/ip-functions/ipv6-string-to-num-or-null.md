---
{
    "title": "IPV6_STRING_TO_NUM_OR_NULL",
    "language": "zh-CN",
    "description": "IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。"
}
---

## 描述
IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。

## 别名
- INET6_ATON

## 语法
```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | 字符串类型的 ipv6 地址  |

## 返回值
返回二进制格式的 IPv6 地址
- 如果输入非法的 IP 地址，会返回 `NULL`
- 如果输入字符串包含有效的 IPv4 地址，则返回其等效的 IPv6 地址

## 举例
```sql
select hex(ipv6_string_to_num_or_null('1111::ffff')) as r1, hex(ipv6_string_to_num_or_null('192.168.0.1')) as r2, hex(ipv6_string_to_num_or_null('notaaddress')) as r3;
```
```text
+----------------------------------+----------------------------------+------+
| r1                               | r2                               | r3   |
+----------------------------------+----------------------------------+------+
| 1111000000000000000000000000FFFF | 00000000000000000000FFFFC0A80001 | NULL |
+----------------------------------+----------------------------------+------+
```
