---
{
    "title": "TO_IPV4",
    "language": "zh-CN",
    "description": "输入 IPv4 地址的字符串形式，并返回 IPv4 类型的值。"
}
---

## to_ipv4

## 描述
输入 IPv4 地址的字符串形式，并返回 IPv4 类型的值。

## 语法
```sql
TO_IPV4(<ipv4_str>)
```

### 参数
- `<ipv4_str>`：字符串类型的 IPv4 地址

### 返回值
返回类型：IPv4

返回值含义：
- 返回 IPv4 类型值，其二进制形式等同于 `ipv4_string_to_num` 的返回值
- 输入 NULL 会抛出异常
- 非法 IPv4 地址或 `NULL` 输入会抛出异常

### 使用说明
- 等价于 `to_ipv4` → `IPv4` 类型，适合建表为 `IPv4` 列的场景

## 举例

将 IPv4 文本 `255.255.255.255` 转为 `IPv4` 类型。
```sql
SELECT to_ipv4('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

输入 NULL 会抛出异常
```sql
SELECT to_ipv4(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv4 must be String, not NULL
```

非法 IPv4 文本会抛出异常。
```sql
SELECT to_ipv4('256.1.1.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value '256.1.1.1'
```

### Keywords

TO_IPV4