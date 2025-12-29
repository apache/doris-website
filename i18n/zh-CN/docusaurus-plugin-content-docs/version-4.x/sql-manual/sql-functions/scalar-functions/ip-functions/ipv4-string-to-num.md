---
{
    "title": "IPV4_STRING_TO_NUM",
    "language": "zh-CN",
    "description": "获取包含 IPv4 地址的字符串，格式为 A.B.C.D（点分隔的十进制数字）。返回一个 BIGINT 数字，表示相应的网络字节序 IPv4 地址。"
}
---

## ipv4_string_to_num

## 描述
获取包含 IPv4 地址的字符串，格式为 A.B.C.D（点分隔的十进制数字）。返回一个 BIGINT 数字，表示相应的网络字节序 IPv4 地址。

## 语法
```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```

### 参数
- `<ipv4_string>`：IPv4 的字符串地址（形如 A.B.C.D）

### 返回值
返回类型：BIGINT

返回值含义：
- 返回对应 IPv4 地址的网络字节序整数表示
- 非法 IPv4 字符串或 `NULL` 输入将抛出异常

### 使用说明
- 仅支持标准 IPv4 文本，不支持 CIDR（如 `/24`）、端口（如 `:80`）或括号等扩展格式
- 不进行隐式修剪或类型转换，前后含空白的字符串视为无效
- 常用于与 `inet_ntoa`、`to_ipv4` 配合做互转

## 举例

将 IPv4 文本 `192.168.0.1` 转为对应的网络字节序整数。
```sql
select ipv4_string_to_num('192.168.0.1');
+-----------------------------------+
| ipv4_string_to_num('192.168.0.1') |
+-----------------------------------+
| 3232235521                        |
+-----------------------------------+
```

IPv4 边界值（最小与最大）。
```sql
select
  ipv4_string_to_num('0.0.0.0')             as min_v4,
  ipv4_string_to_num('255.255.255.255')     as max_v4;
+--------+-----------+
| min_v4| max_v4    |
+--------+-----------+
| 0      | 4294967295|
+--------+-----------+
```

非法输入触发异常（段值越界/含空白/NULL）。
```sql
select ipv4_string_to_num('256.0.0.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(' 1.1.1.1 ');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv4 value like '0.0.0.0' first
```

与 `inet_ntoa`/`ipv4_num_to_string` 和 `to_ipv4` 互转示例：IPv4 文本 → 整数 → IPv4 文本 → IPv4 类型。
```sql
-- 第一步：IPv4 文本转整数
SELECT ipv4_string_to_num('192.168.1.1') as ipv4_int;
+------------+
| ipv4_int   |
+------------+
| 3232235777 |
+------------+

-- 第二步：整数转回 IPv4 文本
SELECT ipv4_num_to_string(ipv4_string_to_num('192.168.1.1')) as back_to_text;
+----------------+
| back_to_text   |
+----------------+
| 192.168.1.1    |
+----------------+

-- 第三步：IPv4 文本转 IPv4 类型
SELECT to_ipv4(ipv4_num_to_string(ipv4_string_to_num('192.168.1.1'))) as ipv4_type;
+-------------+
| ipv4_type   |
+-------------+
| 192.168.1.1 |
+-------------+
```

### Keywords

IPV4_STRING_TO_NUM
