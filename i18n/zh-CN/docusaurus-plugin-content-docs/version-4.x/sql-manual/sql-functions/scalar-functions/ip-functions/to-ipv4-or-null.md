---
{
    "title": "TO_IPV4_OR_NULL",
    "language": "zh-CN",
    "description": "输入 IPv4 地址的字符串形式，并返回 IPv4 类型的值。对于无效输入或 NULL 输入，返回 NULL。"
}
---

## to_ipv4_or_null

## 描述
输入 IPv4 地址的字符串形式，并返回 IPv4 类型的值。对于无效输入或 NULL 输入，返回 NULL。

## 语法
```sql
TO_IPV4_OR_NULL(<ipv4_str>)
```

### 参数
- `<ipv4_str>`：字符串类型的 IPv4 地址

### 返回值
返回类型：IPv4

返回值含义：
- 返回 IPv4 类型值，其二进制形式等同于 `ipv4_string_to_num` 的返回值
- 输入 NULL 或非法 IPv4 地址时返回 NULL

### 使用说明
- 等价于 `to_ipv4_or_null` → `IPv4` 类型，适合建表为 `IPv4` 列的场景
- 对于无效输入不会抛出异常，而是返回 NULL

## 举例

将 IPv4 文本 `255.255.255.255` 转为 `IPv4` 类型。
```sql
SELECT to_ipv4_or_null('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

输入 NULL 返回 NULL。
```sql
SELECT to_ipv4_or_null(NULL) as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

非法 IPv4 文本返回 NULL。
```sql
SELECT to_ipv4_or_null('256.1.1.1') as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

### Keywords

TO_IPV4_OR_NULL
