---
{
    "title": "IS_IPV4_STRING",
    "language": "zh-CN",
    "description": "检查输入的字符串是否为有效的 IPv4 地址格式。返回 1 表示是有效的 IPv4 地址，返回 0 表示不是。"
}
---

## is_ipv4_string

## 描述
检查输入的字符串是否为有效的 IPv4 地址格式。返回 1 表示是有效的 IPv4 地址，返回 0 表示不是。

## 别名
- IS_IPV4

## 语法
```sql
IS_IPV4_STRING(<ipv4_str>)
```

### 参数
- `<ipv4_str>`：要检查的字符串

### 返回值
返回类型：TINYINT

返回值含义：
- 返回 1：表示输入是有效的 IPv4 地址格式
- 返回 0：表示输入不是有效的 IPv4 地址格式
- 输入 NULL 时返回 NULL

### 使用说明
- 仅检查字符串格式是否符合 IPv4 地址规范（A.B.C.D 格式）
- 不进行实际的 IP 地址转换，仅做格式验证
- 支持 NULL 输入，返回 NULL

## 举例

检查有效的 IPv4 地址格式。
```sql
SELECT is_ipv4_string('192.168.1.1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

检查边界值 IPv4 地址。
```sql
SELECT 
  is_ipv4_string('0.0.0.0') as min_ip,
  is_ipv4_string('255.255.255.255') as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```

检查无效的 IPv4 地址格式。
```sql
SELECT 
  is_ipv4_string('256.1.1.1') as invalid_range,
  is_ipv4_string('192.168.1') as missing_octet,
  is_ipv4_string('192.168.1.1.1') as extra_octet,
  is_ipv4_string('not-an-ip') as not_ip;
+---------------+----------------+--------------+--------+
| invalid_range | missing_octet | extra_octet | not_ip |
+---------------+----------------+--------------+--------+
| 0             | 0              | 0            | 0      |
+---------------+----------------+--------------+--------+
```

检查 NULL 输入。
```sql
SELECT is_ipv4_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### Keywords

IS_IPV4_STRING
