---
{
    "title": "CUT_IPV6",
    "language": "zh-CN",
    "description": "根据 IPv6 地址的类型（IPv4 映射或纯 IPv6），从 IPv6 地址的末尾截取指定数量的字节，并返回截取后的 IPv6 地址字符串。"
}
---

## cut_ipv6

## 描述
根据 IPv6 地址的类型（IPv4 映射或纯 IPv6），从 IPv6 地址的末尾截取指定数量的字节，并返回截取后的 IPv6 地址字符串。

## 语法
```sql
CUT_IPV6(<ipv6_address>, <bytes_to_cut_for_ipv6>, <bytes_to_cut_for_ipv4>)
```

### 参数
- `<ipv6_address>`：IPv6 类型的地址
- `<bytes_to_cut_for_ipv6>`：纯 IPv6 地址要截取的字节数（TINYINT 类型）
- `<bytes_to_cut_for_ipv4>`：IPv4 映射地址要截取的字节数（TINYINT 类型）

### 返回值
返回类型：VARCHAR

返回值含义：
- 返回截取后的 IPv6 地址字符串
- 如果输入是 IPv4 映射地址，使用 `bytes_to_cut_for_ipv4` 参数
- 如果输入是纯 IPv6 地址，使用 `bytes_to_cut_for_ipv6` 参数
- `<ipv6_address>` `<bytes_to_cut_for_ipv6>` `<bytes_to_cut_for_ipv4>` 三个参数任意一个为NULL 返回 NULL

### 使用说明
- 自动检测 IPv6 地址是否为 IPv4 映射地址（格式为 `::ffff:IPv4`）
- 根据地址类型选择相应的截取字节数
- 截取操作从地址末尾开始，将指定数量的字节置零
- 参数值不能超过 16（IPv6 地址的总字节数）

## 举例

截取纯 IPv6 地址的末尾字节。
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 4) as cut_result;
+------------------+
| cut_result       |
+------------------+
| 2001:db8::       |
+------------------+
```

截取 IPv4 映射地址的末尾字节。
```sql
SELECT cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 4) as cut_result;
+----------------+
| cut_result     |
+----------------+
| ::ffff:0.0.0.0 |
+----------------+
```

使用不同的截取参数。
```sql
SELECT 
  cut_ipv6(to_ipv6('2001:db8::1'), 8, 4) as ipv6_cut_8,
  cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 8) as ipv4_cut_8;
+------------+------------+
| ipv6_cut_8 | ipv4_cut_8 |
+------------+------------+
| 2001:db8:: | ::         |
+------------+------------+
```

参数为 NULL 返回 NULL
```sql 
 select cut_ipv6(NULL, NULL, NULL);
+----------------------------+
| cut_ipv6(NULL, NULL, NULL) |
+----------------------------+
| NULL                       |
+----------------------------+

select cut_ipv6(to_ipv6("::"), NULL, 0);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), NULL, 0) |
+----------------------------------+
| NULL                             |
+----------------------------------+

select cut_ipv6(to_ipv6("::"), 4, NULL);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), 4, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

参数值超出范围会抛出异常。
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 17, 4);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 2 TINYINT of function cut_ipv6

SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 122);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 3 TINYINT of function cut_ipv6
```

### Keywords

CUT_IPV6

