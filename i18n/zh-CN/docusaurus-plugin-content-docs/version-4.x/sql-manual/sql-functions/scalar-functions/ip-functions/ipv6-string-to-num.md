---
{
    "title": "IPV6_STRING_TO_NUM",
    "language": "zh-CN",
    "description": "IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。"
}
---

## ipv6_string_to_num

## 描述
IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。

## 语法
```sql
IPV6_STRING_TO_NUM(<ipv6_string>)
```

### 参数
- `<ipv6_string>`：字符串类型的 IPv6 地址

### 返回值
返回类型：VARCHAR（长度 16 的二进制）

返回值含义：
- 返回 IPv6 的 16 字节二进制编码
- 输入 NULL 会抛出异常
- 非法 IP 地址或 `NULL` 输入会抛出异常
- 若输入为有效 IPv4 文本，返回等效的 IPv6 地址（`::ffff:<ipv4>`）

### 使用说明
- 支持标准 IPv6 文本（含缩写与 `::` 省略形式）
- 如果输入为有效 IPv4 文本，则转换并返回 IPv6 的 IPv4-Mapped 表示
- 不支持 CIDR、端口、方括号等扩展形式

## 举例

将 IPv6 文本 `1111::ffff` 转为 16 字节二进制（用 hex 展示）。
```sql
select hex(ipv6_string_to_num('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 文本会自动映射为 IPv6（`::ffff:<ipv4>`），再以 16 字节二进制返回。
```sql
select hex(ipv6_string_to_num('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

输入 NULL 会抛出异常
```sql
select hex(ipv6_string_to_num(NULL));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv6 value like '::' first
```

非法输入会抛出异常。
```sql
select hex(ipv6_string_to_num('notaaddress'));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### Keywords

IPV6_STRING_TO_NUM