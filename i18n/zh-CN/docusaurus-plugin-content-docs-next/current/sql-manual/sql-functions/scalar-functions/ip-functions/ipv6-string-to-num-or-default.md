---
{
    "title": "IPV6_STRING_TO_NUM_OR_DEFAULT",
    "language": "zh-CN",
    "description": "IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。"
}
---

## ipv6_string_to_num_or_default

## 描述
IPv6NumToString 的反向函数，它接受一个 IP 地址字符串并返回二进制格式的 IPv6 地址。

## 语法
```sql
IPV6_STRING_TO_NUM_OR_DEFAULT(<ipv6_string>)
```

### 参数
- `<ipv6_string>`：字符串类型的 IPv6 地址

### 返回值
返回类型：VARCHAR（长度 16 的二进制）

返回值含义：
- 返回 IPv6 的 16 字节二进制编码
- 输入 NULL 返回全 0 的 16 字节二进制
- 非法 IP 地址返回全 0 的 16 字节二进制（不抛异常）
- 若输入为有效 IPv4 文本，返回等效的 IPv6 地址（`::ffff:<ipv4>`）

### 使用说明
- 该函数不会抛出异常，非法输入统一返回 16 个 `0` 的二进制
- 支持 IPv6 文本缩写；IPv4 文本会被映射为 IPv6 表示
- 适用于容错型批量转换

## 举例

将 IPv6 文本 `1111::ffff` 转为 16 字节二进制（用 hex 展示）。
```sql
select hex(ipv6_string_to_num_or_default('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 文本会自动映射为 IPv6（`::ffff:<ipv4>`），再以 16 字节二进制返回。
```sql
select hex(ipv6_string_to_num_or_default('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

参数为 NULL 返回全 0 的 16 字节二进制
```sql
select hex(ipv6_string_to_num_or_default(NULL)) as null_result;
+----------------------------------+
| null_result                      |
+----------------------------------+
| 00000000000000000000000000000000 |
+----------------------------------+
```

非法输入返回全 0 的 16 字节二进制（不抛异常）。
```sql
select hex(ipv6_string_to_num_or_default('notaaddress')) as invalid;
+----------------------------------+
| invalid                          |
+----------------------------------+
| 00000000000000000000000000000000 |
+----------------------------------+
```

### Keywords

IPV6_STRING_TO_NUM_OR_DEFAULT