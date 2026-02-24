---
{
    "title": "IS_IPV4_COMPAT",
    "language": "zh-CN",
    "description": "该函数采用以数字形式表示的二进制字符串形式的 IPv6 地址，由 INET6ATON 返回。INET6ATON 是 IPV6STRINGTONUMORNULL 的别名"
}
---

## 描述
该函数采用以数字形式表示的二进制字符串形式的 IPv6 地址，由 INET6_ATON 返回。INET6_ATON 是 IPV6_STRING_TO_NUM_OR_NULL 的别名
- IPv4 兼容地址的格式为`::ipv4_address`

## 语法
```sql
IS_IPV4_COMPAT(INET6_ATON(<ipv4_addr>))
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_addr>`      | 兼容 ipv4 的地址，例如 '::ipv4_address'  |

## 返回值
如果参数是有效的 IPv4 兼容 IPv6 地址，则返回 1，否则返回 0
- 如果输入为 NULL, 则返回 NULL

## 举例
```sql
SELECT IS_IPV4_COMPAT(INET6_ATON('::ffff:10.0.5.9')) AS re1, IS_IPV4_COMPAT(INET6_ATON('::10.0.5.9')) AS re2;
```
```text
+------+------+
| re1  | re2  |
+------+------+
|    0 |    1 |
+------+------+
```
