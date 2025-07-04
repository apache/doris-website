---
{
    "title": "TO_IPV6",
    "language": "zh-CN"
}
---

## 描述
输入 IPv6 地址的字符串形式，并返回 IPv6 类型的值。该值的二进制形式等于 ipv6_string_to_num 函数返回值的二进制形式。

## 语法
```sql
TO_IPV6(<ipv6_str>)
```

## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_str>`      | 字符串类型的 ipv6 地址 |

## 返回值
返回 IPv6 类型的值。
- 如果 IPv6 地址为非法格式，则抛出异常

## 举例
```sql
SELECT to_ipv6('::'),to_ipv6('2001:1b70:a1:610::b102:2');
```
```text
+---------------+-------------------------------------+
| to_ipv6('::') | to_ipv6('2001:1b70:a1:610::b102:2') |
+---------------+-------------------------------------+
| ::            | 2001:1b70:a1:610::b102:2            |
+---------------+-------------------------------------+
```
