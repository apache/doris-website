---
{
    "title": "IS_IPV6_STRING",
    "language": "zh-CN",
    "description": "检查输入的字符串是否为有效的 IPv6 地址格式。返回 1 表示是有效的 IPv6 地址，返回 0 表示不是。"
}
---

## is_ipv6_string

## 描述
检查输入的字符串是否为有效的 IPv6 地址格式。返回 1 表示是有效的 IPv6 地址，返回 0 表示不是。

## 别名
- IS_IPV6

## 语法
```sql
IS_IPV6_STRING(<ipv6_str>)
```

### 参数
- `<ipv6_str>`：要检查的字符串

### 返回值
返回类型：TINYINT

返回值含义：
- 返回 1：表示输入是有效的 IPv6 地址格式
- 返回 0：表示输入不是有效的 IPv6 地址格式
- 输入 NULL 时返回 NULL

### 使用说明
- 仅检查字符串格式是否符合 IPv6 地址规范
- 不进行实际的 IP 地址转换，仅做格式验证
- 支持 NULL 输入，返回 NULL

## 举例

检查有效的 IPv6 地址格式。
```sql
SELECT is_ipv6_string('2001:db8::1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

检查各种 IPv6 地址格式。
```sql
SELECT 
  is_ipv6_string('::1') as localhost,
  is_ipv6_string('2001:db8::1') as standard,
  is_ipv6_string('2001:db8:0:0:0:0:0:1') as expanded;
+-----------+----------+----------+
| localhost | standard | expanded |
+-----------+----------+----------+
| 1         | 1        | 1        |
+-----------+----------+----------+
```

检查无效的 IPv6 地址格式。
```sql
SELECT 
  is_ipv6_string('2001:db8::1::2') as double_colon,
  is_ipv6_string('2001:db8:1') as too_short,
  is_ipv6_string('2001:db8:1:2:3:4:5:6:7') as too_long,
  is_ipv6_string('not-an-ipv6') as not_ipv6;
+--------------+-----------+----------+----------+
| double_colon | too_short | too_long | not_ipv6 |
+--------------+-----------+----------+----------+
| 0            | 0         | 0        | 0        |
+--------------+-----------+----------+----------+
```

检查 NULL 输入。
```sql
SELECT is_ipv6_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### Keywords

IS_IPV6_STRING
