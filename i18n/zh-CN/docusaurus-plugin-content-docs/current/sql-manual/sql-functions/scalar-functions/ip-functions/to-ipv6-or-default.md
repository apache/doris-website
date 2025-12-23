---
{
    "title": "TO_IPV6_OR_DEFAULT",
    "language": "zh-CN",
    "description": "输入 IPv6 地址的字符串形式，并返回 IPv6 类型的值。对于无效输入或 NULL 输入，返回默认值 ::。"
}
---

## to_ipv6_or_default

## 描述
输入 IPv6 地址的字符串形式，并返回 IPv6 类型的值。对于无效输入或 NULL 输入，返回默认值 `::`。

## 语法
```sql
TO_IPV6_OR_DEFAULT(<ipv6_str>)
```

### 参数
- `<ipv6_str>`：字符串类型的 IPv6 地址

### 返回值
返回类型：IPv6

返回值含义：
- 返回 IPv6 类型值，其二进制形式等同于 `ipv6_string_to_num` 函数返回值的二进制形式
- 输入 NULL 或非法 IPv6 地址时返回 `::`

### 使用说明
- 等价于 `to_ipv6_or_default` → `IPv6` 类型，适合建表为 `IPv6` 列的场景
- 对于无效输入不会抛出异常，而是返回默认值 `::`

## 举例

将 IPv6 文本 `2001:1b70:a1:610::b102:2` 转为 `IPv6` 类型。
```sql
SELECT to_ipv6_or_default('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```

输入 NULL 返回默认值 `::`。
```sql
SELECT to_ipv6_or_default(NULL) as v6;
+----+
| v6 |
+----+
| :: |
+----+
```

非法 IPv6 文本返回默认值 `::`。
```sql
SELECT to_ipv6_or_default('not-an-ip') as v6;
+----+
| v6 |
+----+
| :: |
+----+
```

### Keywords

TO_IPV6_OR_DEFAULT
