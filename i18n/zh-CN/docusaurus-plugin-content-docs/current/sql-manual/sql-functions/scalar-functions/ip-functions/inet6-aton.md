---
{
    "title": "IPV6_STRING_TO_NUM_OR_NULL",
    "language": "zh-CN",
    "description": "别名 ipv6stringtonumornull。"
}
---

## inet6_aton

别名 `ipv6_string_to_num_or_null`。

## 描述
将 IPv6 文本地址转换为 16 字节二进制表示。

## 语法
```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```

### 参数
- `<ipv6_string>`：字符串类型的 IPv6 地址

### 返回值
返回类型：VARCHAR（长度 16 的二进制，可为 NULL）

返回值含义：
- 返回 IPv6 的 16 字节二进制编码
- 输入 NULL 返回 `NULL`
- 非法 IPv6 字符串返回 `NULL`
- 若输入为 IPv4 文本，返回等效的 IPv6 地址（`::ffff:<ipv4>`）

### 使用说明
- 与 `ipv6_string_to_num_or_null` 行为一致：非法输入返回 `NULL`
- 常用于兼容 MySQL 的 `INET6_ATON` 写法

## 举例

将 IPv6 文本 `1111::ffff` 转为 16 字节二进制（用 hex 展示）。
```sql
select hex(ipv6_string_to_num_or_null('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 文本会自动映射为 IPv6（`::ffff:<ipv4>`），再以 16 字节二进制返回。
```sql
select hex(ipv6_string_to_num_or_null('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

参数为 NULL 返回 NULL
```sql
select hex(ipv6_string_to_num_or_null(NULL)) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

非法输入时返回 NULL（不抛异常）。
```sql
select hex(ipv6_string_to_num_or_null('notaaddress')) as invalid;
+----------+
| invalid  |
+----------+
| NULL     |
+----------+
```

### Keywords

INET6_ATON, IPV6_STRING_TO_NUM_OR_NULL