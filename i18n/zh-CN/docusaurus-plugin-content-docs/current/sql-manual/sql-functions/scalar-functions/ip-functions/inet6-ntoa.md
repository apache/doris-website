---
{
    "title": "IPV6_NUM_TO_STRING",
    "language": "zh-CN",
    "description": "别名 ipv6numtostring。"
}
---

## inet6_ntoa

别名 `ipv6_num_to_string`。

## 描述
将 IPv6 地址转换为标准文本表示，以文本格式返回此地址的字符串。

## 语法
```sql
IPV6_NUM_TO_STRING(<ipv6_num>)
```

### 参数
- `<ipv6_num>`：IPv6 类型列的值，或长度为 16 的二进制字符串

### 返回值
返回类型：VARCHAR

返回值含义：
- 返回 IPv6 文本表示
- 输入参数为 NULL 返回 NULL
- 对于无效输入（例如空字符串、长度不为 16 的二进制字符串等）返回 `NULL`

### 使用说明
- 与 `ipv6_num_to_string` 行为一致：长度不是 16 的二进制输入会返回 NULL
- 常用于兼容 MySQL 的 `INET6_NTOA` 写法

## 举例

将 16 字节二进制（通过 `unhex` 构造）转为 IPv6 文本。
```sql
select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr;
+--------------+
| addr         |
+--------------+
| 2a02:6b8::11 |
+--------------+
```

参数为 NULL 返回 NULL
```sql
select ipv6_num_to_string(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

无效的二进制输入（非 16 字节）返回 NULL。
```sql
select ipv6_num_to_string('-23vno12i34nlfwlsj') as invalid;
+----------+
| invalid  |
+----------+
| NULL     |
+----------+
```

### Keywords

INET6_NTOA, IPV6_NUM_TO_STRING