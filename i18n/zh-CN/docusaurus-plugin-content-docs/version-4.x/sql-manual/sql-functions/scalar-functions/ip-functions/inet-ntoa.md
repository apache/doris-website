---
{
    "title": "IPV4_NUM_TO_STRING",
    "language": "zh-CN",
    "description": "别名 ipv4numtostring。"
}
---

## inet_ntoa
别名 `ipv4_num_to_string`。

## 描述
接受一个类型为 Int8、Int16、Int32、Int64 且大端表示的 IPv4 的地址，返回相应 IPv4 的字符串表现形式，格式为 A.B.C.D（以点分割的十进制数字）。

## 语法
```sql
IPV4_NUM_TO_STRING(<ipv4_num>)
```

### 参数
- `<ipv4_num>`：由 IPv4 地址转换而来的整数值（支持 Int8/Int16/Int32/Int64）

### 返回值
返回类型：VARCHAR

返回值含义：
- 返回 IPv4 的文本形式（A.B.C.D）
- 输出参数为 NULL 返回 NULL
- 负数或超过 `4294967295` 的输入返回 `NULL`

### 使用说明
- 与 `ipv4_num_to_string` 行为一致：不接受超范围值；负数与大于 4294967295 的值返回 `NULL`
- 常用于兼容 MySQL 的 `INET_NTOA` 写法

## 举例

将整数 `3232235521` 转为 IPv4 文本。
```sql
select ipv4_num_to_string(3232235521);
+--------------------------------+
| ipv4_num_to_string(3232235521) |
+--------------------------------+
| 192.168.0.1                    |
+--------------------------------+
```

IPv4 数值边界值（最小与最大）。
```sql
select ipv4_num_to_string(0) as min_v4, ipv4_num_to_string(4294967295) as max_v4;
+---------+---------------+
| min_v4 | max_v4        |
+---------+---------------+
| 0.0.0.0| 255.255.255.255|
+---------+---------------+
```

参数为 NULL 返回 NULL
```sql
select ipv4_num_to_string(NULL);
+--------------------------+
| ipv4_num_to_string(NULL) |
+--------------------------+
| NULL                     |
+--------------------------+
```

非法数值输入时返回 NULL（不抛异常）。
```sql
select ipv4_num_to_string(-1);
+--------------------------+
| ipv4_num_to_string(-1)   |
+--------------------------+
| NULL                     |
+--------------------------+
```

```sql
select ipv4_num_to_string(4294967296);
+--------------------------------+
| ipv4_num_to_string(4294967296) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```

### Keywords

INET_NTOA, IPV4_NUM_TO_STRING