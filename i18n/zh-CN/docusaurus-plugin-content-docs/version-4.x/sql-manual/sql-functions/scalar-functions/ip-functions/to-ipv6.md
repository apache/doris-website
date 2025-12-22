---
{
    "title": "TO_IPV6",
    "language": "zh-CN",
    "description": "输入 IPv6 地址的字符串形式，并返回 IPv6 类型的值。该值的二进制形式等于 ipv6stringtonum 函数返回值的二进制形式。"
}
---

## to_ipv6

## 描述
输入 IPv6 地址的字符串形式，并返回 IPv6 类型的值。该值的二进制形式等于 `ipv6_string_to_num` 函数返回值的二进制形式。

## 语法
```sql
TO_IPV6(<ipv6_str>)
```

### 参数
- `<ipv6_str>`：字符串类型的 IPv6 地址

### 返回值
返回类型：IPv6

返回值含义：
- 返回 IPv6 类型值
- 输入 NULL 会抛出异常
- 非法 IPv6 地址或 `NULL` 输入会抛出异常

### 使用说明
- 等价于 `to_ipv6` → `IPv6` 类型，适合建表为 `IPv6` 列的场景

## 举例

将 IPv6 文本 `2001:1b70:a1:610::b102:2` 转为 `IPv6` 类型。
```sql
SELECT to_ipv6('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```

输入 NULL 会抛出异常
```sql
SELECT to_ipv6(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv6 must be String, not NULL
```

非法 IPv6 文本会抛出异常。
```sql
SELECT to_ipv6('not-an-ip');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### Keywords

TO_IPV6


