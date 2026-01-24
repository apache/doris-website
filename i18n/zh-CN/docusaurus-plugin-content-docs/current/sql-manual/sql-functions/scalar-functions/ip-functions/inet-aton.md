---
{
    "title": "inet_aton",
    "language": "zh-CN",
    "description": "别名 ipv4stringtonumornull。"
}
---

## inet_aton

别名 `ipv4_string_to_num_or_null`。

## 描述
将 IPv4 文本地址（A.B.C.D）转换为对应的整数。

## 语法
```sql
IPV4_STRING_TO_NUM_OR_NULL(<ipv4_string>)
```

### 参数
- `<ipv4_string>`：IPv4 的字符串地址（形如 A.B.C.D）

### 返回值
返回类型：BIGINT

返回值含义：
- 返回对应 IPv4 地址的网络字节序的整数表示
- 输入NULL 返回 `NULL`
- 非法 IPv4 字符串返回 `NULL`

### 使用说明
- 与 `ipv4_string_to_num_or_null` 行为一致：非法输入返回 `NULL`
- 常用于兼容 MySQL 的 `INET_ATON` 写法

## 举例

将 IPv4 文本 `192.168.0.1` 转为对应的网络字节序整数。
```sql
select ipv4_string_to_num_or_null('192.168.0.1');
+-------------------------------------------+
| ipv4_string_to_num_or_null('192.168.0.1') |
+-------------------------------------------+
|                                3232235521 |
+-------------------------------------------+
```

IPv4 边界值（最小与最大）。
```sql
select ipv4_string_to_num_or_null('0.0.0.0') as min_v4,
       ipv4_string_to_num_or_null('255.255.255.255') as max_v4;
+--------+------------+
| min_v4 | max_v4     |
+--------+------------+
|      0 | 4294967295 |
+--------+------------+
```

参数为 NULL 返回 NULL
```sql
select ipv4_string_to_num_or_null(NULL);
+----------------------------------+
| ipv4_string_to_num_or_null(NULL) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

非法输入时返回 NULL（不抛异常）。
```sql
select ipv4_string_to_num_or_null('256.0.0.1');
+-----------------------------------------+
| ipv4_string_to_num_or_null('256.0.0.1') |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

```sql
select ipv4_string_to_num_or_null(' 1.1.1.1 ');
+-----------------------------------------+
| ipv4_string_to_num_or_null(' 1.1.1.1 ') |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

```sql
select ipv4_string_to_num_or_null('invalid');
+---------------------------------------+
| ipv4_string_to_num_or_null('invalid') |
+---------------------------------------+
|                                  NULL |
+---------------------------------------+
```

### Keywords

INET_ATON, IPV4_STRING_TO_NUM_OR_NULL