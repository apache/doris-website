---
{
    "title": "IPV6_STRING_TO_NUM",
    "language": "zh-CN",
    "description": "IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。"
}
---

## 描述
IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。

## 语法
```sql
IPV6_STRING_TO_NUM(<ipv6_string>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | 字符串类型的 ipv6 地址  |

## 返回值
返回二进制格式的 IPv6 地址。
- 如果输入非法的 IP 地址或者 `NULL`，会抛出异常
- 如果输入字符串包含有效的 IPv4 地址，则返回其等效的 IPv6 地址。

## 举例
```sql
select hex(ipv6_string_to_num('1111::ffff')), hex(ipv6_string_to_num('192.168.0.1'));
```
```text
+---------------------------------------+----------------------------------------+
| hex(ipv6_string_to_num('1111::ffff')) | hex(ipv6_string_to_num('192.168.0.1')) |
+---------------------------------------+----------------------------------------+
| 1111000000000000000000000000FFFF      | 00000000000000000000FFFFC0A80001       |
+---------------------------------------+----------------------------------------+
```
```sql
select hex(ipv6_string_to_num('notaaddress'));
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (172.17.0.2)[CANCELLED][E33] Invalid IPv6 value
```
